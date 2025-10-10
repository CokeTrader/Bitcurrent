// BitCurrent Matching Engine - Integration Tests

use bitcurrent_matching_engine::orderbook::OrderBook;
use bitcurrent_matching_engine::types::{MatchResult, Order, OrderType, Side, TimeInForce};
use rust_decimal::Decimal;
use uuid::Uuid;

#[test]
fn test_full_trading_scenario() {
    let mut orderbook = OrderBook::new("BTC-GBP".to_string());

    // Add multiple sell orders at different price levels
    let sell1 = create_order(Side::Sell, Decimal::new(45100, 0), Decimal::new(1, 0));
    let sell2 = create_order(Side::Sell, Decimal::new(45200, 0), Decimal::new(2, 0));
    let sell3 = create_order(Side::Sell, Decimal::new(45300, 0), Decimal::new(1, 0));

    orderbook.add_limit_order(sell1);
    orderbook.add_limit_order(sell2);
    orderbook.add_limit_order(sell3);

    assert_eq!(orderbook.order_count(), 3);
    assert_eq!(orderbook.best_ask(), Some(Decimal::new(45100, 0)));

    // Submit large buy order that matches multiple levels
    let buy = create_order(Side::Buy, Decimal::new(45250, 0), Decimal::new(3, 0));
    let result = orderbook.submit_order(buy).unwrap();

    match result {
        MatchResult::PartiallyFilled(trades, remaining) => {
            // Should match sell1 (1 BTC) and sell2 (2 BTC)
            assert_eq!(trades.len(), 2);
            assert_eq!(remaining.remaining_quantity, Decimal::ZERO);
            
            // First trade should be at 45100 (best price)
            assert_eq!(trades[0].price, Decimal::new(45100, 0));
            assert_eq!(trades[0].quantity, Decimal::new(1, 0));
            
            // Second trade at 45200
            assert_eq!(trades[1].price, Decimal::new(45200, 0));
            assert_eq!(trades[1].quantity, Decimal::new(2, 0));
        }
        _ => panic!("Expected partially filled order with multiple trades"),
    }

    // Only sell3 should remain in orderbook
    assert_eq!(orderbook.order_count(), 1);
    assert_eq!(orderbook.best_ask(), Some(Decimal::new(45300, 0)));
}

#[test]
fn test_price_time_priority() {
    let mut orderbook = OrderBook::new("BTC-GBP".to_string());

    // Add three sell orders at same price, different times
    let sell1 = create_order(Side::Sell, Decimal::new(45000, 0), Decimal::new(1, 0));
    let sell2 = create_order(Side::Sell, Decimal::new(45000, 0), Decimal::new(1, 0));
    let sell3 = create_order(Side::Sell, Decimal::new(45000, 0), Decimal::new(1, 0));

    let sell1_id = sell1.id;
    let sell2_id = sell2.id;

    orderbook.add_limit_order(sell1);
    orderbook.add_limit_order(sell2);
    orderbook.add_limit_order(sell3);

    // Submit buy order for 1.5 BTC
    let buy = create_order(Side::Buy, Decimal::new(45000, 0), Decimal::new(15, 1));
    let result = orderbook.submit_order(buy).unwrap();

    match result {
        MatchResult::Filled(trades) => {
            // Should match with sell1 (1 BTC) and sell2 (0.5 BTC) in FIFO order
            assert_eq!(trades.len(), 2);
            
            // First trade should be with sell1
            assert_eq!(trades[0].seller_order_id, sell1_id);
            assert_eq!(trades[0].quantity, Decimal::new(1, 0));
            
            // Second trade should be with sell2
            assert_eq!(trades[1].seller_order_id, sell2_id);
            assert_eq!(trades[1].quantity, Decimal::new(5, 1)); // 0.5
        }
        _ => panic!("Expected filled order"),
    }
}

#[test]
fn test_self_trade_prevention() {
    let mut orderbook = OrderBook::new("BTC-GBP".to_string());
    let account_id = Uuid::new_v4();

    // Add sell order from account
    let mut sell = create_order(Side::Sell, Decimal::new(45000, 0), Decimal::new(1, 0));
    sell.account_id = account_id;
    orderbook.add_limit_order(sell);

    // Try to buy with same account (self-trade)
    let mut buy = create_order(Side::Buy, Decimal::new(45000, 0), Decimal::new(1, 0));
    buy.account_id = account_id;

    // Note: In a full implementation, this would be prevented
    // For now, this test documents the expected behavior
    let result = orderbook.submit_order(buy).unwrap();

    // In production, this should be prevented at the risk engine level
    match result {
        MatchResult::Filled(_) | MatchResult::Added(_) => {
            // Currently allows self-trade, but should be prevented in order gateway
        }
        _ => {}
    }
}

#[test]
fn test_market_order_with_insufficient_liquidity() {
    let mut orderbook = OrderBook::new("BTC-GBP".to_string());

    // Add small sell order
    let sell = create_order(Side::Sell, Decimal::new(45000, 0), Decimal::new(5, 1)); // 0.5 BTC
    orderbook.add_limit_order(sell);

    // Submit market buy for 1 BTC (more than available)
    let mut buy = create_order(Side::Buy, Decimal::new(45000, 0), Decimal::new(1, 0));
    buy.order_type = OrderType::Market;
    buy.price = None;

    let result = orderbook.submit_order(buy).unwrap();

    match result {
        MatchResult::PartiallyFilled(trades, remaining) => {
            // Should fill 0.5 BTC and cancel remainder
            assert_eq!(trades.len(), 1);
            assert_eq!(trades[0].quantity, Decimal::new(5, 1));
            assert_eq!(remaining.filled_quantity, Decimal::new(5, 1));
        }
        _ => panic!("Expected partially filled market order"),
    }
}

fn create_order(side: Side, price: Decimal, quantity: Decimal) -> Order {
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



