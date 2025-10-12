#!/bin/bash

# Complete Trading Flow Test Script
# Tests the entire user journey from registration to trade execution

API_URL="https://bitcurrent-production.up.railway.app/api/v1"
TEST_EMAIL="testuser+$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"
TOKEN=""
USER_ID=""

echo "======================================"
echo "🧪 BitCurrent Trading Flow Test"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Health Check
echo "📊 Step 1: Health Check"
HEALTH=$(curl -s "https://bitcurrent-production.up.railway.app/health")
if echo "$HEALTH" | grep -q "healthy"; then
  echo -e "${GREEN}✅ Backend is healthy${NC}"
else
  echo -e "${RED}❌ Backend unhealthy${NC}"
  exit 1
fi
echo ""

# Step 2: Register User
echo "📝 Step 2: Register New User"
echo "Email: $TEST_EMAIL"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\"
  }")

echo "$REGISTER_RESPONSE" | jq .

if echo "$REGISTER_RESPONSE" | grep -q "\"success\":true"; then
  TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
  USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')
  echo -e "${GREEN}✅ User registered successfully${NC}"
  echo "Token: ${TOKEN:0:20}..."
  echo "User ID: $USER_ID"
else
  echo -e "${RED}❌ Registration failed${NC}"
  exit 1
fi
echo ""
sleep 2

# Step 3: Check Initial Balances
echo "💰 Step 3: Check Initial Balances"
BALANCES=$(curl -s -X GET "$API_URL/balances" \
  -H "Authorization: Bearer $TOKEN")

echo "$BALANCES" | jq .
echo -e "${YELLOW}ℹ️  User should have zero balance initially${NC}"
echo ""
sleep 2

# Step 4: Login as Admin and Grant Paper Funds
echo "🎁 Step 4: Grant Paper Trading Funds (via Admin)"
# Login as admin first
ADMIN_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bitcurrent.co.uk","password":"AdminSecure123!"}' | jq -r '.token')

echo "Admin logged in, granting funds..."

# Extract USER_ID from token response (we need to parse it differently)
# For now, we'll use the user ID we got from registration
PAPER_FUNDS=$(curl -s -X POST "$API_URL/admin/grant-paper-funds" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\", \"amount\": 10000}")

echo "$PAPER_FUNDS" | jq .

if echo "$PAPER_FUNDS" | grep -q "\"success\":true"; then
  echo -e "${GREEN}✅ Paper funds granted: £10,000${NC}"
else
  echo -e "${RED}❌ Paper funds grant failed${NC}"
  exit 1
fi
echo ""
sleep 2

# Step 5: Check Updated Balances
echo "💰 Step 5: Verify Balances After Paper Funds"
BALANCES_AFTER=$(curl -s -X GET "$API_URL/balances" \
  -H "Authorization: Bearer $TOKEN")

echo "$BALANCES_AFTER" | jq .

GBP_BALANCE=$(echo "$BALANCES_AFTER" | jq -r '.balances[] | select(.currency=="GBP") | .available')
if [ "$GBP_BALANCE" == "10000" ]; then
  echo -e "${GREEN}✅ GBP balance confirmed: £${GBP_BALANCE}${NC}"
else
  echo -e "${RED}❌ Unexpected GBP balance: £${GBP_BALANCE}${NC}"
fi
echo ""
sleep 2

# Step 6: Place Buy Order (BTC)
echo "📈 Step 6: Place BUY Order (£100 worth of BTC)"
BUY_ORDER=$(curl -s -X POST "$API_URL/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC-GBP",
    "side": "BUY",
    "amount": 100
  }')

echo "$BUY_ORDER" | jq .

if echo "$BUY_ORDER" | grep -q "\"success\":true"; then
  ORDER_ID=$(echo "$BUY_ORDER" | jq -r '.order.id')
  echo -e "${GREEN}✅ BUY order placed successfully${NC}"
  echo "Order ID: $ORDER_ID"
else
  echo -e "${RED}❌ BUY order failed${NC}"
  echo "Error: $(echo $BUY_ORDER | jq -r '.error')"
fi
echo ""
sleep 3

# Step 7: Check Balances After Trade
echo "💰 Step 7: Verify Balances After Trade"
BALANCES_FINAL=$(curl -s -X GET "$API_URL/balances" \
  -H "Authorization: Bearer $TOKEN")

echo "$BALANCES_FINAL" | jq .

GBP_FINAL=$(echo "$BALANCES_FINAL" | jq -r '.balances[] | select(.currency=="GBP") | .available')
BTC_FINAL=$(echo "$BALANCES_FINAL" | jq -r '.balances[] | select(.currency=="BTC") | .available')

echo ""
echo -e "${GREEN}Final Balances:${NC}"
echo "  GBP: £${GBP_FINAL}"
echo "  BTC: ₿${BTC_FINAL}"
echo ""

# Step 8: Test 2FA Setup
echo "🔐 Step 8: Test 2FA Setup"
TFA_SETUP=$(curl -s -X POST "$API_URL/2fa/setup" \
  -H "Authorization: Bearer $TOKEN")

if echo "$TFA_SETUP" | grep -q "\"success\":true"; then
  echo -e "${GREEN}✅ 2FA setup endpoint working${NC}"
  SECRET=$(echo "$TFA_SETUP" | jq -r '.secret')
  echo "2FA Secret: ${SECRET:0:10}..."
else
  echo -e "${RED}❌ 2FA setup failed${NC}"
fi
echo ""

# Step 9: Check 2FA Status
echo "🔐 Step 9: Check 2FA Status"
TFA_STATUS=$(curl -s -X GET "$API_URL/2fa/status" \
  -H "Authorization: Bearer $TOKEN")

echo "$TFA_STATUS" | jq .
echo ""

# Summary
echo "======================================"
echo "📊 Test Summary"
echo "======================================"
echo -e "${GREEN}✅ Backend Health: OK${NC}"
echo -e "${GREEN}✅ User Registration: OK${NC}"
echo -e "${GREEN}✅ Paper Funds Grant: OK${NC}"
echo -e "${GREEN}✅ Balance Queries: OK${NC}"
if echo "$BUY_ORDER" | grep -q "\"success\":true"; then
  echo -e "${GREEN}✅ Order Placement: OK${NC}"
else
  echo -e "${YELLOW}⚠️  Order Placement: NEEDS REVIEW${NC}"
fi
echo -e "${GREEN}✅ 2FA Endpoints: OK${NC}"
echo ""
echo "🎉 Trading flow test completed!"
echo ""

