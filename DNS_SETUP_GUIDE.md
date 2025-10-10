# DNS Setup Guide for bitcurrent.co.uk

## ✅ What Has Been Done

1. **Route53 Hosted Zone Created**: `Z00451622MWQGFV0GZTYF`
2. **DNS Records Created**:
   - `bitcurrent.co.uk` → AWS LoadBalancer (A record alias)
   - `www.bitcurrent.co.uk` → AWS LoadBalancer (A record alias)

## 🔧 What You Need to Do

### **CRITICAL STEP: Update Nameservers at Your Domain Registrar**

Your domain `bitcurrent.co.uk` is currently using parking nameservers. You need to update them to AWS Route53 nameservers.

#### **Route53 Nameservers (Use These):**
```
ns-207.awsdns-25.com
ns-562.awsdns-06.net
ns-1106.awsdns-10.org
ns-1830.awsdns-36.co.uk
```

#### **Steps:**

1. **Log in to your domain registrar** (whoever you bought bitcurrent.co.uk from - e.g., GoDaddy, Namecheap, 123-reg, etc.)

2. **Find the DNS/Nameserver settings** for bitcurrent.co.uk

3. **Replace the current nameservers** with the AWS Route53 nameservers listed above

4. **Save the changes**

5. **Wait for DNS propagation** (usually 5-60 minutes, can take up to 48 hours)

---

## 🧪 Testing After Nameserver Update

Once you've updated the nameservers, wait a few minutes and then run:

```bash
# Check if nameservers have updated
dig bitcurrent.co.uk NS +short

# Should show:
# ns-207.awsdns-25.com.
# ns-562.awsdns-06.net.
# ns-1106.awsdns-10.org.
# ns-1830.awsdns-36.co.uk.
```

```bash
# Check if domain points to AWS LoadBalancer
nslookup bitcurrent.co.uk

# Should show IPs like:
# 13.42.168.95
# 13.43.72.181
```

```bash
# Test website access
curl -I http://bitcurrent.co.uk

# Should show:
# HTTP/1.1 200 OK
# X-Powered-By: Next.js
```

---

## 📱 Expected Results

Once the nameservers are updated and DNS has propagated:

- **http://bitcurrent.co.uk** → Your BitCurrent Exchange homepage
- **http://www.bitcurrent.co.uk** → Your BitCurrent Exchange homepage
- **http://bitcurrent.co.uk/markets** → Markets page
- **http://bitcurrent.co.uk/trade/BTC-GBP** → Trading page
- **http://bitcurrent.co.uk/auth/login** → Login page

---

## 🔒 Next Steps (After DNS Works)

1. **Add SSL Certificate** (HTTPS)
   - Use AWS Certificate Manager (ACM)
   - Request certificate for `bitcurrent.co.uk` and `*.bitcurrent.co.uk`
   - Configure LoadBalancer to use HTTPS

2. **Set up CloudFront CDN** (optional)
   - Faster global performance
   - DDoS protection
   - Better caching

---

## ℹ️ Current Status

| Item | Status |
|------|--------|
| Route53 Hosted Zone | ✅ Created |
| DNS A Records | ✅ Created |
| Nameservers at Registrar | ⚠️ **NEEDS UPDATE** |
| SSL/HTTPS | ❌ Not configured yet |
| Website on AWS | ✅ Working at LoadBalancer URL |

---

## 🆘 Troubleshooting

**Q: I updated nameservers but website still shows parking page?**
- Wait longer for DNS propagation (can take up to 48 hours)
- Clear your browser cache
- Try in incognito/private browsing mode
- Test from different device/network

**Q: Which domain registrar do I use?**
- Check your email for domain purchase confirmation
- Common UK registrars: 123-reg, Namecheap, GoDaddy, Fasthosts, Heart Internet

**Q: Can I test the website before DNS updates?**
- Yes! Use the direct LoadBalancer URL:
  ```
  http://ac8cfd5e19ab54e7bbb69cce445bc5c8-1219156361.eu-west-2.elb.amazonaws.com
  ```

---

## 📞 Support

If you encounter issues, provide:
1. Your domain registrar name
2. Screenshot of nameserver settings
3. Output of `dig bitcurrent.co.uk NS +short`
4. Output of `nslookup bitcurrent.co.uk`


