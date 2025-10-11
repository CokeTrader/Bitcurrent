# 🚀 FINAL STEP: Update DNS Nameservers

**Status**: DNS records configured in Route53 ✅  
**Action Required**: Update nameservers at domain registrar ⏳

---

## 📋 CURRENT SITUATION

**Your Domain**: bitcurrent.co.uk  
**Current Nameservers**: ns1.dns-parking.com, ns2.dns-parking.com (OLD)  
**Current IP**: 84.32.84.32 (old server - timing out)

**Your AWS Route53 is configured with:**
- ✅ bitcurrent.co.uk → Your new LoadBalancer
- ✅ www.bitcurrent.co.uk → Your new LoadBalancer  
- ✅ api.bitcurrent.co.uk → Your API Gateway

**The issue:** Your domain registrar is still using old nameservers, so it's not using AWS Route53.

---

## ✅ SOLUTION: Update Nameservers

You need to update your domain registrar to use AWS Route53 nameservers.

### **New AWS Route53 Nameservers:**

```
ns-207.awsdns-25.com
ns-562.awsdns-06.net
ns-1106.awsdns-10.org
ns-1830.awsdns-36.co.uk
```

---

## 📝 STEP-BY-STEP INSTRUCTIONS

### Step 1: Find Your Domain Registrar

Your domain registrar is where you originally bought **bitcurrent.co.uk**. Common UK registrars:

- **123-reg** (most common for .co.uk)
- **Namecheap**
- **GoDaddy**
- **1&1 IONOS**
- **UK2**
- **Heart Internet**
- **Easily.co.uk**

**Not sure?** Check your email for the original purchase confirmation.

---

### Step 2: Update Nameservers

#### If using **123-reg**:

1. Go to https://www.123-reg.co.uk/
2. Log in to your account
3. Go to **"My Account"** → **"Domain Names"**
4. Click on **bitcurrent.co.uk**
5. Click **"Manage"**
6. Find **"Nameservers"** section
7. Select **"Use custom nameservers"** or **"Use other nameservers"**
8. Enter the 4 AWS nameservers:
   ```
   ns-207.awsdns-25.com
   ns-562.awsdns-06.net
   ns-1106.awsdns-10.org
   ns-1830.awsdns-36.co.uk
   ```
9. Click **"Save"** or **"Update"**

#### If using **Namecheap**:

1. Go to https://www.namecheap.com/
2. Log in
3. Go to **"Domain List"**
4. Click **"Manage"** next to bitcurrent.co.uk
5. Find **"Nameservers"** section
6. Select **"Custom DNS"**
7. Enter the 4 AWS nameservers
8. Click **"Save"** (green checkmark)

#### If using **GoDaddy**:

1. Go to https://www.godaddy.com/
2. Log in
3. Go to **"My Products"** → **"Domains"**
4. Click on **bitcurrent.co.uk**
5. Scroll to **"Additional Settings"** → **"Manage DNS"**
6. Click **"Change"** next to Nameservers
7. Select **"Enter my own nameservers (advanced)"**
8. Enter the 4 AWS nameservers
9. Click **"Save"**

#### If using **1&1 IONOS**:

1. Go to https://www.ionos.co.uk/
2. Log in to Control Panel
3. Click **"Domains & SSL"**
4. Click on **bitcurrent.co.uk**
5. Find **"Name Server Settings"**
6. Choose **"Use other name servers"**
7. Enter the 4 AWS nameservers
8. Click **"Save"**

#### If using another registrar:

Look for one of these sections in your domain management:
- "Nameservers"
- "DNS Management"
- "Name Server Settings"
- "Custom DNS"

Then select "Custom" or "Use other nameservers" and enter the 4 AWS nameservers.

---

### Step 3: Wait for DNS Propagation

After updating nameservers:

**Propagation Time**: 5 minutes to 48 hours (usually 1-4 hours)

**Check progress:**
```bash
# Run this command periodically
dig NS bitcurrent.co.uk +short

# When you see AWS nameservers, it's working!
# ns-207.awsdns-25.com
# ns-562.awsdns-06.net
# ns-1106.awsdns-10.org
# ns-1830.awsdns-36.co.uk
```

**Or use online tool:**
- Go to: https://www.whatsmydns.net/
- Enter: bitcurrent.co.uk
- Select: NS (Nameserver)
- Click "Search"
- Look for green checkmarks showing AWS nameservers globally

---

### Step 4: Verify Your Site is Live

Once DNS has propagated, test your domain:

**In Terminal:**
```bash
# Check if domain resolves to LoadBalancer
dig bitcurrent.co.uk +short

# Should return LoadBalancer IPs, not 84.32.84.32

# Test HTTP access
curl -I http://bitcurrent.co.uk/
# Should return HTTP 200 OK
```

**In Browser:**
```
http://bitcurrent.co.uk
http://www.bitcurrent.co.uk
```

You should see your beautiful new BitCurrent Exchange platform! 🎉

---

## 🔒 STEP 5 (OPTIONAL): Enable HTTPS/SSL

After DNS is working on HTTP, enable HTTPS:

### Option 1: AWS Certificate Manager (Recommended)

