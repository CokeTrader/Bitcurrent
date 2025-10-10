// BitCurrent Matching Engine - Core Data Types

use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use std::fmt;
use uuid::Uuid;

/// Order side (buy or sell)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Side {
    Buy,
    Sell,
}

impl fmt::Display for Side {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Side::Buy => write!(f, "buy"),
            Side::Sell => write!(f, "sell"),
        }
    }
}

/// Order type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OrderType {
    Market,
    Limit,
    Stop,
    StopLimit,
}

/// Time in force
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TimeInForce {
    /// Good Till Cancelled
    GTC,
    /// Immediate or Cancel
    IOC,
    /// Fill or Kill
    FOK,
    /// Good Till Date
    GTD,
}

/// Order status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OrderStatus {
    New,
    Partial,
    Filled,
    Cancelled,
    Rejected,
    Expired,
}

/// Trading order
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    pub id: Uuid,
    pub account_id: Uuid,
    pub symbol: String,
    pub side: Side,
    pub order_type: OrderType,
    pub price: Option<Decimal>,
    pub quantity: Decimal,
    pub filled_quantity: Decimal,
    pub remaining_quantity: Decimal,
    pub status: OrderStatus,
    pub time_in_force: TimeInForce,
    pub post_only: bool,
    pub reduce_only: bool,
    pub client_order_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub sequence_id: u64,
}

impl Order {
    /// Create a new order
    pub fn new(
        account_id: Uuid,
        symbol: String,
        side: Side,
        order_type: OrderType,
        price: Option<Decimal>,
        quantity: Decimal,
        time_in_force: TimeInForce,
        post_only: bool,
        client_order_id: Option<String>,
        sequence_id: u64,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            account_id,
            symbol,
            side,
            order_type,
            price,
            quantity,
            filled_quantity: Decimal::ZERO,
            remaining_quantity: quantity,
            status: OrderStatus::New,
            time_in_force,
            post_only,
            reduce_only: false,
            client_order_id,
            created_at: now,
            updated_at: now,
            sequence_id,
        }
    }

    /// Fill the order (partially or fully)
    pub fn fill(&mut self, quantity: Decimal) {
        self.filled_quantity += quantity;
        self.remaining_quantity -= quantity;
        self.updated_at = Utc::now();

        if self.remaining_quantity == Decimal::ZERO {
            self.status = OrderStatus::Filled;
        } else {
            self.status = OrderStatus::Partial;
        }
    }

    /// Cancel the order
    pub fn cancel(&mut self) {
        self.status = OrderStatus::Cancelled;
        self.updated_at = Utc::now();
    }

    /// Check if order is active (can be matched)
    pub fn is_active(&self) -> bool {
        matches!(self.status, OrderStatus::New | OrderStatus::Partial)
    }

    /// Check if order is fully filled
    pub fn is_filled(&self) -> bool {
        self.status == OrderStatus::Filled
    }

    /// Get effective price for market orders
    pub fn effective_price(&self, market_price: Decimal) -> Decimal {
        match self.order_type {
            OrderType::Market => market_price,
            _ => self.price.unwrap_or(market_price),
        }
    }
}

/// Executed trade
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trade {
    pub id: Uuid,
    pub symbol: String,
    pub buyer_order_id: Uuid,
    pub seller_order_id: Uuid,
    pub buyer_account_id: Uuid,
    pub seller_account_id: Uuid,
    pub price: Decimal,
    pub quantity: Decimal,
    pub buyer_fee: Decimal,
    pub seller_fee: Decimal,
    pub executed_at: DateTime<Utc>,
    pub sequence_id: u64,
}

