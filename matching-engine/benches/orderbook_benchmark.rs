// BitCurrent Matching Engine - Performance Benchmarks

use bitcurrent_matching_engine::orderbook::OrderBook;
use bitcurrent_matching_engine::types::{Order, OrderType, Side, TimeInForce};
use criterion::{black_box, criterion_group, criterion_main, Criterion, Throughput};
use rust_decimal::Decimal;
use uuid::Uuid;

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

fn benchmark_order_submission(c: &mut Criterion) {
    let mut group = c.benchmark_group("order_submission");
    group.throughput(Throughput::Elements(1));

    group.bench_function("submit_limit_order", |b| {
        let mut orderbook = OrderBook::new("BTC-GBP".to_string());
        b.iter(|| {
            let order = create_order(Side::Buy, Decimal::new(45000, 0), Decimal::new(1, 0));
            black_box(orderbook.submit_order(order))
        });
    });

    group.finish();
}

fn benchmark_order_matching(c: &mut Criterion) {
    let mut group = c.benchmark_group("order_matching");
    group.throughput(Throughput::Elements(1));

    group.bench_function("match_single_order", |b| {
        b.iter(|| {
            let mut orderbook = OrderBook::new("BTC-GBP".to_string());
            
            // Add resting sell order
            let sell = create_order(Side::Sell, Decimal::new(45000, 0), Decimal::new(1, 0));
            orderbook.add_limit_order(sell);
            
            // Submit matching buy order
            let buy = create_order(Side::Buy, Decimal::new(45000, 0), Decimal::new(1, 0));
            black_box(orderbook.submit_order(buy))
        });
    });

    group.bench_function("match_multi_level", |b| {
        b.iter(|| {
            let mut orderbook = OrderBook::new("BTC-GBP".to_string());
            
            // Add multiple price levels
            for i in 0..10 {
                let price = Decimal::new(45000 + i * 100, 0);
                let sell = create_order(Side::Sell, price, Decimal::new(1, 0));
                orderbook.add_limit_order(sell);
            }
            
            // Submit large buy order that matches multiple levels
            let buy = create_order(Side::Buy, Decimal::new(46000, 0), Decimal::new(5, 0));
            black_box(orderbook.submit_order(buy))
        });
    });

    group.finish();
}

fn benchmark_orderbook_depth(c: &mut Criterion) {
    let mut group = c.benchmark_group("orderbook_depth");

    // Setup orderbook with many orders
    let mut orderbook = OrderBook::new("BTC-GBP".to_string());
    for i in 0..100 {
        let buy_price = Decimal::new(45000 - i * 10, 0);
        let sell_price = Decimal::new(45000 + i * 10, 0);
        
        orderbook.add_limit_order(create_order(Side::Buy, buy_price, Decimal::new(1, 0)));
        orderbook.add_limit_order(create_order(Side::Sell, sell_price, Decimal::new(1, 0)));
    }

    group.bench_function("get_depth_10", |b| {
        b.iter(|| black_box(orderbook.get_depth(10)));
    });

    group.bench_function("get_depth_50", |b| {
        b.iter(|| black_box(orderbook.get_depth(50)));
    });

    group.finish();
}

fn benchmark_order_cancellation(c: &mut Criterion) {
    let mut group = c.benchmark_group("order_cancellation");

    group.bench_function("cancel_order", |b| {
        b.iter(|| {
            let mut orderbook = OrderBook::new("BTC-GBP".to_string());
            let order = create_order(Side::Buy, Decimal::new(45000, 0), Decimal::new(1, 0));
            let order_id = order.id;
            orderbook.add_limit_order(order);
            black_box(orderbook.cancel_order(order_id))
        });
    });

    group.finish();
}

criterion_group!(
    benches,
    benchmark_order_submission,
    benchmark_order_matching,
    benchmark_orderbook_depth,
    benchmark_order_cancellation
);

criterion_main!(benches);



