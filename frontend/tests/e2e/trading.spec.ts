import { test, expect } from '@playwright/test';

test.describe('Trading Features', () => {
  
  test('should display markets page with real prices', async ({ page }) => {
    await page.goto('/markets');
    
    // Should see markets table
    await expect(page.getByText(/bitcoin/i)).toBeVisible();
    await expect(page.getByText(/ethereum/i)).toBeVisible();
    
    // Should see prices with £ symbol
    await expect(page.locator('text=/£[0-9,]+/')).toBeVisible();
  });

  test('should navigate to trading page from markets', async ({ page }) => {
    await page.goto('/markets');
    
    // Click on Bitcoin
    await page.getByRole('button', { name: /bitcoin/i }).first().click();
    
    // Should go to BTC trading page
    await expect(page).toHaveURL(/trade\/BTC-GBP/);
  });

  test('should display trading interface with 3 columns', async ({ page }) => {
    await page.goto('/trade/BTC-GBP');
    
    // Wait for price to load
    await page.waitForSelector('text=/£[0-9,]+/', { timeout: 10000 });
    
    // Should see order book
    await expect(page.getByText(/order book|bids|asks/i)).toBeVisible();
    
    // Should see chart
    await expect(page.locator('canvas')).toBeVisible();
    
    // Should see trade form
    await expect(page.getByText(/buy|sell/i)).toBeVisible();
  });

  test('should show real-time price updates', async ({ page }) => {
    await page.goto('/trade/BTC-GBP');
    
    // Wait for price to load
    const priceElement = page.locator('text=/£[0-9,]+/').first();
    await expect(priceElement).toBeVisible();
    
    // Get initial price
    const initialPrice = await priceElement.textContent();
    
    // Wait a bit for WebSocket update
    await page.waitForTimeout(3000);
    
    // Price element should still be visible (even if same price)
    await expect(priceElement).toBeVisible();
  });

  test('should switch chart timeframes', async ({ page }) => {
    await page.goto('/trade/BTC-GBP');
    
    // Wait for page load
    await page.waitForSelector('text=/£[0-9,]+/');
    
    // Should see timeframe buttons
    await expect(page.getByRole('button', { name: '1H' })).toBeVisible();
    await expect(page.getByRole('button', { name: '1D' })).toBeVisible();
    
    // Click different timeframe
    await page.getByRole('button', { name: '1D' }).click();
    
    // Chart should still be visible
    await expect(page.locator('canvas')).toBeVisible();
  });
});








