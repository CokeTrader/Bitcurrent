#!/bin/bash
# BitCurrent Exchange - Domain Setup Script

set -e

DOMAIN="bitcurrent.co.uk"
REGION="eu-west-2"

echo "🌐 Setting up domain: $DOMAIN"
echo "=================================="

# Get Route53 hosted zone nameservers
echo ""
echo "Step 1: Getting Route53 nameservers..."

ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name $DOMAIN \
  --query "HostedZones[0].Id" \
  --output text 2>/dev/null || echo "")

if [ -z "$ZONE_ID" ]; then
  echo "❌ Route53 hosted zone not found"
  echo "Run Terraform first: cd infrastructure/terraform/environments/prod && terraform apply"
  exit 1
fi

NAMESERVERS=$(aws route53 get-hosted-zone \
  --id $ZONE_ID \
  --query "DelegationSet.NameServers" \
  --output json)

echo "✅ Route53 hosted zone found: $ZONE_ID"
echo ""
echo "Nameservers:"
echo "$NAMESERVERS" | jq -r '.[]'

# Instructions for domain registrar
echo ""
echo "=================================================="
echo "ACTION REQUIRED: Update nameservers at your registrar"
echo "=================================================="
echo ""
echo "1. Login to your domain registrar where you purchased bitcurrent.co.uk"
echo "2. Navigate to DNS settings for bitcurrent.co.uk"
echo "3. Update nameservers to the following AWS Route53 nameservers:"
echo ""
echo "$NAMESERVERS" | jq -r '.[]' | nl
echo ""
echo "4. Save the changes"
echo "5. Wait for DNS propagation (typically 24-48 hours, but often faster)"
echo ""
echo "To check DNS propagation:"
echo "  dig NS bitcurrent.co.uk"
echo "  dig bitcurrent.co.uk"
echo ""

# Verify current DNS settings
echo "Current DNS settings:"
dig NS $DOMAIN +short || echo "Domain not yet propagated"

# Wait for user confirmation
echo ""
read -p "Press Enter after you've updated nameservers at your registrar..."

echo ""
echo "Testing DNS propagation..."
echo "This may take a few minutes to several hours..."

# Check nameserver propagation
for i in {1..10}; do
  echo "Attempt $i/10..."
  CURRENT_NS=$(dig NS $DOMAIN +short | head -1)
  
  if echo "$NAMESERVERS" | grep -q "$CURRENT_NS"; then
    echo "✅ DNS propagation successful!"
    echo ""
    echo "Your domain is now pointing to AWS Route53"
    echo ""
    echo "DNS Records configured:"
    echo "  $DOMAIN                  → CloudFront (frontend)"
    echo "  www.$DOMAIN              → CloudFront (frontend)"
    echo "  api.$DOMAIN              → ALB (API gateway)"
    echo "  ws.$DOMAIN               → NLB (WebSocket)"
    echo "  admin.$DOMAIN            → API gateway"
    echo "  grafana.$DOMAIN          → Grafana"
    echo ""
    exit 0
  fi
  
  sleep 30
done

echo "⏳ DNS not yet propagated. This is normal and can take up to 48 hours."
echo "Check again later with: dig $DOMAIN"
echo ""
echo "Once propagated, SSL certificates will be automatically issued by AWS Certificate Manager."



