// BitCurrent Matching Engine - Library Entry Point

pub mod config;
pub mod grpc;
pub mod kafka;
pub mod matching;
pub mod metrics;
pub mod orderbook;
pub mod sequence;
pub mod snapshot;
pub mod types;

pub use orderbook::{OrderBook, OrderBookManager};
pub use types::{MatchResult, Order, Side, Trade};



