// BitCurrent Matching Engine - Snapshot Manager
// Handles orderbook snapshots for crash recovery

use crate::orderbook::OrderBook;
use anyhow::Result;
use std::fs;
use std::path::{Path, PathBuf};
use tokio::fs::File;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tracing::{info, warn};

pub struct SnapshotManager {
    base_path: PathBuf,
}

impl SnapshotManager {
    pub fn new(base_path: &str) -> Self {
        let path = PathBuf::from(base_path);
        if !path.exists() {
            fs::create_dir_all(&path).ok();
        }
        Self { base_path: path }
    }

    /// Save orderbook snapshot
    pub async fn save_snapshot(&self, symbol: &str, orderbook: &OrderBook) -> Result<()> {
        let filename = self.snapshot_filename(symbol);
        let serialized = bincode::serialize(orderbook)?;
        
        let mut file = File::create(&filename).await?;
        file.write_all(&serialized).await?;
        
        info!("Saved snapshot for {} to {:?}", symbol, filename);
        Ok(())
    }

    /// Load orderbook snapshot
    pub async fn load_snapshot(&self, symbol: &str) -> Result<OrderBook> {
        let filename = self.snapshot_filename(symbol);
        
        if !filename.exists() {
            anyhow::bail!("Snapshot file not found: {:?}", filename);
        }

        let mut file = File::open(&filename).await?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer).await?;
        
        let orderbook: OrderBook = bincode::deserialize(&buffer)?;
        info!("Loaded snapshot for {} from {:?}", symbol, filename);
        
        Ok(orderbook)
    }

    /// List all available snapshots
    pub async fn list_snapshots(&self) -> Result<Vec<String>> {
        let mut symbols = Vec::new();
        
        if let Ok(entries) = fs::read_dir(&self.base_path) {
            for entry in entries.flatten() {
                if let Some(filename) = entry.file_name().to_str() {
                    if filename.ends_with(".snapshot") {
                        let symbol = filename.trim_end_matches(".snapshot").to_string();
                        symbols.push(symbol);
                    }
                }
            }
        }
        
        Ok(symbols)
    }

    /// Delete snapshot
    pub async fn delete_snapshot(&self, symbol: &str) -> Result<()> {
        let filename = self.snapshot_filename(symbol);
        
        if filename.exists() {
            tokio::fs::remove_file(&filename).await?;
            info!("Deleted snapshot for {}", symbol);
        } else {
            warn!("Snapshot file not found for deletion: {:?}", filename);
        }
        
        Ok(())
    }

    fn snapshot_filename(&self, symbol: &str) -> PathBuf {
        self.base_path.join(format!("{}.snapshot", symbol))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Order, OrderType, Side, TimeInForce};
    use rust_decimal::Decimal;
    use tempfile::TempDir;
    use uuid::Uuid;

    #[tokio::test]
    async fn test_save_and_load_snapshot() {
        let temp_dir = TempDir::new().unwrap();
        let manager = SnapshotManager::new(temp_dir.path().to_str().unwrap());
        
        let mut orderbook = OrderBook::new("BTC-GBP".to_string());
        
        // Add some orders
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
        orderbook.add_limit_order(order);
        
        // Save snapshot
        manager.save_snapshot("BTC-GBP", &orderbook).await.unwrap();
        
        // Load snapshot
        let loaded = manager.load_snapshot("BTC-GBP").await.unwrap();
        
        assert_eq!(loaded.symbol, "BTC-GBP");
        assert_eq!(loaded.order_count(), 1);
    }

    #[tokio::test]
    async fn test_list_snapshots() {
        let temp_dir = TempDir::new().unwrap();
        let manager = SnapshotManager::new(temp_dir.path().to_str().unwrap());
        
        let ob1 = OrderBook::new("BTC-GBP".to_string());
        let ob2 = OrderBook::new("ETH-GBP".to_string());
        
        manager.save_snapshot("BTC-GBP", &ob1).await.unwrap();
        manager.save_snapshot("ETH-GBP", &ob2).await.unwrap();
        
        let snapshots = manager.list_snapshots().await.unwrap();
        assert_eq!(snapshots.len(), 2);
        assert!(snapshots.contains(&"BTC-GBP".to_string()));
        assert!(snapshots.contains(&"ETH-GBP".to_string()));
    }
}



