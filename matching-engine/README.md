# BitCurrent Matching Engine

Ultra-low latency order matching engine written in Rust.

## Features

- **Sub-2ms P99 latency** for order matching
- **Price-time priority** FIFO matching algorithm
- **Event sourcing** with snapshot recovery
- **Lock-free orderbook** using atomic operations
- **gRPC interface** for order submission
- **Kafka integration** for trade events
- **Prometheus metrics** for monitoring

## Architecture

```
┌─────────────┐
│  API Gateway│
└──────┬──────┘
       │ gRPC
┌──────▼──────┐
│   Matching  │
│   Engine    │
└──────┬──────┘
       │ Kafka
┌──────▼──────┐
│  Trade      │
│  Events     │
└─────────────┘
```

## Building

```bash
cargo build --release
```

## Running

```bash
# With default configuration
cargo run --release

# With custom config
RUST_LOG=info cargo run --release
```

## Testing

```bash
# Unit tests
cargo test

# Benchmarks
cargo bench

# Property-based tests
cargo test --features proptest
```

## Performance Targets

- Throughput: 5,000 orders/second per trading pair
- Latency P50: < 1ms
- Latency P99: < 5ms
- Memory: < 2GB per instance

## Configuration

See `.env.sample` in the project root.

## Metrics

Exposed on `/metrics` endpoint in Prometheus format:

- `orderbook_depth` - Current orderbook depth
- `order_latency` - Order processing latency histogram
- `matching_throughput` - Orders matched per second
- `trade_volume` - Trading volume by symbol



