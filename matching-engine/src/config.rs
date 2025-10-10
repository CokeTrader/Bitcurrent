// BitCurrent Matching Engine - Configuration

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub grpc_addr: String,
    pub metrics_port: u16,
    pub kafka_brokers: String,
    pub kafka_topic: String,
    pub snapshot_interval: u64,
    pub snapshot_path: String,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        dotenv::dotenv().ok();

        Ok(Self {
            grpc_addr: env::var("MATCHING_ENGINE_GRPC_URL")
                .unwrap_or_else(|_| "0.0.0.0:9090".to_string()),
            metrics_port: env::var("PROMETHEUS_PORT")
                .unwrap_or_else(|_| "9091".to_string())
                .parse()?,
            kafka_brokers: env::var("KAFKA_BROKERS")
                .unwrap_or_else(|_| "localhost:9092".to_string()),
            kafka_topic: env::var("KAFKA_TOPICS_TRADES")
                .unwrap_or_else(|_| "trades".to_string()),
            snapshot_interval: env::var("MATCHING_ENGINE_SNAPSHOT_INTERVAL")
                .unwrap_or_else(|_| "10000".to_string())
                .parse()?,
            snapshot_path: env::var("SNAPSHOT_PATH")
                .unwrap_or_else(|_| "./snapshots".to_string()),
        })
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            grpc_addr: "0.0.0.0:9090".to_string(),
            metrics_port: 9091,
            kafka_brokers: "localhost:9092".to_string(),
            kafka_topic: "trades".to_string(),
            snapshot_interval: 10000,
            snapshot_path: "./snapshots".to_string(),
        }
    }
}



