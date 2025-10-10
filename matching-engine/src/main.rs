// BitCurrent Matching Engine - Main Entry Point
// Ultra-low latency order matching for cryptocurrency exchange

use anyhow::Result;
use tracing::{info, warn};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod types;
mod orderbook;
mod matching;
mod sequence;
mod grpc;
mod kafka;
mod metrics;
mod snapshot;
mod config;

use crate::config::Config;
use crate::grpc::server::MatchingEngineServer;
use crate::kafka::producer::KafkaProducer;
use crate::metrics::MetricsExporter;
use crate::orderbook::OrderBookManager;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "bitcurrent_matching_engine=debug,info".into()),
        )
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    info!("🚀 BitCurrent Matching Engine starting...");

    // Load configuration
    let config = Config::from_env()?;
    info!("Configuration loaded: {:?}", config);

    // Initialize metrics exporter
    let metrics_exporter = MetricsExporter::new(config.metrics_port)?;
    tokio::spawn(async move {
        if let Err(e) = metrics_exporter.serve().await {
            warn!("Metrics exporter error: {}", e);
        }
    });

    // Initialize Kafka producer for trade events
    let kafka_producer = KafkaProducer::new(&config.kafka_brokers, &config.kafka_topic)?;
    info!("Kafka producer initialized");

    // Initialize orderbook manager
    let orderbook_manager = OrderBookManager::new(
        config.snapshot_interval,
        config.snapshot_path.clone(),
        kafka_producer,
    );
    info!("Orderbook manager initialized");

    // Restore from snapshot if exists
    if let Err(e) = orderbook_manager.restore_from_snapshot().await {
        warn!("Failed to restore from snapshot: {}. Starting fresh.", e);
    }

    // Start gRPC server
    let grpc_server = MatchingEngineServer::new(orderbook_manager.clone());
    info!("Starting gRPC server on {}", config.grpc_addr);

    grpc_server.serve(config.grpc_addr).await?;

    info!("✅ BitCurrent Matching Engine started successfully");

    Ok(())
}



