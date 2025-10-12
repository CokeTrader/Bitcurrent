#!/bin/bash

# Admin User Setup Script
# Creates an admin user and grants paper trading funds

API_URL="https://bitcurrent-production.up.railway.app/api/v1"
ADMIN_EMAIL="admin@bitcurrent.co.uk"
ADMIN_PASSWORD="AdminSecure123!"

echo "=========================================="
echo "🔐 Admin User Setup for BitCurrent"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Register admin user
echo "📝 Step 1: Register Admin User"
echo "Email: $ADMIN_EMAIL"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"firstName\": \"Admin\",
    \"lastName\": \"User\"
  }")

if echo "$REGISTER_RESPONSE" | grep -q "\"success\":true"; then
  ADMIN_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')
  ADMIN_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
  echo -e "${GREEN}✅ Admin user created${NC}"
  echo "User ID: $ADMIN_ID"
  echo "Token: ${ADMIN_TOKEN:0:20}..."
else
  echo -e "${RED}❌ Admin registration failed${NC}"
  echo "$REGISTER_RESPONSE" | jq .
  exit 1
fi

echo ""
echo "=========================================="
echo "⚠️  MANUAL STEP REQUIRED"
echo "=========================================="
echo ""
echo "You need to manually update the database to make this user an admin."
echo ""
echo "Connect to Railway PostgreSQL and run:"
echo ""
echo -e "${YELLOW}UPDATE users SET is_admin = true WHERE id = '$ADMIN_ID';${NC}"
echo ""
echo "Once done, you can use this admin account to:"
echo "1. Grant paper funds to users"
echo "2. Approve/reject deposits and withdrawals"
echo "3. View admin dashboard"
echo ""
echo "Admin credentials:"
echo "  Email: $ADMIN_EMAIL"
echo "  Password: $ADMIN_PASSWORD"
echo "  User ID: $ADMIN_ID"
echo ""
echo "Save these credentials securely!"
echo ""

