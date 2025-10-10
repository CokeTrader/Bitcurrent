// BitCurrent Matching Engine - Order Matching Algorithm
// Price-time priority FIFO matching implementation

use crate::orderbook::OrderBook;
use crate::types::{MatchResult, Order, OrderStatus, OrderType, Side, TimeInForce, Trade};
use anyhow::Result;
use rust_decimal::Decimal;
use std::cmp::min;
use tracing::debug;

/// Fee calculation (basis points)
const MAKER_FEE_BPS: i64 = 10;  // 0.10%
const TAKER_FEE_BPS: i64 = 15;  // 0.15%

pub struct MatchingEngine;

impl MatchingEngine {
    pub fn new() -> Self {
        Self
    }

    /// Match an incoming order against the orderbook
    pub fn match_order(&self, orderbook: &mut OrderBook, mut incoming: Order) -> Result<MatchResult> {
        let mut trades = Vec::new();

        // Market orders must match immediately or be rejected
        if incoming.order_type == OrderType::Market {
            return self.match_market_order(orderbook, incoming);
        }

        // Post-only orders should never match (add liquidity only)
        if incoming.post_only {
            if self.would_match_immediately(&incoming, orderbook) {
                return Ok(MatchResult::Rejected(
                    "Post-only order would match immediately".to_string(),
                ));
            }
            orderbook.add_limit_order(incoming.clone());
            return Ok(MatchResult::Added(incoming));
        }

        // Match limit order
        match incoming.side {
            Side::Buy => {
                trades.extend(self.match_buy_order(orderbook, &mut incoming)?);
            }
            Side::Sell => {
                trades.extend(self.match_sell_order(orderbook, &mut incoming)?);
            }
        }

        // Handle time-in-force
        match incoming.time_in_force {
            TimeInForce::IOC => {
                // Immediate or Cancel: cancel any remaining quantity
                if incoming.remaining_quantity > Decimal::ZERO {
                    incoming.cancel();
                }
                if trades.is_empty() {
                    return Ok(MatchResult::Rejected("IOC order not filled".to_string()));
                }
                return Ok(MatchResult::PartiallyFilled(trades, incoming));
            }
            TimeInForce::FOK => {
                // Fill or Kill: either fill completely or reject
                if incoming.remaining_quantity > Decimal::ZERO {
                    // Reverse all fills (would need to implement rollback)
                    return Ok(MatchResult::Rejected("FOK order not fully filled".to_string()));
                }
                return Ok(MatchResult::Filled(trades));
            }
            TimeInForce::GTC | TimeInForce::GTD => {
                // Good Till Cancelled/Date: add remaining to orderbook
                if incoming.remaining_quantity > Decimal::ZERO {
                    orderbook.add_limit_order(incoming.clone());
                    if trades.is_empty() {
                        return Ok(MatchResult::Added(incoming));
                    }
                    return Ok(MatchResult::PartiallyFilled(trades, incoming));
                }
            }
        }

        Ok(if trades.is_empty() {
            MatchResult::Added(incoming)
        } else if incoming.is_filled() {
            MatchResult::Filled(trades)
        } else {
            MatchResult::PartiallyFilled(trades, incoming)
        })
    }

    /// Match a market buy or sell order
    fn match_market_order(&self, orderbook: &mut OrderBook, mut order: Order) -> Result<MatchResult> {
        let mut trades = Vec::new();

        match order.side {
            Side::Buy => {
                trades.extend(self.match_buy_order(orderbook, &mut order)?);
            }
            Side::Sell => {
                trades.extend(self.match_sell_order(orderbook, &mut order)?);
            }
        }

        if trades.is_empty() {
            return Ok(MatchResult::Rejected("No liquidity available".to_string()));
        }

        if order.remaining_quantity > Decimal::ZERO {
            // Market order partially filled
            order.cancel();
            Ok(MatchResult::PartiallyFilled(trades, order))
        } else {
            Ok(MatchResult::Filled(trades))
        }
    }

