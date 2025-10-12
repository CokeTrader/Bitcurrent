#!/bin/bash
# Test API key authentication
# Usage: ./scripts/test-api-key.sh YOUR_API_KEY YOUR_API_SECRET

API_KEY=$1
API_SECRET=$2
BASE_URL=${3:-"http://localhost:3001/api/v1"}

if [ -z "$API_KEY" ] || [ -z "$API_SECRET" ]; then
  echo "Usage: ./test-api-key.sh <API_KEY> <API_SECRET> [BASE_URL]"
  exit 1
fi

echo "🧪 Testing API Key Authentication"
echo "=================================="
echo ""

# Test 1: Get balance
echo "1. Testing GET /balance (read permission)..."
curl -s -X GET "${BASE_URL}/balance" \
  -H "X-API-Key: ${API_KEY}" \
  -H "X-API-Secret: ${API_SECRET}" \
  | jq '.'
echo ""

# Test 2: Get markets
echo "2. Testing GET /markets (read permission)..."
curl -s -X GET "${BASE_URL}/markets" \
  -H "X-API-Key: ${API_KEY}" \
  -H "X-API-Secret: ${API_SECRET}" \
  | jq '.'
echo ""

# Test 3: Get orders
echo "3. Testing GET /orders (read permission)..."
curl -s -X GET "${BASE_URL}/orders" \
  -H "X-API-Key: ${API_KEY}" \
  -H "X-API-Secret: ${API_SECRET}" \
  | jq '.'
echo ""

# Test 4: Place order (requires trade permission)
echo "4. Testing POST /orders (trade permission)..."
curl -s -X POST "${BASE_URL}/orders" \
  -H "X-API-Key: ${API_KEY}" \
  -H "X-API-Secret: ${API_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC-GBP",
    "side": "buy",
    "quantity": 0.001,
    "type": "market"
  }' \
  | jq '.'
echo ""

echo "=================================="
echo "✅ API Key tests complete"
echo ""
echo "Expected results:"
echo "- Tests 1-3: Should return data (if key has 'read' permission)"
echo "- Test 4: Should place order (if key has 'trade' permission)"
echo ""
echo "If you see 401/403 errors, check your API key permissions"

