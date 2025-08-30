const { test, expect } = require('@playwright/test');

test.describe('Cold Drinks Only Orders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1:has-text("John Dough\'s Dashboard")', { timeout: 15000 });
    
    // Click New Order button
    await page.click('text=New Order');
    await page.waitForSelector('h2:has-text("Simple Direct Order")', { timeout: 10000 });
  });

  test('should allow cold drinks-only orders without pizzas', async ({ page }) => {
    // Form should start with no pizzas (empty state)
    await expect(page.locator('text=No pizzas added yet')).toBeVisible({ timeout: 5000 });
    
    // Add a cold drink
    await page.click('button:has-text("Add Cold Drink")');
    
    // Verify drink section appears
    await expect(page.locator('text=Drink #1')).toBeVisible();
    
    // Fill in customer name
    await page.fill('input[placeholder="Enter customer name..."]', 'Test Customer');
    
    // Verify order summary shows drinks only
    await expect(page.locator('text=1 drink(s), 1 different type(s)')).toBeVisible();
    
    // Verify total shows drink price
    await expect(page.locator('text=Total: R25.00')).toBeVisible();
    
    // Verify cold drinks ready message
    await expect(page.locator('text=Cold drinks only - Ready immediately!')).toBeVisible();
    
    // Submit order should work
    await page.click('button:has-text("Place Order")');
    
    // Wait for success message
    await expect(page.locator('text=Order submitted successfully')).toBeVisible({ timeout: 10000 });
  });

  test('should remove pizza when quantity set to 0', async ({ page }) => {
    // Add a pizza first
    await page.click('button:has-text("Add First Pizza")');
    
    // Verify pizza appears
    await expect(page.locator('text=Pizza #1')).toBeVisible();
    
    // Set quantity to 0
    await page.fill('input[name="quantity"]', '0');
    
    // Pizza should disappear and show empty state again
    await expect(page.locator('text=No pizzas added yet')).toBeVisible({ timeout: 2000 });
    
    // Now add cold drink
    await page.click('button:has-text("Add Cold Drink")');
    await page.fill('input[placeholder="Enter customer name..."]', 'Test Customer 2');
    
    // Should be able to submit drinks-only order
    await page.click('button:has-text("Place Order")');
    await expect(page.locator('text=Order submitted successfully')).toBeVisible({ timeout: 10000 });
  });
});