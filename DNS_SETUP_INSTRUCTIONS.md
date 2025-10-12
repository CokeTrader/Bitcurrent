# How to Make bitcurrent.co.uk Work

## Current Issue
Your site works at the Vercel URL but not at bitcurrent.co.uk because DNS records aren't configured.

## Solution (5 minutes)

### Step 1: Log into Hostinger
Go to: https://hostinger.com
- Log in with your Hostinger account
- Go to "Domains" section
- Click on "bitcurrent.co.uk"

### Step 2: Configure DNS Records
Click on "DNS / Name Servers" and add these records:

**Record 1 (Root domain):**
- Type: A
- Name: @ (or leave blank)
- Value: 76.76.21.21
- TTL: 3600 (or Auto)

**Record 2 (WWW subdomain):**
- Type: CNAME  
- Name: www
- Value: cname.vercel-dns.com
- TTL: 3600 (or Auto)

### Step 3: Wait
- DNS propagation takes 5-15 minutes
- Vercel will automatically provision SSL certificate
- Site will be accessible at both:
  - https://bitcurrent.co.uk
  - https://www.bitcurrent.co.uk

### Step 4: Test
After 15 minutes, try visiting:
- https://bitcurrent.co.uk
- Should see your exchange platform
- SSL padlock should show (secure connection)

## Why This Is Needed
- Vercel hosts your site
- bitcurrent.co.uk is registered at Hostinger
- DNS records tell Hostinger "send bitcurrent.co.uk traffic to Vercel"
- Without DNS records, browsers don't know where to find your site

## Alternative (Quick Test)
If you want to test immediately, use:
- https://bitcurrent-git-main-coketraders-projects.vercel.app/

This URL works right now and will continue working even after DNS is set up.
