// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Basic Navigation', () => {
  test('should load the dashboard page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Should see the sidebar and basic layout
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to kitchen display', async ({ page }) => {
    await page.goto('/kitchen');
    await page.waitForLoadState('domcontentloaded');
    
    // Should see kitchen display header
    await expect(page.locator('h1:has-text("John Dough\'s Kitchen Display")')).toBeVisible({ timeout: 15000 });
  });

  test('should open new order modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for New Order button to be available
    await expect(page.locator('text=New Order')).toBeVisible({ timeout: 15000 });
    
    // Click New Order button
    await page.click('text=New Order');
    
    // Should see the modal
    await expect(page.locator('h2:has-text("New Order")')).toBeVisible({ timeout: 10000 });
    
    // Should see the order form
    await expect(page.locator('input[name="customerName"]')).toBeVisible({ timeout: 10000 });
  });

  test('should display kitchen display content', async ({ page }) => {
    await page.goto('/kitchen');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for kitchen display to load
    await expect(page.locator('h1:has-text("John Dough\'s Kitchen Display")')).toBeVisible({ timeout: 15000 });
    
    // Wait a bit for components to render
    await page.waitForTimeout(2000);
    
    // Check for platform legend - use more flexible selector
    await expect(page.locator('text=Delivery Platform')).toBeVisible({ timeout: 10000 });
    
    // Check for highlighting instructions - use more flexible selector  
    await expect(page.locator('text=Highlight Orders')).toBeVisible({ timeout: 10000 });
  });
});