# 🔍 Login Debugging Guide

## Current Status

### ✅ Services Running
- API Gateway: `http://localhost:8080` ✓
- Frontend: `http://localhost:3000` ✓  
- PostgreSQL: `localhost:5432` ✓
- Redis: `localhost:6379` ✓

### ✅ API Testing (Command Line)
```bash
# Health check works
curl http://localhost:8080/health
# Response: {"checks":{"database":"up","redis":"up"},"status":"healthy"}

# Login endpoint works
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@bitcurrent.com","password":"DemoPassword123!"}'
# Response: Returns JWT token successfully
```

## Demo Account Credentials

**Email**: `demo@bitcurrent.com`  
**Password**: `DemoPassword123!`

## How to Test Login

### Option 1: Using the Frontend
1. Open: http://localhost:3000/auth/login
2. Enter the demo credentials above
3. Click "Sign In"

### Option 2: Using the Test Page
1. Open: file:///Users/poseidon/Monivo/Bitcurrent/Bitcurrent1/test-login.html
2. Click "Login" (credentials are pre-filled)
3. Check the result

### Option 3: Browser Console Test
Open the browser console on http://localhost:3000 and run:

```javascript
// Test API connection
fetch('http://localhost:8080/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'demo@bitcurrent.com',
    password: 'DemoPassword123!'
  })
})
.then(r => r.json())
.then(d => console.log('Success:', d))
.catch(e => console.error('Error:', e))
```

## Common Issues & Solutions

### Issue: "Network error" or "Cannot connect to server"

**Possible Causes:**
1. API Gateway not running
2. Wrong API URL in frontend
3. CORS issue
4. Browser blocking localhost connections

**Solutions:**

1. **Verify API Gateway is running:**
   ```bash
   lsof -i :8080
   # Should show: main (api-gateway) listening on port 8080
   ```

2. **Check API health:**
   ```bash
   curl http://localhost:8080/health
   ```

3. **Check frontend API URL:**
   The frontend uses: `http://localhost:8080` by default
   
4. **Clear browser cache:**
   - Open DevTools (F12)
   - Right-click refresh button → "Empty Cache and Hard Reload"

5. **Check browser console:**
   - Open DevTools (F12)  
   - Go to Console tab
   - Try to login and check for errors

### Issue: "Invalid credentials" or 401 Error

This means the API is working but the credentials are wrong.

**Solution:** Make sure you're using:
- Email: `demo@bitcurrent.com`
- Password: `DemoPassword123!` (with capital D and !)

### Issue: Frontend shows blank page

**Solution:** Restart the frontend:
```bash
cd /Users/poseidon/Monivo/Bitcurrent/Bitcurrent1/frontend
npm run dev
```

## Debugging Steps

1. **Check if API is responding:**
   ```bash
   curl http://localhost:8080/health
   ```

2. **Check if frontend can reach API:**
   Open browser console and run:
   ```javascript
   fetch('http://localhost:8080/health').then(r => r.json()).then(console.log)
   ```

3. **Check browser network tab:**
   - Open DevTools → Network tab
   - Try to login
   - Look for the login request
   - Check if it succeeded or failed

4. **Check API Gateway logs:**
   Look at the terminal where you started the API Gateway.
   You should see log entries like:
   ```
   INFO  HTTP request completed  {"method": "POST", "path": "/api/v1/auth/login", ...}
   ```

## API Endpoints

### Public (No Authentication Required)
- POST `/api/v1/auth/login` - User login
- POST `/api/v1/auth/register` - User registration  
- GET `/api/v1/markets` - List trading pairs
- GET `/health` - Health check

### Protected (Requires JWT Token)
- GET `/api/v1/profile` - Get user profile
- POST `/api/v1/orders` - Place order
- GET `/api/v1/accounts/{id}/balances` - Get balances

## Next Steps

1. Try logging in at: http://localhost:3000/auth/login
2. Check the browser console for any errors
3. If it works, you should be redirected to: http://localhost:3000/dashboard
4. If it fails, check the browser Network tab to see the actual error

## Support

If you're still having issues:
1. Take a screenshot of the browser console (F12 → Console)
2. Take a screenshot of the Network tab showing the failed request
3. Check the terminal output where API Gateway is running for error logs