    /// Match incoming buy order against ask side of orderbook
    fn match_buy_order(&self, orderbook: &mut OrderBook, incoming: &mut Order) -> Result<Vec<Trade>> {
        let mut trades = Vec::new();
        let limit_price = incoming.price;

        // Get asks in ascending price order
        let ask_prices: Vec<Decimal> = orderbook.asks.keys().copied().collect();

        for ask_price in ask_prices {
            // Stop if limit price is specified and exceeded
            if let Some(limit) = limit_price {
                if ask_price > limit {
                    break;
                }
            }

            if incoming.remaining_quantity == Decimal::ZERO {
                break;
            }

            let ask_queue = orderbook.asks.get_mut(&ask_price).unwrap();

            while !ask_queue.is_empty() && incoming.remaining_quantity > Decimal::ZERO {
                let mut resting_order = ask_queue.front_mut().unwrap().clone();

                // Match orders
                let fill_qty = min(incoming.remaining_quantity, resting_order.remaining_quantity);
                let trade_price = ask_price; // Resting order price (maker gets better price)

                // Calculate fees
                let taker_fee = self.calculate_fee(trade_price, fill_qty, TAKER_FEE_BPS);
                let maker_fee = self.calculate_fee(trade_price, fill_qty, MAKER_FEE_BPS);

                // Create trade
                let sequence_id = orderbook.sequence_manager.next();
                let trade = Trade::new(
                    orderbook.symbol.clone(),
                    incoming,
                    &resting_order,
                    trade_price,
                    fill_qty,
                    taker_fee,
                    maker_fee,
                    sequence_id,
                );

                debug!(
                    "Trade executed: {} @ {} qty: {}",
                    trade.symbol, trade.price, trade.quantity
                );

                trades.push(trade);

                // Update order quantities
                incoming.fill(fill_qty);
                resting_order.fill(fill_qty);

                // Update orderbook
                if resting_order.is_filled() {
                    ask_queue.pop_front();
                    orderbook.order_index.remove(&resting_order.id);
                } else {
                    // Update the order in the queue
                    if let Some(front) = ask_queue.front_mut() {
                        *front = resting_order.clone();
                    }
                    orderbook.order_index.insert(resting_order.id, resting_order);
                }
            }

            // Remove empty price level
            if ask_queue.is_empty() {
                orderbook.asks.remove(&ask_price);
            }
        }

        Ok(trades)
    }

    /// Match incoming sell order against bid side of orderbook
    fn match_sell_order(&self, orderbook: &mut OrderBook, incoming: &mut Order) -> Result<Vec<Trade>> {
        let mut trades = Vec::new();
        let limit_price = incoming.price;

        // Get bids in descending price order
        let bid_prices: Vec<Decimal> = orderbook.bids.keys().rev().copied().collect();

        for bid_price in bid_prices {
            // Stop if limit price is specified and not met
            if let Some(limit) = limit_price {
                if bid_price < limit {
                    break;
                }
            }

            if incoming.remaining_quantity == Decimal::ZERO {
                break;
            }

            let bid_queue = orderbook.bids.get_mut(&bid_price).unwrap();

            while !bid_queue.is_empty() && incoming.remaining_quantity > Decimal::ZERO {
                let mut resting_order = bid_queue.front_mut().unwrap().clone();

                // Match orders
                let fill_qty = min(incoming.remaining_quantity, resting_order.remaining_quantity);
                let trade_price = bid_price; // Resting order price (maker gets better price)

                // Calculate fees
                let maker_fee = self.calculate_fee(trade_price, fill_qty, MAKER_FEE_BPS);
                let taker_fee = self.calculate_fee(trade_price, fill_qty, TAKER_FEE_BPS);

                // Create trade
                let sequence_id = orderbook.sequence_manager.next();
                let trade = Trade::new(
                    orderbook.symbol.clone(),
                    &resting_order,
                    incoming,
                    trade_price,
                    fill_qty,
                    maker_fee,
                    taker_fee,
                    sequence_id,
                );

                debug!(
                    "Trade executed: {} @ {} qty: {}",
                    trade.symbol, trade.price, trade.quantity
                );

                trades.push(trade);

                // Update order quantities
                incoming.fill(fill_qty);
                resting_order.fill(fill_qty);

                // Update orderbook
                if resting_order.is_filled() {
                    bid_queue.pop_front();
                    orderbook.order_index.remove(&resting_order.id);
                } else {
                    // Update the order in the queue
                    if let Some(front) = bid_queue.front_mut() {
                        *front = resting_order.clone();
                    }
                    orderbook.order_index.insert(resting_order.id, resting_order);
                }
            }

            // Remove empty price level
            if bid_queue.is_empty() {
                orderbook.bids.remove(&bid_price);
            }
        }

        Ok(trades)
    }

    /// Check if order would match immediately
    fn would_match_immediately(&self, order: &Order, orderbook: &OrderBook) -> bool {
        let price = match order.price {
            Some(p) => p,
            None => return false,
        };

        match order.side {
            Side::Buy => {
                if let Some(best_ask) = orderbook.best_ask() {
                    return price >= best_ask;
                }
            }
            Side::Sell => {
                if let Some(best_bid) = orderbook.best_bid() {
                    return price <= best_bid;
                }
            }
        }

        false
    }

    /// Calculate trading fee
    fn calculate_fee(&self, price: Decimal, quantity: Decimal, fee_bps: i64) -> Decimal {
        let notional = price * quantity;
        notional * Decimal::new(fee_bps, 4) // basis points to decimal
    }
}

