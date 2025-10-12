# 🌐 Hostinger DNS Configuration for bitcurrent.co.uk

**Critical Fix:** Make bitcurrent.co.uk point to Vercel deployment

---

## ⚠️ Current Issue

**Domain:** bitcurrent.co.uk  
**Status:** DNS_PROBE_FINISHED_NXDOMAIN  
**Cause:** Mixed Hostinger parking + Vercel DNS  

---

## ✅ Solution: Configure Hostinger DNS Correctly

### Step 1: Log into Hostinger
1. Go to: https://hpanel.hostinger.com/
2. Log in with your credentials
3. Navigate to: **Domains** → **bitcurrent.co.uk**

### Step 2: Open DNS Zone Editor
1. Click on **bitcurrent.co.uk**
2. Click **DNS / Name Servers** tab
3. Select **Manage DNS Records**

### Step 3: Delete ALL Existing Records
**Important:** Clean slate approach
- Delete all A records
- Delete all CNAME records  
- Delete all parking nameserver references
- Keep ONLY MX records (for email) if needed

### Step 4: Add Vercel DNS Records

**Add A Record for Root Domain:**
```
Type: A
Name: @ (or leave blank)
Points to: 76.76.21.21
TTL: 3600 (1 hour)
```

**Optional: Add second A record for redundancy:**
```
Type: A
Name: @
Points to: 76.76.21.164
TTL: 3600
```

**Add CNAME for www:**
```
Type: CNAME
Name: www
Points to: cname.vercel-dns.com
TTL: 3600
```

### Step 5: Remove Parking Nameservers

**In the Nameservers section:**
- **Remove:** ns1.dns-parking.com
- **Remove:** ns2.dns-parking.com
- **Use:** Hostinger nameservers OR enter Vercel nameservers

**Recommended:** Use Hostinger nameservers + DNS records above

### Step 6: Save & Wait for Propagation

1. Click **Save** or **Add Record**
2. Wait **5-30 minutes** for DNS propagation
3. Test with: `nslookup bitcurrent.co.uk`
4. Expected result: `76.76.21.21` or `76.76.21.164`

---

## 🧪 Verification Steps

### Test DNS Resolution:
```bash
# Check A record
nslookup bitcurrent.co.uk

# Should return:
# Name: bitcurrent.co.uk
# Address: 76.76.21.21

# Check CNAME for www
nslookup www.bitcurrent.co.uk

# Should return:
# www.bitcurrent.co.uk canonical name = cname.vercel-dns.com
```

### Test in Browser:
1. Clear browser cache (Cmd+Shift+R on Mac)
2. Visit: https://bitcurrent.co.uk
3. Should redirect to Vercel deployment
4. Check SSL certificate (should be valid)

### Verify in Vercel Dashboard:
1. Go to: https://vercel.com/bitcurrent
2. Click **Domains** tab
3. Check bitcurrent.co.uk status
4. Should show: ✅ **Valid Configuration**

---

## 🤖 Comet Browser Automation

**Quick Fix via Comet:**
```
1. Navigate to https://hpanel.hostinger.com/
2. Log in with credentials
3. Click "Domains"
4. Click "bitcurrent.co.uk"
5. Click "DNS / Name Servers"
6. Click "Manage DNS Records"
7. Delete all A and CNAME records
8. Click "Add Record"
9. Type: A, Name: @, Points to: 76.76.21.21, TTL: 3600
10. Click "Add Record"
11. Type: CNAME, Name: www, Points to: cname.vercel-dns.com, TTL: 3600
12. Save changes
13. Wait 15 minutes
14. Test: https://bitcurrent.co.uk
```

---

## 📊 Expected Results

**Before Fix:**
- bitcurrent.co.uk → DNS_PROBE_FINISHED_NXDOMAIN
- Users can't find the site on Google
- Domain appears "broken"

**After Fix (15-30 min):**
- ✅ bitcurrent.co.uk → Loads Vercel deployment
- ✅ www.bitcurrent.co.uk → Also works
- ✅ SSL certificate valid
- ✅ Google can index the domain
- ✅ Users can access via main domain

---

## ⏱️ Timeline

- **Configure DNS:** 5 minutes
- **DNS Propagation:** 5-30 minutes (usually ~15 min)
- **SSL Certificate:** Automatic (Vercel handles)
- **Google Indexing:** 24-48 hours

---

## 🆘 Troubleshooting

### "Still not working after 30 minutes?"
- Check DNS with: `dig bitcurrent.co.uk`
- Flush local DNS cache: `sudo dscacheutil -flushcache` (Mac)
- Try incognito mode
- Wait up to 24 hours for global propagation

### "SSL certificate error?"
- Vercel auto-generates SSL
- Usually takes 2-5 minutes after DNS resolves
- Check Vercel dashboard for SSL status

### "Vercel says 'Invalid Configuration'?"
- Ensure CNAME points to `cname.vercel-dns.com` (not IP)
- Ensure A record points to Vercel IP (76.76.21.21)
- Check for typos in DNS records

---

**PRIORITY: FIX THIS MORNING**

This is the #1 blocker for users finding BitCurrent via the main domain.  
Once fixed, bitcurrent.co.uk will be your primary, professional domain!

🚀 **Let's get it live!**

