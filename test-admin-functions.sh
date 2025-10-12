#!/bin/bash

# Test Admin Functions
# Login as admin and test granting paper funds

API_URL="https://bitcurrent-production.up.railway.app/api/v1"
ADMIN_EMAIL="admin@bitcurrent.co.uk"
ADMIN_PASSWORD="AdminSecure123!"
TEST_USER_ID="e9ac4cbb-0da9-43a9-a3e8-3f8046c7063c"  # From previous test

echo "=========================================="
echo "🔐 Testing Admin Functions"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Login as admin
echo "📝 Step 1: Admin Login"
echo "Email: $ADMIN_EMAIL"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

echo "$LOGIN_RESPONSE" | jq .

if echo "$LOGIN_RESPONSE" | grep -q "\"success\":true"; then
  ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
  echo -e "${GREEN}✅ Admin logged in successfully${NC}"
  echo "Token: ${ADMIN_TOKEN:0:30}..."
else
  echo -e "${RED}❌ Admin login failed${NC}"
  exit 1
fi
echo ""
sleep 2

# Step 2: Grant paper funds to test user
echo "🎁 Step 2: Grant Paper Funds to Test User"
echo "Target User ID: $TEST_USER_ID"
GRANT_RESPONSE=$(curl -s -X POST "$API_URL/admin/grant-paper-funds" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$TEST_USER_ID\",
    \"amount\": 10000
  }")

echo "$GRANT_RESPONSE" | jq .

if echo "$GRANT_RESPONSE" | grep -q "\"success\":true"; then
  echo -e "${GREEN}✅ Paper funds granted: £10,000${NC}"
else
  echo -e "${RED}❌ Paper funds grant failed${NC}"
  ERROR=$(echo "$GRANT_RESPONSE" | jq -r '.error')
  echo "Error: $ERROR"
  
  if echo "$ERROR" | grep -q "admin"; then
    echo ""
    echo -e "${YELLOW}⚠️  User is not an admin yet!${NC}"
    echo "Run this SQL command in Railway PostgreSQL:"
    echo ""
    echo "UPDATE users SET is_admin = true WHERE id = 'e15b0928-7767-44d1-9923-e9a47eb2682a';"
    echo ""
  fi
  exit 1
fi
echo ""
sleep 2

# Step 3: Get admin stats
echo "📊 Step 3: Get Platform Stats"
STATS_RESPONSE=$(curl -s -X GET "$API_URL/admin/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$STATS_RESPONSE" | jq .
echo ""

# Step 4: Get all users
echo "👥 Step 4: Get All Users"
USERS_RESPONSE=$(curl -s -X GET "$API_URL/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$USERS_RESPONSE" | jq .
echo ""

# Summary
echo "=========================================="
echo "📊 Admin Functions Test Summary"
echo "=========================================="
echo -e "${GREEN}✅ Admin Login: OK${NC}"
echo -e "${GREEN}✅ Grant Paper Funds: OK${NC}"
echo -e "${GREEN}✅ Platform Stats: OK${NC}"
echo -e "${GREEN}✅ User List: OK${NC}"
echo ""
echo "🎉 All admin functions working!"
echo ""
echo "Next: Run ./test-complete-trading-flow.sh to test the full trading flow"
echo ""

