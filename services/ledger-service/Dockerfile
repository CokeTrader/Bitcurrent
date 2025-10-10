# BitCurrent API Gateway - Docker Image
# Multi-stage build for optimized production image

# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache git make

# Copy entire services directory structure
COPY services/ ./services/

# Build the binary from the ledger-service directory
WORKDIR /build/services/ledger-service
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o /ledger-service ./cmd

# Runtime stage
FROM alpine:latest

WORKDIR /app

# Install runtime dependencies
RUN apk --no-cache add ca-certificates tzdata

# Copy binary from builder
COPY --from=builder /ledger-service /app/ledger-service

# Create non-root user
RUN addgroup -g 1000 app && adduser -D -u 1000 -G app app
USER app

# Expose ports
EXPOSE 8080 9091

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run the service
CMD ["/app/ledger-service"]

