# BitCurrent Exchange - Domain Nameservers

**Domain**: bitcurrent.co.uk  
**AWS Hosted Zone ID**: Z00451622MWQGFV0GZTYF  
**Created**: October 10, 2025  
**Status**: ✅ ACTIVE

---

## 📋 YOUR NAMESERVERS

Update your domain registrar with these **4 nameservers**:

```
ns-207.awsdns-25.com
ns-562.awsdns-06.net
ns-1106.awsdns-10.org
ns-1830.awsdns-36.co.uk
```

---

## 🔧 HOW TO UPDATE NAMESERVERS

### **Step 1: Login to Your Domain Registrar**

Where did you buy **bitcurrent.co.uk**?

**Common UK Registrars:**
- Namecheap
- GoDaddy  
- 123-reg
- Google Domains
- Cloudflare

---

### **Step 2: Update Nameservers**

#### **If Namecheap:**
```
1. Login to Namecheap.com
2. Click "Domain List"
3. Click "Manage" next to bitcurrent.co.uk
4. Scroll to "Nameservers" section
5. Select "Custom DNS"
6. Enter the 4 AWS nameservers:
   - ns-207.awsdns-25.com
   - ns-562.awsdns-06.net
   - ns-1106.awsdns-10.org
   - ns-1830.awsdns-36.co.uk
7. Click the green checkmark to save
8. Done! ✅
```

#### **If GoDaddy:**
```
1. Login to GoDaddy.com
2. Go to "My Products" → "Domains"
3. Click bitcurrent.co.uk
4. Scroll to "Nameservers"
5. Click "Change"
6. Select "I'll use my own nameservers"
7. Enter the 4 AWS nameservers
8. Click "Save"
9. Done! ✅
```

#### **If 123-reg:**
```
1. Login to 123-reg.co.uk
2. Go to "My domains"
3. Click "Manage" on bitcurrent.co.uk
4. Click "Manage" → "Nameservers"
5. Select "Custom nameservers"
6. Enter the 4 AWS nameservers
7. Click "Update"
8. Done! ✅
```

#### **If Google Domains:**
```
1. Login to domains.google.com
2. Click bitcurrent.co.uk
3. Click "DNS" in left menu
4. Scroll to "Custom name servers"
5. Click "Switch to custom name servers"
6. Enter the 4 AWS nameservers
7. Click "Save"
8. Done! ✅
```

#### **If Cloudflare:**
```
1. Login to Cloudflare
2. Add site: bitcurrent.co.uk
3. Follow wizard to change nameservers
4. Or manually update at your original registrar
5. Done! ✅
```

---

### **Step 3: Wait for DNS Propagation**

**How long?**
- Minimum: 15-30 minutes
- Typical: 2-4 hours
- Maximum: 24-48 hours

**Check propagation:**
```bash
# Check if nameservers updated
dig NS bitcurrent.co.uk +short

# Should eventually show:
# ns-207.awsdns-25.com
# ns-562.awsdns-06.net
# ns-1106.awsdns-10.org
# ns-1830.awsdns-36.co.uk
```

**Check from different locations:**
```bash
# Google DNS
dig @8.8.8.8 NS bitcurrent.co.uk +short

# Cloudflare DNS
dig @1.1.1.1 NS bitcurrent.co.uk +short
```

---

## 📝 WHAT HAPPENS AFTER DNS PROPAGATES

Once the nameservers propagate, AWS Route53 will control DNS for bitcurrent.co.uk.

### **You'll need to add DNS records for:**

```bash
# A records (IP addresses)
bitcurrent.co.uk          → CloudFront or Load Balancer
www.bitcurrent.co.uk      → CloudFront
api.bitcurrent.co.uk      → Application Load Balancer
ws.bitcurrent.co.uk       → Network Load Balancer
admin.bitcurrent.co.uk    → Admin panel
grafana.bitcurrent.co.uk  → Monitoring

# MX records (email)
bitcurrent.co.uk          → Email service (if needed)

# TXT records (verification)
_dmarc.bitcurrent.co.uk   → Email security
```

**For now, you don't need to do this** - the starter environment is for backend testing only.

---

## ⚠️ IMPORTANT NOTES

### **DNS Propagation is Slow:**
- Don't panic if it doesn't work immediately
- Can take up to 48 hours (usually 2-4 hours)
- Check periodically with `dig` command above

### **Current Setup:**
- ✅ Route53 hosted zone created
- ✅ Nameservers assigned by AWS
- ⏳ Waiting for you to update at registrar
- ⏳ Waiting for DNS propagation

### **What This Costs:**
- Route53 hosted zone: £0.50/month
- DNS queries: £0.40 per million queries (basically free)

---

## ✅ SUMMARY

**Your 4 Nameservers:**
```
1. ns-207.awsdns-25.com
2. ns-562.awsdns-06.net
3. ns-1106.awsdns-10.org
4. ns-1830.awsdns-36.co.uk
```

**What to do:**
1. Login to your domain registrar (where you bought bitcurrent.co.uk)
2. Find DNS/Nameserver settings
3. Change from current nameservers to the 4 AWS ones above
4. Save changes
5. Wait 2-48 hours for propagation
6. Verify with: `dig NS bitcurrent.co.uk`

**Cost**: £0.50/month

---

**Need help finding your registrar or changing nameservers?** Let me know which company you bought the domain from!


