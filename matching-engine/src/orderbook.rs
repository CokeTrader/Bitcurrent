// BitCurrent Matching Engine - Orderbook Implementation
// Price-time priority FIFO matching with BTreeMap for efficient price levels

use crate::kafka::producer::KafkaProducer;
use crate::matching::MatchingEngine;
use crate::sequence::SequenceManager;
use crate::snapshot::SnapshotManager;
use crate::types::{MatchResult, Order, Side, Trade};
use anyhow::Result;
use rust_decimal::Decimal;
use std::collections::{BTreeMap, HashMap, VecDeque};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, info, warn};
use uuid::Uuid;

/// Single orderbook for a trading pair
#[derive(Debug)]
pub struct OrderBook {
    pub symbol: String,
    /// Bids (buy orders) - descending price order
    pub bids: BTreeMap<Decimal, VecDeque<Order>>,
    /// Asks (sell orders) - ascending price order
    pub asks: BTreeMap<Decimal, VecDeque<Order>>,
    /// Order lookup by ID for O(1) cancellation
    pub order_index: HashMap<Uuid, Order>,
    /// Sequence manager for event sourcing
    sequence_manager: SequenceManager,
}

impl OrderBook {
    pub fn new(symbol: String) -> Self {
        Self {
            symbol,
            bids: BTreeMap::new(),
            asks: BTreeMap::new(),
            order_index: HashMap::new(),
            sequence_manager: SequenceManager::new(),
        }
    }

    /// Submit a new order to the orderbook
    pub fn submit_order(&mut self, mut order: Order) -> Result<MatchResult> {
        order.sequence_id = self.sequence_manager.next();
        
        debug!(
            "Submitting order: {} {} {} @ {:?} qty: {}",
            order.id, order.side, order.symbol, order.price, order.quantity
        );

        // Validate order
        if let Err(e) = self.validate_order(&order) {
            warn!("Order validation failed: {}", e);
            return Ok(MatchResult::Rejected(e.to_string()));
        }

        // Match order against orderbook
        let matching_engine = MatchingEngine::new();
        let result = matching_engine.match_order(self, order)?;

        Ok(result)
    }

    /// Cancel an existing order
    pub fn cancel_order(&mut self, order_id: Uuid) -> Result<Option<Order>> {
        if let Some(mut order) = self.order_index.remove(&order_id) {
            order.cancel();
            
            // Remove from price level
            let price_levels = match order.side {
                Side::Buy => &mut self.bids,
                Side::Sell => &mut self.asks,
            };

            if let Some(price) = order.price {
                if let Some(queue) = price_levels.get_mut(&price) {
                    queue.retain(|o| o.id != order_id);
                    if queue.is_empty() {
                        price_levels.remove(&price);
                    }
                }
            }

            info!("Order cancelled: {}", order_id);
            return Ok(Some(order));
        }

        warn!("Order not found for cancellation: {}", order_id);
        Ok(None)
    }

    /// Add a limit order to the orderbook
    pub fn add_limit_order(&mut self, order: Order) {
        let price = order.price.expect("Limit order must have price");
        
        // Add to appropriate side
        let price_levels = match order.side {
            Side::Buy => &mut self.bids,
            Side::Sell => &mut self.asks,
        };

        price_levels
            .entry(price)
            .or_insert_with(VecDeque::new)
            .push_back(order.clone());

        // Add to index
        self.order_index.insert(order.id, order);
    }

    /// Get best bid price
    pub fn best_bid(&self) -> Option<Decimal> {
        self.bids.keys().next_back().copied()
    }

    /// Get best ask price
    pub fn best_ask(&self) -> Option<Decimal> {
        self.asks.keys().next().copied()
    }

    /// Get mid price
    pub fn mid_price(&self) -> Option<Decimal> {
        match (self.best_bid(), self.best_ask()) {
            (Some(bid), Some(ask)) => Some((bid + ask) / Decimal::new(2, 0)),
            _ => None,
        }
    }

    /// Get spread
    pub fn spread(&self) -> Option<Decimal> {
        match (self.best_bid(), self.best_ask()) {
            (Some(bid), Some(ask)) => Some(ask - bid),
            _ => None,
        }
    }

    /// Get orderbook depth (top N levels)
    pub fn get_depth(&self, depth: usize) -> (Vec<(Decimal, Decimal)>, Vec<(Decimal, Decimal)>) {
        let bids: Vec<(Decimal, Decimal)> = self
            .bids
            .iter()
            .rev()
            .take(depth)
            .map(|(price, orders)| {
                let total_qty: Decimal = orders.iter().map(|o| o.remaining_quantity).sum();
                (*price, total_qty)
            })
            .collect();

        let asks: Vec<(Decimal, Decimal)> = self
            .asks
            .iter()
            .take(depth)
            .map(|(price, orders)| {
                let total_qty: Decimal = orders.iter().map(|o| o.remaining_quantity).sum();
                (*price, total_qty)
            })
            .collect();

        (bids, asks)
    }

