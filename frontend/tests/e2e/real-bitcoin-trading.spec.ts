/**
 * End-to-End Test: Real Bitcoin Trading Flow
 * 
 * Tests the complete £10 journey:
 * 1. Sign up / Log in
 * 2. Deposit £10
 * 3. Buy Bitcoin
 * 4. Verify balance
 * 5. Sell Bitcoin
 * 6. Verify PnL
 */

import { test, expect } from '@playwright/test';

test.describe('Real Bitcoin Trading - Complete Flow', () => {
  
  test('Complete £10 journey: Deposit → Buy → Sell with PnL', async ({ page }) => {
    // Navigate to platform
    await page.goto('https://bitcurrent.co.uk');

    // Step 1: Sign up (or log in if account exists)
    await page.click('text=Sign Up');
    await page.fill('input[name="email"]', `test_${Date.now()}@bitcurrent.test`);
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.click('button:has-text("Create Account")');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/dashboard/);

    // Step 2: Navigate to Real Trading
    await page.goto('https://bitcurrent.co.uk/trade/real');
    await page.waitForLoadState('networkidle');

    // Step 3: Deposit £10
    await page.click('button:has-text("Deposit")');
    await page.fill('input[type="number"]', '10');
    
    // Fill Stripe test card (if Stripe Elements loaded)
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
    if (await stripeFrame.locator('input[name="cardnumber"]').isVisible().catch(() => false)) {
      await stripeFrame.locator('input[name="cardnumber"]').fill('4242424242424242');
      await stripeFrame.locator('input[name="exp-date"]').fill('12/25');
      await stripeFrame.locator('input[name="cvc"]').fill('123');
      await stripeFrame.locator('input[name="postal"]').fill('SW1A 1AA');
    }

    await page.click('button:has-text("Deposit")');
    
    // Wait for success message
    await page.waitForSelector('text=/Successfully deposited/i', { timeout: 10000 });
    
    // Verify GBP balance updated
    const balance = await page.textContent('[data-testid="gbp-balance"]');
    expect(parseFloat(balance.replace(/[^0-9.]/g, ''))).toBeGreaterThanOrEqual(10);

    // Step 4: Buy Bitcoin
    await page.click('[data-tab="buy"]');
    await page.fill('input[placeholder*="GBP"]', '10');
    await page.click('button:has-text("Buy Bitcoin")');

    // Wait for success
    await page.waitForSelector('text=/Successfully bought/i', { timeout: 10000 });

    // Verify BTC balance updated
    const btcBalance = await page.textContent('[data-testid="btc-balance"]');
    expect(parseFloat(btcBalance.replace(/[^0-9.]/g, ''))).toBeGreaterThan(0);

    // Step 5: Wait a moment (simulate price change)
    await page.waitForTimeout(2000);

    // Step 6: Sell Bitcoin
    await page.click('[data-tab="sell"]');
    const btcAmount = await page.inputValue('input[placeholder*="BTC"]');
    await page.fill('input[placeholder*="BTC"]', btcAmount);
    await page.click('button:has-text("Sell")');

    // Wait for success with PnL
    await page.waitForSelector('text=/Successfully sold/i', { timeout: 10000 });

    // Verify PnL is displayed
    const pnlText = await page.textContent('[data-testid="pnl-display"]');
    expect(pnlText).toMatch(/£|profit|loss/i);

    // Step 7: Verify updated GBP balance
    const finalBalance = await page.textContent('[data-testid="gbp-balance"]');
    expect(parseFloat(finalBalance.replace(/[^0-9.]/g, ''))).toBeGreaterThan(0);

    // Take screenshot of final state
    await page.screenshot({ path: 'tests/screenshots/real-trading-complete.png', fullPage: true });
  });

  test('Bitcoin withdrawal to external wallet', async ({ page }) => {
    // Assume user is logged in with BTC balance
    await page.goto('https://bitcurrent.co.uk/trade/real');

    // Navigate to withdraw tab
    await page.click('[data-tab="withdraw"]');

    // Fill valid Bitcoin address
    await page.fill('input[placeholder*="bc1"]', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    await page.fill('input[placeholder*="BTC"]', '0.0001');

    // Click withdraw
    await page.click('button:has-text("Withdraw")');

    // Should either succeed or require KYC
    await page.waitForSelector('text=/Successfully|KYC|verification/i', { timeout: 10000 });

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/btc-withdrawal.png' });
  });

  test('Advanced order creation', async ({ page }) => {
    await page.goto('https://bitcurrent.co.uk/trade/advanced');

    // Create limit order
    await page.click('text=Limit');
    await page.selectOption('select[name="side"]', 'buy');
    await page.fill('input[name="amount"]', '100');
    await page.fill('input[name="limitPrice"]', '35000');
    await page.click('button:has-text("Create Limit Order")');

    await page.waitForSelector('text=/Limit buy order created/i', { timeout: 5000 });
  });
});

describe('Security Tests', () => {
  test('Should prevent unauthorized access', async ({ page }) => {
    // Try to access protected route without auth
    const response = await page.goto('https://bitcurrent.co.uk/api/v1/real-trading/portfolio');
    expect(response?.status()).toBe(401);
  });

  test('Should validate input to prevent XSS', async ({ page }) => {
    await page.goto('https://bitcurrent.co.uk/trade/real');
    
    // Try XSS in amount field
    await page.fill('input[type="number"]', '<script>alert("xss")</script>');
    
    // Should sanitize and not execute script
    const alerts = [];
    page.on('dialog', dialog => {
      alerts.push(dialog);
      dialog.dismiss();
    });

    await page.waitForTimeout(1000);
    expect(alerts).toHaveLength(0);
  });
});

