// BitCurrent Matching Engine - Metrics Exporter
// Prometheus metrics for monitoring

use anyhow::Result;
use prometheus::{
    register_histogram_vec, register_int_counter_vec, register_int_gauge_vec, Encoder,
    HistogramVec, IntCounterVec, IntGaugeVec, TextEncoder,
};
use std::sync::Arc;
use tokio::sync::Mutex;
use warp::Filter;

lazy_static::lazy_static! {
    pub static ref ORDER_LATENCY: HistogramVec = register_histogram_vec!(
        "matching_engine_order_latency_seconds",
        "Order processing latency",
        &["symbol"],
        vec![0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1]
    ).unwrap();

    pub static ref ORDERS_PROCESSED: IntCounterVec = register_int_counter_vec!(
        "matching_engine_orders_processed_total",
        "Total orders processed",
        &["symbol", "side", "status"]
    ).unwrap();

    pub static ref TRADES_EXECUTED: IntCounterVec = register_int_counter_vec!(
        "matching_engine_trades_executed_total",
        "Total trades executed",
        &["symbol"]
    ).unwrap();

    pub static ref ORDERBOOK_DEPTH: IntGaugeVec = register_int_gauge_vec!(
        "matching_engine_orderbook_depth",
        "Current orderbook depth",
        &["symbol", "side"]
    ).unwrap();

    pub static ref ACTIVE_ORDERS: IntGaugeVec = register_int_gauge_vec!(
        "matching_engine_active_orders",
        "Number of active orders",
        &["symbol"]
    ).unwrap();
}

pub struct MetricsExporter {
    port: u16,
}

impl MetricsExporter {
    pub fn new(port: u16) -> Result<Self> {
        Ok(Self { port })
    }

    pub async fn serve(self) -> Result<()> {
        let metrics_route = warp::path!("metrics").and_then(Self::metrics_handler);

        let addr = ([0, 0, 0, 0], self.port);
        warp::serve(metrics_route).run(addr).await;

        Ok(())
    }

    async fn metrics_handler() -> Result<impl warp::Reply, warp::Rejection> {
        let encoder = TextEncoder::new();
        let metric_families = prometheus::gather();
        let mut buffer = Vec::new();
        
        encoder
            .encode(&metric_families, &mut buffer)
            .map_err(|e| {
                eprintln!("Failed to encode metrics: {}", e);
                warp::reject::reject()
            })?;

        Ok(warp::reply::with_header(
            buffer,
            "Content-Type",
            encoder.format_type(),
        ))
    }
}

/// Record order latency
pub fn record_order_latency(symbol: &str, duration_seconds: f64) {
    ORDER_LATENCY
        .with_label_values(&[symbol])
        .observe(duration_seconds);
}

/// Increment orders processed counter
pub fn increment_orders_processed(symbol: &str, side: &str, status: &str) {
    ORDERS_PROCESSED
        .with_label_values(&[symbol, side, status])
        .inc();
}

/// Increment trades executed counter
pub fn increment_trades_executed(symbol: &str) {
    TRADES_EXECUTED
        .with_label_values(&[symbol])
        .inc();
}

/// Update orderbook depth gauge
pub fn update_orderbook_depth(symbol: &str, side: &str, depth: i64) {
    ORDERBOOK_DEPTH
        .with_label_values(&[symbol, side])
        .set(depth);
}

/// Update active orders gauge
pub fn update_active_orders(symbol: &str, count: i64) {
    ACTIVE_ORDERS
        .with_label_values(&[symbol])
        .set(count);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_record_metrics() {
        record_order_latency("BTC-GBP", 0.002);
        increment_orders_processed("BTC-GBP", "buy", "filled");
        increment_trades_executed("BTC-GBP");
        update_orderbook_depth("BTC-GBP", "buy", 10);
        update_active_orders("BTC-GBP", 100);
    }
}