    /// Validate order before submission
    fn validate_order(&self, order: &Order) -> Result<()> {
        // Check symbol matches
        if order.symbol != self.symbol {
            anyhow::bail!("Order symbol {} does not match orderbook {}", order.symbol, self.symbol);
        }

        // Check quantity is positive
        if order.quantity <= Decimal::ZERO {
            anyhow::bail!("Order quantity must be positive");
        }

        // Check price is valid for limit orders
        if let Some(price) = order.price {
            if price <= Decimal::ZERO {
                anyhow::bail!("Order price must be positive");
            }
        }

        // Post-only orders must be limit orders
        if order.post_only && order.price.is_none() {
            anyhow::bail!("Post-only orders must have a price");
        }

        Ok(())
    }

    /// Get current sequence number
    pub fn current_sequence(&self) -> u64 {
        self.sequence_manager.current()
    }

    /// Clear the orderbook (for testing/reset)
    pub fn clear(&mut self) {
        self.bids.clear();
        self.asks.clear();
        self.order_index.clear();
    }

    /// Get total number of active orders
    pub fn order_count(&self) -> usize {
        self.order_index.len()
    }
}

/// Manages multiple orderbooks (one per trading pair)
#[derive(Clone)]
pub struct OrderBookManager {
    orderbooks: Arc<RwLock<HashMap<String, OrderBook>>>,
    snapshot_interval: u64,
    snapshot_path: String,
    kafka_producer: Arc<KafkaProducer>,
}

impl OrderBookManager {
    pub fn new(snapshot_interval: u64, snapshot_path: String, kafka_producer: KafkaProducer) -> Self {
        Self {
            orderbooks: Arc::new(RwLock::new(HashMap::new())),
            snapshot_interval,
            snapshot_path,
            kafka_producer: Arc::new(kafka_producer),
        }
    }

    /// Get or create orderbook for a symbol
    pub async fn get_or_create_orderbook(&self, symbol: &str) -> OrderBook {
        let mut orderbooks = self.orderbooks.write().await;
        orderbooks
            .entry(symbol.to_string())
            .or_insert_with(|| OrderBook::new(symbol.to_string()))
            .clone()
    }

    /// Submit order to the appropriate orderbook
    pub async fn submit_order(&self, order: Order) -> Result<MatchResult> {
        let symbol = order.symbol.clone();
        let mut orderbooks = self.orderbooks.write().await;
        
        let orderbook = orderbooks
            .entry(symbol.clone())
            .or_insert_with(|| OrderBook::new(symbol));

        let result = orderbook.submit_order(order)?;

        // Publish trades to Kafka
        if let MatchResult::Filled(ref trades) | MatchResult::PartiallyFilled(ref trades, _) = result {
            for trade in trades {
                if let Err(e) = self.kafka_producer.publish_trade(trade).await {
                    warn!("Failed to publish trade to Kafka: {}", e);
                }
            }
        }

        // Check if snapshot is needed
        if orderbook.current_sequence() % self.snapshot_interval == 0 {
            self.create_snapshot(&symbol, orderbook).await?;
        }

        Ok(result)
    }

    /// Cancel order from the appropriate orderbook
    pub async fn cancel_order(&self, symbol: &str, order_id: Uuid) -> Result<Option<Order>> {
        let mut orderbooks = self.orderbooks.write().await;
        
        if let Some(orderbook) = orderbooks.get_mut(symbol) {
            return orderbook.cancel_order(order_id);
        }

        Ok(None)
    }

    /// Get orderbook depth for a symbol
    pub async fn get_depth(&self, symbol: &str, depth: usize) -> Option<(Vec<(Decimal, Decimal)>, Vec<(Decimal, Decimal)>)> {
        let orderbooks = self.orderbooks.read().await;
        orderbooks.get(symbol).map(|ob| ob.get_depth(depth))
    }

    /// Create snapshot of orderbook
    async fn create_snapshot(&self, symbol: &str, orderbook: &OrderBook) -> Result<()> {
        let snapshot_manager = SnapshotManager::new(&self.snapshot_path);
        snapshot_manager.save_snapshot(symbol, orderbook).await?;
        info!("Created snapshot for {} at sequence {}", symbol, orderbook.current_sequence());
        Ok(())
    }