impl Trade {
    /// Create a new trade
    pub fn new(
        symbol: String,
        buyer_order: &Order,
        seller_order: &Order,
        price: Decimal,
        quantity: Decimal,
        buyer_fee: Decimal,
        seller_fee: Decimal,
        sequence_id: u64,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            symbol,
            buyer_order_id: buyer_order.id,
            seller_order_id: seller_order.id,
            buyer_account_id: buyer_order.account_id,
            seller_account_id: seller_order.account_id,
            price,
            quantity,
            buyer_fee,
            seller_fee,
            executed_at: Utc::now(),
            sequence_id,
        }
    }
}

/// Orderbook snapshot for a price level
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceLevel {
    pub price: Decimal,
    pub quantity: Decimal,
    pub order_count: usize,
}

/// Market data update
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketDataUpdate {
    pub symbol: String,
    pub bids: Vec<PriceLevel>,
    pub asks: Vec<PriceLevel>,
    pub last_trade_price: Option<Decimal>,
    pub timestamp: DateTime<Utc>,
    pub sequence_id: u64,
}

/// Order matching result
#[derive(Debug)]
pub enum MatchResult {
    /// Order fully filled
    Filled(Vec<Trade>),
    /// Order partially filled with remaining quantity
    PartiallyFilled(Vec<Trade>, Order),
    /// Order added to orderbook (no match)
    Added(Order),
    /// Order rejected
    Rejected(String),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_order_creation() {
        let order = Order::new(
            Uuid::new_v4(),
            "BTC-GBP".to_string(),
            Side::Buy,
            OrderType::Limit,
            Some(Decimal::new(45000, 0)),
            Decimal::new(1, 0),
            TimeInForce::GTC,
            false,
            None,
            1,
        );

        assert_eq!(order.status, OrderStatus::New);
        assert_eq!(order.filled_quantity, Decimal::ZERO);
        assert_eq!(order.remaining_quantity, Decimal::new(1, 0));
        assert!(order.is_active());
    }

    #[test]
    fn test_order_fill() {
        let mut order = Order::new(
            Uuid::new_v4(),
            "BTC-GBP".to_string(),
            Side::Buy,
            OrderType::Limit,
            Some(Decimal::new(45000, 0)),
            Decimal::new(2, 0),
            TimeInForce::GTC,
            false,
            None,
            1,
        );

        // Partial fill
        order.fill(Decimal::new(1, 0));
        assert_eq!(order.status, OrderStatus::Partial);
        assert_eq!(order.filled_quantity, Decimal::new(1, 0));
        assert_eq!(order.remaining_quantity, Decimal::new(1, 0));

        // Complete fill
        order.fill(Decimal::new(1, 0));
        assert_eq!(order.status, OrderStatus::Filled);
        assert_eq!(order.filled_quantity, Decimal::new(2, 0));
        assert_eq!(order.remaining_quantity, Decimal::ZERO);
        assert!(order.is_filled());
    }

    #[test]
    fn test_trade_creation() {
        let buyer = Order::new(
            Uuid::new_v4(),
            "BTC-GBP".to_string(),
            Side::Buy,
            OrderType::Limit,
            Some(Decimal::new(45000, 0)),
            Decimal::new(1, 0),
            TimeInForce::GTC,
            false,
            None,
            1,
        );

        let seller = Order::new(
            Uuid::new_v4(),
            "BTC-GBP".to_string(),
            Side::Sell,
            OrderType::Limit,
            Some(Decimal::new(45000, 0)),
            Decimal::new(1, 0),
            TimeInForce::GTC,
            false,
            None,
            2,
        );

        let trade = Trade::new(
            "BTC-GBP".to_string(),
            &buyer,
            &seller,
            Decimal::new(45000, 0),
            Decimal::new(1, 0),
            Decimal::new(45, 1), // 0.1% fee
            Decimal::new(675, 2), // 0.15% fee
            3,
        );

        assert_eq!(trade.buyer_order_id, buyer.id);
        assert_eq!(trade.seller_order_id, seller.id);
        assert_eq!(trade.price, Decimal::new(45000, 0));
        assert_eq!(trade.quantity, Decimal::new(1, 0));
    }
}



