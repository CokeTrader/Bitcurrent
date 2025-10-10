#!/bin/bash
# Build all BitCurrent service images for linux/amd64

set -e

cd /Users/poseidon/Monivo/Bitcurrent/Bitcurrent1

ECR="805694794171.dkr.ecr.eu-west-2.amazonaws.com/bitcurrent"

echo "🔨 Building all services for linux/amd64..."
echo ""

# Build each service
for service in order-gateway ledger-service settlement-service market-data-service compliance-service; do
    echo "Building $service..."
    
    # Create a proper Dockerfile on the fly
    cat > /tmp/Dockerfile.$service <<EOF
FROM golang:1.24-alpine AS builder
WORKDIR /build
RUN apk add --no-cache git make
COPY services/ ./services/
WORKDIR /build/services/$service
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -installsuffix cgo -ldflags="-w -s" -o /$service ./cmd

FROM alpine:latest
WORKDIR /app
RUN apk --no-cache add ca-certificates tzdata
COPY --from=builder /$service /app/$service
RUN addgroup -g 1000 app && adduser -D -u 1000 -G app app
USER app
EXPOSE 8080 9091
CMD ["/app/$service"]
EOF

    # Build and tag
    docker build --platform linux/amd64 -f /tmp/Dockerfile.$service -t $ECR/$service:latest .
    
    # Push
    docker push $ECR/$service:latest | tail -2
    
    echo "✅ $service"
    echo ""
done

echo "🎉 All services built and pushed!"


