# BitCurrent Matching Engine - Docker Image
# Multi-stage build for Rust application

# Build stage
FROM rust:alpine AS builder

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache \
    musl-dev \
    protobuf-dev \
    protoc \
    git \
    make

# Copy the entire matching engine
COPY matching-engine/ .

# Build the application
RUN cargo build --release

# Runtime stage
FROM alpine:latest

WORKDIR /app

# Install runtime dependencies
RUN apk --no-cache add ca-certificates libgcc

# Copy binary from builder
COPY --from=builder /build/target/release/matching-engine /app/matching-engine

# Create non-root user
RUN addgroup -g 1000 app && adduser -D -u 1000 -G app app
USER app

# Expose gRPC port and metrics
EXPOSE 50051 9091

# Run the matching engine
CMD ["/app/matching-engine"]
