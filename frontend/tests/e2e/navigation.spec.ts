import { test, expect } from '@playwright/test';

test.describe('Smart Navigation', () => {
  
  test('should show public navigation when logged out', async ({ page }) => {
    await page.goto('/');
    
    // Should see public nav links
    await expect(page.getByRole('link', { name: 'Markets' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Trade' })).toBeVisible();
    
    // Should see auth buttons
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /get started/i })).toBeVisible();
    
    // Should NOT see protected links
    await expect(page.getByRole('link', { name: 'Portfolio' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Earn' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Web3' })).not.toBeVisible();
  });

  test('should highlight active page', async ({ page }) => {
    await page.goto('/markets');
    
    // Markets link should have active state (primary background)
    const marketsLink = page.getByRole('link', { name: 'Markets' });
    await expect(marketsLink).toHaveClass(/bg-primary/);
  });

  test('mobile menu should only appear on mobile', async ({ page }) => {
    // Desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    
    // Mobile menu button should be hidden on desktop
    const mobileMenuButton = page.getByRole('button', { name: /menu/i }).first();
    await expect(mobileMenuButton).not.toBeVisible();
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Mobile menu button should be visible on mobile
    await expect(mobileMenuButton).toBeVisible();
  });

  test('mobile menu should work correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Click hamburger menu
    await page.getByRole('button', { name: /menu/i }).click();
    
    // Should see nav links in dropdown
    await expect(page.getByRole('link', { name: 'Markets' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Trade' })).toBeVisible();
    
    // Should see auth buttons in mobile menu
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /get started/i })).toBeVisible();
    
    // Click a link - menu should close
    await page.getByRole('link', { name: 'Markets' }).click();
    await expect(page).toHaveURL('/markets');
  });
});









