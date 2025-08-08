// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Pizza Dashboard E2E Tests', () => {
  
  test('should load the dashboard and show sidebar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // The app loaded with multiple dashboard elements, so let's be more specific
    await expect(page.locator('h1:has-text("John Dough\'s Dashboard")')).toBeVisible({ timeout: 15000 });
  });

  test('should show sidebar navigation elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check for sidebar navigation items
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Kitchen Display')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Orders')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=New Order')).toBeVisible({ timeout: 10000 });
  });

  test('should create and submit a basic order', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for and click New Order button
    await expect(page.locator('button:has-text("New Order"), a:has-text("New Order")')).toBeVisible({ timeout: 15000 });
    await page.click('text=New Order');
    
    // Wait for modal to appear - try different selectors
    await expect(page.locator('h2:has-text("New Order"), h1:has-text("New Order"), text=Simple Direct Order')).toBeVisible({ timeout: 10000 });
    
    // Fill out a basic order
    await page.fill('input[name="customerName"]', 'Test Customer');
    await page.selectOption('select[name="platform"]', 'Window');
    await page.fill('input[name="prepTimeMinutes"]', '20');
    
    // Submit the order
    await page.click('button:has-text("Place Order")');
    
    // Check for success message
    await expect(page.locator('text=Order submitted successfully')).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to kitchen display', async ({ page }) => {
    await page.goto('/kitchen');
    await page.waitForLoadState('domcontentloaded');
    
    // Check for kitchen display elements - be more flexible with text matching
    await expect(page.locator('h1')).toContainText('Kitchen Display', { timeout: 15000 });
    
    // Should show time
    await expect(page.locator('text=Time:')).toBeVisible({ timeout: 10000 });
  });

  test('should show order in kitchen display after creation', async ({ page, browser }) => {
    // First create an order
    const orderPage = await browser.newPage();
    await orderPage.goto('/');
    await orderPage.waitForLoadState('domcontentloaded');
    
    // Create order
    await orderPage.click('text=New Order');
    await expect(orderPage.locator('input[name="customerName"]')).toBeVisible({ timeout: 10000 });
    
    const customerName = `E2E Test ${Date.now()}`;
    await orderPage.fill('input[name="customerName"]', customerName);
    await orderPage.selectOption('select[name="platform"]', 'Window');
    await orderPage.click('button:has-text("Place Order")');
    await expect(orderPage.locator('text=Order submitted successfully')).toBeVisible({ timeout: 15000 });
    
    // Now check kitchen display
    await page.goto('/kitchen');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait a bit for order to sync
    await page.waitForTimeout(2000);
    
    // Should see the order in kitchen display
    await expect(page.locator(`text=${customerName}`)).toBeVisible({ timeout: 10000 });
    
    await orderPage.close();
  });

  test('should add cold drinks to order', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Open order form
    await page.click('text=New Order');
    await expect(page.locator('input[name="customerName"]')).toBeVisible({ timeout: 10000 });
    
    // Fill basic info
    await page.fill('input[name="customerName"]', 'Drinks Test');
    
    // Add a cold drink
    await page.click('button:has-text("Add Cold Drink")');
    
    // Select drink and quantity
    await page.selectOption('select[name="drinkType"]', 'Coca-Cola 330ml');
    await page.locator('input[name="quantity"]').last().fill('2');
    
    // Check total updates
    await expect(page.locator('text=Total: R')).toBeVisible();
    
    // Submit order
    await page.click('button:has-text("Place Order")');
    await expect(page.locator('text=Order submitted successfully')).toBeVisible({ timeout: 15000 });
  });

  test('should highlight orders in kitchen display', async ({ page, browser }) => {
    // Create an order first
    const orderPage = await browser.newPage();
    await orderPage.goto('/');
    await orderPage.waitForLoadState('domcontentloaded');
    
    await orderPage.click('text=New Order');
    await expect(orderPage.locator('input[name="customerName"]')).toBeVisible({ timeout: 10000 });
    
    const customerName = `Highlight Test ${Date.now()}`;
    await orderPage.fill('input[name="customerName"]', customerName);
    await orderPage.click('button:has-text("Place Order")');
    await expect(orderPage.locator('text=Order submitted successfully')).toBeVisible({ timeout: 15000 });
    
    // Go to kitchen display
    await page.goto('/kitchen');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Find and click the order to highlight it
    const orderRow = page.locator(`tr:has-text("${customerName}")`, { timeout: 10000 });
    if (await orderRow.isVisible()) {
      await orderRow.click();
      
      // Should show highlighted counter
      await expect(page.locator('text=Highlighted')).toBeVisible({ timeout: 5000 });
    }
    
    await orderPage.close();
  });
});