impl Default for MatchingEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::TimeInForce;
    use uuid::Uuid;

    fn create_limit_order(side: Side, price: Decimal, quantity: Decimal, seq: u64) -> Order {
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
            seq,
        )
    }

    #[test]
    fn test_simple_match() {
        let mut orderbook = OrderBook::new("BTC-GBP".to_string());
        let engine = MatchingEngine::new();

        // Add sell order to orderbook
        let sell_order = create_limit_order(Side::Sell, Decimal::new(45000, 0), Decimal::new(1, 0), 1);
        orderbook.add_limit_order(sell_order);

        // Submit matching buy order
        let buy_order = create_limit_order(Side::Buy, Decimal::new(45000, 0), Decimal::new(1, 0), 2);
        let result = engine.match_order(&mut orderbook, buy_order).unwrap();

        match result {
            MatchResult::Filled(trades) => {
                assert_eq!(trades.len(), 1);
                assert_eq!(trades[0].price, Decimal::new(45000, 0));
                assert_eq!(trades[0].quantity, Decimal::new(1, 0));
            }
            _ => panic!("Expected filled order"),
        }
    }

    #[test]
    fn test_partial_match() {
        let mut orderbook = OrderBook::new("BTC-GBP".to_string());
        let engine = MatchingEngine::new();

        // Add sell order for 0.5 BTC
        let sell_order = create_limit_order(Side::Sell, Decimal::new(45000, 0), Decimal::new(5, 1), 1);
        orderbook.add_limit_order(sell_order);

        // Submit buy order for 1 BTC
        let buy_order = create_limit_order(Side::Buy, Decimal::new(45000, 0), Decimal::new(1, 0), 2);
        let result = engine.match_order(&mut orderbook, buy_order).unwrap();

        match result {
            MatchResult::PartiallyFilled(trades, remaining) => {
                assert_eq!(trades.len(), 1);
                assert_eq!(trades[0].quantity, Decimal::new(5, 1)); // 0.5
                assert_eq!(remaining.remaining_quantity, Decimal::new(5, 1)); // 0.5 remaining
            }
            _ => panic!("Expected partially filled order"),
        }
    }

    #[test]
    fn test_post_only_rejection() {
        let mut orderbook = OrderBook::new("BTC-GBP".to_string());
        let engine = MatchingEngine::new();

        // Add sell order
        let sell_order = create_limit_order(Side::Sell, Decimal::new(45000, 0), Decimal::new(1, 0), 1);
        orderbook.add_limit_order(sell_order);

        // Submit post-only buy order that would match
        let mut buy_order = create_limit_order(Side::Buy, Decimal::new(45000, 0), Decimal::new(1, 0), 2);
        buy_order.post_only = true;

        let result = engine.match_order(&mut orderbook, buy_order).unwrap();

        match result {
            MatchResult::Rejected(reason) => {
                assert!(reason.contains("Post-only"));
            }
            _ => panic!("Expected rejected order"),
        }
    }

    #[test]
    fn test_price_priority() {
        let mut orderbook = OrderBook::new("BTC-GBP".to_string());
        let engine = MatchingEngine::new();

        // Add sell orders at different prices
        orderbook.add_limit_order(create_limit_order(Side::Sell, Decimal::new(45100, 0), Decimal::new(1, 0), 1));
        orderbook.add_limit_order(create_limit_order(Side::Sell, Decimal::new(45000, 0), Decimal::new(1, 0), 2));
        orderbook.add_limit_order(create_limit_order(Side::Sell, Decimal::new(45200, 0), Decimal::new(1, 0), 3));

        // Submit buy order - should match with lowest ask (45000)
        let buy_order = create_limit_order(Side::Buy, Decimal::new(45200, 0), Decimal::new(1, 0), 4);
        let result = engine.match_order(&mut orderbook, buy_order).unwrap();

        match result {
            MatchResult::Filled(trades) => {
                assert_eq!(trades.len(), 1);
                assert_eq!(trades[0].price, Decimal::new(45000, 0)); // Best price
            }
            _ => panic!("Expected filled order"),
        }
    }

    #[test]
    fn test_fee_calculation() {
        let engine = MatchingEngine::new();
        
        let price = Decimal::new(45000, 0);
        let quantity = Decimal::new(1, 0);
        
        let maker_fee = engine.calculate_fee(price, quantity, MAKER_FEE_BPS);
        let taker_fee = engine.calculate_fee(price, quantity, TAKER_FEE_BPS);

        // 0.1% of 45000 = 45
        assert_eq!(maker_fee, Decimal::new(45, 0));
        // 0.15% of 45000 = 67.5
        assert_eq!(taker_fee, Decimal::new(675, 1));
    }
}