    /// Restore orderbooks from snapshots
    pub async fn restore_from_snapshot(&self) -> Result<()> {
        let snapshot_manager = SnapshotManager::new(&self.snapshot_path);
        let mut orderbooks = self.orderbooks.write().await;

        // Find all snapshot files and restore
        let symbols = snapshot_manager.list_snapshots().await?;
        for symbol in symbols {
            if let Ok(orderbook) = snapshot_manager.load_snapshot(&symbol).await {
                info!("Restored orderbook for {} from snapshot", symbol);
                orderbooks.insert(symbol, orderbook);
            }
        }

        Ok(())
    }

    /// Get all active symbols
    pub async fn get_symbols(&self) -> Vec<String> {
        let orderbooks = self.orderbooks.read().await;
        orderbooks.keys().cloned().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{OrderType, TimeInForce};

    fn create_test_order(side: Side, price: Decimal, quantity: Decimal) -> Order {
        Order::new(
            Uuid::new_v4(),
            "BTC-GBP".to_string(),
            side,
            OrderType::Limit,
            Some(price),
            quantity,
            TimeInForce::GTC,
            false,
            None,
            0,
        )
    }

    #[test]
    fn test_orderbook_creation() {
        let ob = OrderBook::new("BTC-GBP".to_string());
        assert_eq!(ob.symbol, "BTC-GBP");
        assert_eq!(ob.order_count(), 0);
        assert!(ob.best_bid().is_none());
        assert!(ob.best_ask().is_none());
    }

    #[test]
    fn test_add_limit_order() {
        let mut ob = OrderBook::new("BTC-GBP".to_string());
        let order = create_test_order(Side::Buy, Decimal::new(45000, 0), Decimal::new(1, 0));
        
        ob.add_limit_order(order.clone());
        
        assert_eq!(ob.order_count(), 1);
        assert_eq!(ob.best_bid(), Some(Decimal::new(45000, 0)));
    }

    #[test]
    fn test_best_bid_ask() {
        let mut ob = OrderBook::new("BTC-GBP".to_string());
        
        let buy1 = create_test_order(Side::Buy, Decimal::new(45000, 0), Decimal::new(1, 0));
        let buy2 = create_test_order(Side::Buy, Decimal::new(44900, 0), Decimal::new(1, 0));
        let sell1 = create_test_order(Side::Sell, Decimal::new(45100, 0), Decimal::new(1, 0));
        let sell2 = create_test_order(Side::Sell, Decimal::new(45200, 0), Decimal::new(1, 0));
        
        ob.add_limit_order(buy1);
        ob.add_limit_order(buy2);
        ob.add_limit_order(sell1);
        ob.add_limit_order(sell2);
        
        assert_eq!(ob.best_bid(), Some(Decimal::new(45000, 0)));
        assert_eq!(ob.best_ask(), Some(Decimal::new(45100, 0)));
        assert_eq!(ob.spread(), Some(Decimal::new(100, 0)));
    }

    #[test]
    fn test_cancel_order() {
        let mut ob = OrderBook::new("BTC-GBP".to_string());
        let order = create_test_order(Side::Buy, Decimal::new(45000, 0), Decimal::new(1, 0));
        let order_id = order.id;
        
        ob.add_limit_order(order);
        assert_eq!(ob.order_count(), 1);
        
        let cancelled = ob.cancel_order(order_id).unwrap();
        assert!(cancelled.is_some());
        assert_eq!(ob.order_count(), 0);
    }

    #[test]
    fn test_get_depth() {
        let mut ob = OrderBook::new("BTC-GBP".to_string());
        
        // Add multiple bid levels
        ob.add_limit_order(create_test_order(Side::Buy, Decimal::new(45000, 0), Decimal::new(1, 0)));
        ob.add_limit_order(create_test_order(Side::Buy, Decimal::new(45000, 0), Decimal::new(2, 0)));
        ob.add_limit_order(create_test_order(Side::Buy, Decimal::new(44900, 0), Decimal::new(1, 0)));
        
        // Add multiple ask levels
        ob.add_limit_order(create_test_order(Side::Sell, Decimal::new(45100, 0), Decimal::new(1, 0)));
        ob.add_limit_order(create_test_order(Side::Sell, Decimal::new(45200, 0), Decimal::new(2, 0)));
        
        let (bids, asks) = ob.get_depth(10);
        
        assert_eq!(bids.len(), 2);
        assert_eq!(asks.len(), 2);
        assert_eq!(bids[0].0, Decimal::new(45000, 0));
        assert_eq!(bids[0].1, Decimal::new(3, 0)); // 1 + 2
    }
}



