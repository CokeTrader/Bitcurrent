#!/bin/bash

# Script to update all URLs from placeholder to production domain
# Usage: ./update-urls-for-production.sh www.bitcurrent.co.uk

set -e

PRODUCTION_DOMAIN="${1:-www.bitcurrent.co.uk}"

echo "🔄 Updating URLs to https://$PRODUCTION_DOMAIN"
echo "================================================"

# Files to update
FILES=(
  "frontend/public/robots.txt"
  "frontend/public/sitemap.xml"
  "frontend/public/.well-known/ai.json"
  "frontend/public/ai-readme.txt"
  "frontend/app/layout.tsx"
)

# Backup original files
echo "📦 Creating backups..."
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" "$file.backup"
    echo "  ✓ Backed up $file"
  fi
done

# Update URLs
echo ""
echo "🔧 Updating URLs..."

# Update robots.txt
sed -i.tmp "s|https://bitcurrent.exchange|https://$PRODUCTION_DOMAIN|g" frontend/public/robots.txt
echo "  ✓ Updated robots.txt"

# Update sitemap.xml
sed -i.tmp "s|https://bitcurrent.exchange|https://$PRODUCTION_DOMAIN|g" frontend/public/sitemap.xml
echo "  ✓ Updated sitemap.xml"

# Update .well-known/ai.json
sed -i.tmp "s|https://bitcurrent.exchange|https://$PRODUCTION_DOMAIN|g" frontend/public/.well-known/ai.json
echo "  ✓ Updated ai.json"

# Update ai-readme.txt
sed -i.tmp "s|https://bitcurrent.exchange|https://$PRODUCTION_DOMAIN|g" frontend/public/ai-readme.txt
echo "  ✓ Updated ai-readme.txt"

# Update layout.tsx
sed -i.tmp "s|https://bitcurrent.exchange|https://$PRODUCTION_DOMAIN|g" frontend/app/layout.tsx
echo "  ✓ Updated layout.tsx"

# Clean up .tmp files
rm -f frontend/public/*.tmp
rm -f frontend/public/.well-known/*.tmp
rm -f frontend/app/*.tmp

echo ""
echo "✅ All URLs updated to https://$PRODUCTION_DOMAIN"
echo ""
echo "📋 Files modified:"
for file in "${FILES[@]}"; do
  echo "  - $file"
done

echo ""
echo "💾 Backups saved with .backup extension"
echo ""
echo "🚀 Next steps:"
echo "  1. Review the changes: git diff"
echo "  2. Test locally: npm run build && npm start"
echo "  3. Deploy to production"
echo "  4. Verify: curl https://$PRODUCTION_DOMAIN/robots.txt"
echo ""
echo "To restore backups if needed:"
echo "  for f in ${FILES[@]}; do mv \$f.backup \$f; done"

