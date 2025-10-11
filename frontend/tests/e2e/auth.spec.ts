import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  
  test('should display Sign In and Get Started buttons when logged out', async ({ page }) => {
    await page.goto('/');
    
    // Check for auth buttons
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /get started/i })).toBeVisible();
    
    // Should NOT see protected nav items
    await expect(page.getByRole('link', { name: 'Portfolio' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Earn' })).not.toBeVisible();
  });

  test('should navigate to register page from Get Started button', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('button', { name: /get started/i }).click();
    await expect(page).toHaveURL('/auth/register');
    
    // Should see signup form
    await expect(page.getByText(/create your account/i)).toBeVisible();
  });

  test('should navigate to login page from Sign In button', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/auth/login');
    
    // Should see login form
    await expect(page.getByText(/welcome back/i)).toBeVisible();
  });

  test('should complete multi-step registration', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Step 1: Email
    await page.getByLabel(/email address/i).fill('test@example.com');
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Step 2: Password
    await page.getByLabel(/create password/i).fill('TestPassword123!');
    
    // Check password strength meter appears
    await expect(page.getByText(/password strength/i)).toBeVisible();
    
    // Accept terms
    await page.getByRole('checkbox', { name: /terms of service/i }).check();
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Should see success state or redirect to dashboard
    await expect(page).toHaveURL(/dashboard|check your email/);
  });

  test('should show password strength meter', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Enter email first
    await page.getByLabel(/email address/i).fill('test@example.com');
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Enter weak password
    await page.getByLabel(/create password/i).fill('weak');
    await expect(page.getByText(/weak/i)).toBeVisible();
    
    // Enter strong password
    await page.getByLabel(/create password/i).fill('StrongP@ssw0rd123');
    await expect(page.getByText(/strong/i)).toBeVisible();
  });

  test('should navigate to forgot password', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.getByRole('link', { name: /forgot password/i }).click();
    await expect(page).toHaveURL('/auth/forgot-password');
    
    // Should see reset form
    await expect(page.getByText(/reset your password/i)).toBeVisible();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/auth\/login/);
  });
});



