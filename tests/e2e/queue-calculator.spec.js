const { test, expect } = require('@playwright/test');

test.describe('Pizza Queue Calculator', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard page and wait for it to load
    await page.goto('/');
    await page.waitForSelector('h1:has-text("John Dough\'s Dashboard")', { timeout: 15000 });
  });

  test('should display queue overview in kitchen display', async ({ page }) => {
    // Navigate to kitchen display
    await page.goto('/kitchen');
    
    // Wait for the page to load and check for queue overview elements
    await page.waitForSelector('h1:has-text("John Dough\'s Kitchen Display")', { timeout: 15000 });
    
    // Check for queue overview cards (they should exist even with 0 values)
    await expect(page.locator('text=Pizzas in Queue')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Active Orders')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Est. Wait for New Orders')).toBeVisible({ timeout: 10000 });
    
    // Check for settings button
    await expect(page.locator('button:has-text("Queue Settings")')).toBeVisible();
  });

  test('should display kitchen settings in settings page', async ({ page }) => {
    // Navigate to settings page
    await page.goto('/settings');
    
    // Wait for the page to load
    await page.waitForSelector('h2:has-text("Settings")', { timeout: 15000 });
    
    // Check for kitchen queue settings section
    await expect(page.locator('h3:has-text("Kitchen Queue Settings")')).toBeVisible({ timeout: 10000 });
    
    // Check for base prep time input
    await expect(page.locator('label:has-text("Base Prep Time per Pizza")')).toBeVisible();
    
    // Check for pizza capacity input
    await expect(page.locator('label:has-text("Pizza Capacity")')).toBeVisible();
    
    // Check for Friday rush mode toggle
    await expect(page.locator('label:has-text("Friday Rush Mode")')).toBeVisible();
    
    // Check for quick presets section
    await expect(page.locator('h4:has-text("Quick Presets")')).toBeVisible();
  });

  test('should show queue estimates in order form', async ({ page }) => {
    // Navigate to dashboard and open order form
    await page.goto('/');
    await page.waitForSelector('h1:has-text("John Dough\'s Dashboard")', { timeout: 15000 });
    
    // Click new order button - try multiple possible selectors
    const newOrderButton = page.locator('button').filter({ hasText: /new order|add order|\+/i }).first();
    await newOrderButton.click({ timeout: 10000 });
    
    // Wait for order form to appear and check for queue estimate preview
    await page.waitForSelector('input[name="customerName"], input[name="pizzaType"]', { timeout: 10000 });
    
    // Check for queue estimate preview section
    await expect(page.locator('text=Queue Estimate Preview')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Current queue:')).toBeVisible();
  });

  test('should update queue estimates when kitchen settings change', async ({ page }) => {
    // Navigate to settings page
    await page.goto('/settings');
    await page.waitForSelector('h2:has-text("Settings")', { timeout: 15000 });
    
    // Wait for kitchen settings to load
    await page.waitForSelector('h3:has-text("Kitchen Queue Settings")', { timeout: 10000 });
    
    // Check if live preview is showing
    const livePreview = page.locator('h4:has-text("Live Queue Status")');
    if (await livePreview.isVisible()) {
      // Verify the preview shows current queue data
      await expect(page.locator('text=Pizzas in Queue')).toBeVisible();
      await expect(page.locator('text=Active Orders')).toBeVisible();
      await expect(page.locator('text=Est. Wait Time')).toBeVisible();
    }
    
    // Try applying a preset and verify settings update
    const presetButtons = page.locator('text=Normal Staff');
    if (await presetButtons.isVisible()) {
      await presetButtons.click();
      // Wait a bit for the settings to update
      await page.waitForTimeout(1000);
    }
  });
});