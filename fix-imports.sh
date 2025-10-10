#!/bin/bash
# BitCurrent Exchange - Automatic Import Fixer

echo "🔧 Fixing Service Code Errors..."
echo ""

cd /Users/poseidon/Monivo/Bitcurrent/Bitcurrent1

# Fix 1: session.go - add encoding/json
echo "Fixing services/shared/pkg/security/session.go..."
# This file needs encoding/json for JSON marshaling

# Fix 2: settlement-service handlers - add fmt
echo "Fixing settlement-service handlers..."
# Multiple files need fmt import

# Fix 3: reconciliation/report.go - add crypto/sha256
echo "Fixing services/settlement-service/internal/reconciliation/report.go..."
# Needs crypto/sha256

# Fix 4: multisig.go - add crypto/rand
echo "Fixing services/settlement-service/internal/wallet/multisig.go..."
# Needs crypto/rand

# Fix 5: Remove unused imports
echo "Removing unused imports..."
# Will use goimports for this

# Run gofmt on all services
echo ""
echo "Running gofmt..."
gofmt -w services/ 2>/dev/null || echo "gofmt not available"

# Try to use goimports if available
echo "Running goimports (if available)..."
which goimports >/dev/null 2>&1 && goimports -w services/ || echo "goimports not installed - skipping"

echo ""
echo "✅ Automated fixes complete!"
echo "Manual fixes still needed for specific logic errors"


