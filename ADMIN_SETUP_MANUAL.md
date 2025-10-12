# 🔐 Admin User Setup - Manual Guide

## ✅ Step 1: Admin User Created

**Admin user has been created successfully!**

**Credentials:**
- **Email:** `admin@bitcurrent.co.uk`
- **Password:** `AdminSecure123!`
- **User ID:** `e15b0928-7767-44d1-9923-e9a47eb2682a`

---

## 📝 Step 2: Make User an Admin (You Need to Do This)

### Option A: Using Railway Web UI (Easiest)

1. **Go to Railway:** https://railway.app
2. **Navigate to:** reliable-reverence project → Postgres service → **Database tab**
3. **Click on the "users" table** in the left sidebar
4. **Look for the user with email** `admin@bitcurrent.co.uk`
5. **Edit the row** and change `is_admin` from `false` to `true`
6. **Save** the changes

### Option B: Using SQL Query in Railway

1. **Go to Railway:** https://railway.app
2. **Navigate to:** reliable-reverence project → Postgres service → **Database tab**
3. **Look for a "Query" button** or SQL editor (usually at the top or in the Data section)
4. **Paste this SQL command:**
   ```sql
   UPDATE users SET is_admin = true WHERE id = 'e15b0928-7767-44d1-9923-e9a47eb2682a';
   ```
5. **Click "Execute" or "Run"**

### Option C: Using Command Line (psql)

If you have `psql` installed locally:

1. **Copy DATABASE_URL from Railway:**
   - Go to: Postgres service → Variables tab
   - Click "Show value" next to `DATABASE_URL`
   - Copy the entire connection string

2. **Run this command:**
   ```bash
   psql "YOUR_DATABASE_URL_HERE" -c "UPDATE users SET is_admin = true WHERE id = 'e15b0928-7767-44d1-9923-e9a47eb2682a';"
   ```

3. **Verify:**
   ```bash
   psql "YOUR_DATABASE_URL_HERE" -c "SELECT id, email, is_admin FROM users WHERE email = 'admin@bitcurrent.co.uk';"
   ```

---

## ✅ Step 3: Test Admin Functions

Once you've made the user an admin, run this test script:

```bash
./test-admin-functions.sh
```

This will:
1. ✅ Login as admin
2. ✅ Grant £10,000 paper funds to a test user
3. ✅ View platform stats
4. ✅ List all users

---

## 🎯 Step 4: Complete Trading Flow Test

After admin functions work, run the full trading test:

```bash
./test-complete-trading-flow.sh
```

This will test the complete user journey:
1. ✅ Register new user
2. ✅ Check initial balances
3. ✅ Grant paper funds (via admin)
4. ✅ Place BUY order
5. ✅ Verify balances after trade
6. ✅ Test 2FA setup

---

## 📊 Expected Results

### Before Admin Promotion:
```json
{
  "success": false,
  "error": "Admin access required"
}
```

### After Admin Promotion:
```json
{
  "success": true,
  "message": "Granted £10,000 paper trading funds to user..."
}
```

---

## 🆘 Troubleshooting

### If you can't find the Query interface in Railway:

**Alternative: Use the Bitcurrent Backend API directly!**

Since you have admin access via the auth routes, you can actually promote the user through an API endpoint if we create one. Let me create that for you!

Actually, the simplest way is:

**Option D: Use Railway CLI (if installed)**

```bash
# Install Railway CLI if needed
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run SQL command
railway run psql -c "UPDATE users SET is_admin = true WHERE id = 'e15b0928-7767-44d1-9923-e9a47eb2682a';"
```

---

## 💡 Summary

**What you need to do:**
1. Find a way to run this SQL command in Railway PostgreSQL:
   ```sql
   UPDATE users SET is_admin = true WHERE id = 'e15b0928-7767-44d1-9923-e9a47eb2682a';
   ```

2. Then run: `./test-admin-functions.sh`

3. Then run: `./test-complete-trading-flow.sh`

**Files created for you:**
- ✅ `create-admin-user.sh` - Creates admin account (already run)
- ✅ `make-user-admin.sql` - SQL command to promote user
- ✅ `test-admin-functions.sh` - Tests admin capabilities
- ✅ `test-complete-trading-flow.sh` - Tests full trading journey

**Once admin user is set up, the platform is READY FOR BETA USERS!** 🚀