```bash
# Request SSL certificate
aws acm request-certificate \
  --domain-name bitcurrent.co.uk \
  --subject-alternative-names www.bitcurrent.co.uk api.bitcurrent.co.uk \
  --validation-method DNS \
  --region eu-west-2

# ACM will provide DNS validation records
# Add them to Route53 (or wait, ACM can auto-validate Route53 domains)
# Once validated, attach certificate to your LoadBalancer
```

### Option 2: Cloudflare (Easiest)

1. Sign up at https://www.cloudflare.com/ (free)
2. Add bitcurrent.co.uk
3. Cloudflare will give you their nameservers
4. Update registrar to use Cloudflare nameservers (instead of AWS)
5. In Cloudflare, point bitcurrent.co.uk to your LoadBalancer IP
6. Enable SSL in Cloudflare (set to "Full")
7. Enable "Always Use HTTPS"

**Benefits:**
- Free SSL certificate
- DDoS protection
- CDN (faster global access)
- Web Application Firewall

---

## 🎯 EXPECTED TIMELINE

| Time | Status |
|------|--------|
| **Now** | Update nameservers at registrar |
| **5-10 min** | Changes saved at registrar |
| **30 min - 4 hours** | DNS propagation in progress |
| **After propagation** | bitcurrent.co.uk shows your new site! |
| **+15 min** | Enable SSL (optional) |
| **Final** | https://bitcurrent.co.uk LIVE! 🚀 |

---

## 🔍 TROUBLESHOOTING

### Issue: "I can't find nameserver settings"

**Solution:**
- Contact your registrar's support
- They can update nameservers for you
- Just provide them the 4 AWS nameservers

### Issue: "DNS still showing old IP after 4 hours"

**Solution:**
- Clear your local DNS cache:
  ```bash
  # Mac
  sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
  
  # Windows
  ipconfig /flushdns
  ```
- Try a different network or use mobile data
- Check https://www.whatsmydns.net/ to see global propagation

### Issue: "Registrar requires 'glue records'"

**Solution:**
- This is rare for standard domains
- If asked, leave glue records blank
- AWS nameservers don't need glue records

### Issue: "Registrar wants to know what DNS to use"

**Solution:**
- Select "Custom DNS" or "External DNS"
- Do NOT use "Registrar DNS" or "Default DNS"
- Enter the 4 AWS nameservers

---

## 📞 QUICK REFERENCE

**Your AWS Nameservers:**
```
ns-207.awsdns-25.com
ns-562.awsdns-06.net
ns-1106.awsdns-10.org
ns-1830.awsdns-36.co.uk
```

**Current (old) nameservers:**
```
ns1.dns-parking.com
ns2.dns-parking.com
```

**Your LoadBalancer:**
```
ac8cfd5e19ab54e7bbb69cce445bc5c8-1219156361.eu-west-2.elb.amazonaws.com
```

**Route53 Hosted Zone ID:**
```
Z00451622MWQGFV0GZTYF
```

---

## ✅ CHECKLIST

Before updating nameservers:
- [ ] Know where domain was purchased
- [ ] Have login credentials for registrar
- [ ] Have AWS nameservers copied

After updating nameservers:
- [ ] Nameservers updated at registrar
- [ ] Waited 1-4 hours for propagation
- [ ] Verified with `dig NS bitcurrent.co.uk +short`
- [ ] Tested http://bitcurrent.co.uk in browser
- [ ] Site loads correctly
- [ ] (Optional) SSL certificate configured
- [ ] (Optional) Tested https://bitcurrent.co.uk

---

## 🎉 ONCE COMPLETE

After DNS propagates, your site will be live at:

- ✅ **http://bitcurrent.co.uk** - Your beautiful homepage
- ✅ **http://www.bitcurrent.co.uk** - Same site (www alias)
- ✅ **http://bitcurrent.co.uk/markets** - Live markets page
- ✅ **http://bitcurrent.co.uk/auth/login** - Premium login page
- ✅ **http://api.bitcurrent.co.uk** - Your API Gateway

**With SSL enabled:**
- ✅ **https://bitcurrent.co.uk** - Secure site with padlock 🔒

---

## 💡 WHY THIS IS NEEDED

**What happened:**
1. We deployed everything to AWS ✅
2. We configured Route53 DNS records ✅
3. We built and deployed the frontend ✅
4. Everything is ready and waiting ✅

**The missing link:**
- Your domain registrar still points to old nameservers
- Old nameservers point to old IP (84.32.84.32)
- That old server is dead/timing out

**Once you update nameservers:**
- Domain registrar → AWS Route53 nameservers
- Route53 → Your LoadBalancer
- LoadBalancer → Your beautiful new site! 🎉

---

## 🚀 YOU'RE ALMOST THERE!

Everything is deployed and ready. This is the final step between you and going live!

**Time needed**: 5 minutes to update + 1-4 hours propagation  
**Difficulty**: Easy (just copy/paste nameservers)  
**Result**: Your world-class exchange live on bitcurrent.co.uk! 🎊

---

**Questions?** Check the troubleshooting section above or let me know!

*Last updated: October 11, 2025*

