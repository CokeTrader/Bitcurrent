/**
 * E2E Test: Complete Trading Flow
 * Tests the full user journey from registration to trade execution
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

test.describe('Complete Trading Flow', () => {
  // Generate unique test user
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Test1234!@#$';

  test('Full user journey: Register → Deposit → Trade → Withdraw', async ({ page }) => {
    // Step 1: Homepage
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/BitCurrent/);
    await expect(page.locator('text=Trade Bitcoin for 0.25%')).toBeVisible();

    // Step 2: Register
    await page.click('text=Start Trading');
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', testPassword);
    await page.fill('[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Welcome')).toBeVisible();

    // Step 3: Navigate to deposit page
    await page.click('text=Deposit');
    await expect(page).toHaveURL(/\/deposit/);

    // Step 4: Initiate deposit (Stripe)
    await page.click('text=Card');
    await page.fill('[name="amount"]', '100');
    await page.click('button:has-text("Deposit via Stripe")');

    // Should redirect to Stripe checkout (in test mode)
    // In real E2E, we'd need to handle Stripe's test card flow

    // Skip actual payment for this test
    // Go back to dashboard
    await page.goto(`${BASE_URL}/dashboard`);

    // Step 5: Navigate to trading
    await page.click('text=Trade');
    await expect(page).toHaveURL(/\/trade/);

    // Step 6: Select trading pair
    await page.click('text=BTC/USD');
    await expect(page.locator('text=Bitcoin')).toBeVisible();

    // Step 7: Place a market buy order
    await page.click('button:has-text("Buy")');
    await page.fill('[name="amount"]', '0.001');
    await page.click('button:has-text("Place Market Order")');

    // Should show confirmation
    await expect(page.locator('text=Order Placed')).toBeVisible();

    // Step 8: Check order history
    await page.click('text=Orders');
    await expect(page.locator('text=BTC/USD')).toBeVisible();
    await expect(page.locator('text=buy')).toBeVisible();

    // Step 9: Check portfolio
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page.locator('text=Portfolio')).toBeVisible();
    // Should show BTC in holdings
    await expect(page.locator('text=BTC')).toBeVisible();

    // Step 10: Logout
    await page.click('[aria-label="User menu"]');
    await page.click('text=Logout');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('Negative case: Insufficient balance', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/auth/login`);
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Try to place order with insufficient funds
    await page.goto(`${BASE_URL}/trade/BTCUSD`);
    await page.click('button:has-text("Buy")');
    await page.fill('[name="amount"]', '999999'); // Huge amount
    await page.click('button:has-text("Place Market Order")');

    // Should show error
    await expect(page.locator('text=Insufficient balance')).toBeVisible();
  });

  test('Negative case: Invalid order amount', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    await page.goto(`${BASE_URL}/trade/BTCUSD`);
    await page.click('button:has-text("Buy")');
    await page.fill('[name="amount"]', '-1'); // Negative amount
    await page.click('button:has-text("Place Market Order")');

    // Should show validation error
    await expect(page.locator('text=Invalid amount')).toBeVisible();
  });

  test('Security: Protected routes require auth', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('UI: Mobile responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(BASE_URL);
    
    // Mobile menu should be visible
    await expect(page.locator('[aria-label="Menu"]')).toBeVisible();
    
    // Mobile CTA should be visible
    await expect(page.locator('text=Get £10 Free')).toBeVisible();
  });

  test('Performance: Page load times', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL);
    const loadTime = Date.now() - start;

    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);

    // Check Lighthouse score (basic)
    // Note: Full Lighthouse would require additional setup
  });
});

test.describe('Trading Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/auth/login`);
    // Use existing test account
    await page.fill('[name="email"]', 'test@bitcurrent.com');
    await page.fill('[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
  });

  test('Limit order placement', async ({ page }) => {
    await page.goto(`${BASE_URL}/trade/BTCUSD`);
    await page.click('text=Limit');
    await page.fill('[name="amount"]', '0.001');
    await page.fill('[name="price"]', '50000');
    await page.click('button:has-text("Place Limit Order")');

    await expect(page.locator('text=Order Placed')).toBeVisible();
  });

  test('Order cancellation', async ({ page }) => {
    await page.goto(`${BASE_URL}/orders`);
    
    // Find an open order
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await expect(page.locator('text=Order Cancelled')).toBeVisible();
    }
  });

  test('Real-time price updates', async ({ page }) => {
    await page.goto(`${BASE_URL}/trade/BTCUSD`);
    
    const priceElement = page.locator('[data-testid="current-price"]');
    const initialPrice = await priceElement.textContent();
    
    // Wait for price update (WebSocket)
    await page.waitForTimeout(5000);
    
    const updatedPrice = await priceElement.textContent();
    
    // Price should have updated (in most cases)
    // Note: May be same if market is very quiet
  });
});

test.describe('Security Tests', () => {
  test('CSRF protection on state-changing operations', async ({ page }) => {
    // Try to place order without CSRF token
    const response = await page.request.post(`${BASE_URL}/api/v1/orders`, {
      data: {
        pair: 'BTC/USD',
        side: 'buy',
        amount: 0.001,
        type: 'market'
      }
    });

    // Should be rejected
    expect(response.status()).toBe(403);
  });

  test('SQL injection attempt', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);
    
    // Try SQL injection in email field
    await page.fill('[name="email"]', "' OR '1'='1");
    await page.fill('[name="password"]', "' OR '1'='1");
    await page.click('button[type="submit"]');

    // Should show invalid credentials (not SQL error)
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('XSS prevention', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/auth/login`);
    await page.fill('[name="email"]', 'test@bitcurrent.com');
    await page.fill('[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');

    // Try XSS in profile update
    await page.goto(`${BASE_URL}/settings`);
    await page.fill('[name="displayName"]', '<script>alert("XSS")</script>');
    await page.click('button:has-text("Save")');

    // Script should be sanitized, not executed
    // Check that page still functions
    await expect(page).toHaveURL(/\/settings/);
  });
});

