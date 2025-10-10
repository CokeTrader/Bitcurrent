// BitCurrent Matching Engine - Kafka Producer
// Publishes trade events to Kafka for consumption by other services

use crate::types::Trade;
use anyhow::Result;
use rdkafka::config::ClientConfig;
use rdkafka::producer::{FutureProducer, FutureRecord};
use std::time::Duration;
use tracing::{debug, warn};

pub struct KafkaProducer {
    producer: FutureProducer,
    topic: String,
}

impl KafkaProducer {
    pub fn new(brokers: &str, topic: &str) -> Result<Self> {
        let producer: FutureProducer = ClientConfig::new()
            .set("bootstrap.servers", brokers)
            .set("message.timeout.ms", "5000")
            .set("compression.type", "lz4")
            .set("batch.size", "16384")
            .set("linger.ms", "10")
            .set("acks", "1")
            .create()?;

        Ok(Self {
            producer,
            topic: topic.to_string(),
        })
    }

    /// Publish a trade event to Kafka
    pub async fn publish_trade(&self, trade: &Trade) -> Result<()> {
        let payload = serde_json::to_string(trade)?;
        let key = trade.symbol.as_bytes();

        debug!("Publishing trade to Kafka: {} on symbol {}", trade.id, trade.symbol);

        let record = FutureRecord::to(&self.topic)
            .payload(&payload)
            .key(key);

        match self.producer.send(record, Duration::from_secs(0)).await {
            Ok((partition, offset)) => {
                debug!(
                    "Trade published successfully: partition={}, offset={}",
                    partition, offset
                );
                Ok(())
            }
            Err((err, _)) => {
                warn!("Failed to publish trade to Kafka: {:?}", err);
                Err(anyhow::anyhow!("Kafka publish error: {:?}", err))
            }
        }
    }

    /// Flush pending messages
    pub fn flush(&self) {
        if let Err(e) = self.producer.flush(Duration::from_secs(5)) {
            warn!("Failed to flush Kafka producer: {:?}", e);
        }
    }
}

impl Drop for KafkaProducer {
    fn drop(&mut self) {
        self.flush();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Order, OrderType, Side, TimeInForce};
    use rust_decimal::Decimal;
    use uuid::Uuid;

    #[tokio::test]
    #[ignore] // Requires running Kafka
    async fn test_publish_trade() {
        let producer = KafkaProducer::new("localhost:9092", "trades").unwrap();
        
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
            Decimal::new(45, 0),
            Decimal::new(675, 1),
            3,
        );

        let result = producer.publish_trade(&trade).await;
        assert!(result.is_ok());
    }
}



