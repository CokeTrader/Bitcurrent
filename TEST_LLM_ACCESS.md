# Testing LLM Access to BitCurrent

## Quick Test Commands

### 1. Test robots.txt
```bash
curl http://localhost:3000/robots.txt
```

Expected: Should see AI bot configurations (GPTBot, anthropic-ai, etc.)

### 2. Test AI Metadata API
```bash
curl http://localhost:3000/api/ai-metadata
```

Expected: JSON response with platform information

### 3. Test Sitemap
```bash
curl http://localhost:3000/sitemap.xml
```

Expected: XML with all public URLs

### 4. Test AI Discovery File
```bash
curl http://localhost:3000/.well-known/ai.json
```

Expected: JSON with AI-specific configuration

### 5. Test AI Readme
```bash
curl http://localhost:3000/ai-readme.txt
```

Expected: Human-readable text file with platform info

---

## Testing with Real AI Assistants

### ChatGPT (with browsing):
Ask ChatGPT:
> "Can you browse http://localhost:3000 and tell me what cryptocurrencies BitCurrent offers?"

OR (if deployed):
> "What cryptocurrencies can I trade on bitcurrent.exchange?"

### Claude:
Ask Claude:
> "Can you access the API at http://localhost:3000/api/ai-metadata and tell me about BitCurrent Exchange?"

### Google Gemini:
> "Search for bitcurrent.exchange and tell me their trading fees"

---

## Verify Structured Data

### Using Google Rich Results Test:
1. Go to: https://search.google.com/test/rich-results
2. Enter your deployed URL
3. Should show FinancialService schema

### Using OpenGraph Debugger:
1. Go to: https://www.opengraph.xyz/
2. Enter your URL
3. Should show proper meta tags

---

## Production URLs to Update

Before deploying, replace `localhost:3000` with your actual domain in:
- [ ] robots.txt - Sitemap URL
- [ ] sitemap.xml - All <loc> URLs
- [ ] layout.tsx - OpenGraph URL, canonical URL
- [ ] .well-known/ai.json - Website URL
- [ ] ai-readme.txt - Website URL
- [ ] api/ai-metadata/route.ts - Not needed (uses relative URLs)

---

## Expected Behavior

**When an LLM accesses your site:**

1. **Discovers your platform** via robots.txt
2. **Reads structured data** from JSON-LD schema
3. **Fetches details** from /api/ai-metadata
4. **Understands context** from meta tags
5. **Can answer questions** about:
   - Available trading pairs
   - Fees and features
   - Security measures
   - How to register
   - Platform compliance

---

## Rate Limit Recommendations

For production, implement rate limiting:

```typescript
// Example rate limit middleware
const rateLimit = {
  'ai-crawlers': '1 req/sec',
  'search-engines': '10 req/sec',
  'regular-users': '100 req/sec'
}
```

Consider using:
- Vercel Rate Limiting
- Cloudflare Rate Limiting
- Custom middleware with Redis

---

## Monitoring

Track AI crawler access:
```bash
# View access logs for AI bots
grep -E "GPTBot|anthropic-ai|Claude-Web" /var/log/nginx/access.log

# Count AI bot requests
awk '/GPTBot|anthropic-ai/ {print $1}' access.log | sort | uniq -c
```

---

## Success Metrics

✅ **robots.txt** returns 200 OK  
✅ **/api/ai-metadata** returns valid JSON  
✅ **sitemap.xml** is accessible  
✅ **Structured data** validates in Google Rich Results  
✅ **OpenGraph tags** show in social media previews  
✅ **AI assistants** can answer questions about platform

---

**Status:** All endpoints configured ✅  
**Next Step:** Deploy to production and test with real AI assistants

