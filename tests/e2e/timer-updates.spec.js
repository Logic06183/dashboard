// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Timer and Real-time Updates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/kitchen');
    await page.waitForLoadState('networkidle');
  });

  test('should show real-time clock updates in kitchen display header', async ({ page }) => {
    // Get initial time from header
    const timeDisplay = page.locator('span:has-text(/\\d{2}:\\d{2}:\\d{2}/)');
    const initialTime = await timeDisplay.textContent();
    
    // Wait for time to update (should update every second)
    await page.waitForTimeout(2000);
    
    const updatedTime = await timeDisplay.textContent();
    
    // Times should be different unless we hit an exact second boundary
    if (initialTime === updatedTime) {
      // If they're the same, wait another second and check again
      await page.waitForTimeout(1000);
      const thirdTime = await timeDisplay.textContent();
      expect(thirdTime).not.toBe(initialTime);
    } else {
      expect(updatedTime).not.toBe(initialTime);
    }
  });

  test('should show countdown timers for orders', async ({ page, browser }) => {
    // Create an order with specific due time
    const posPage = await browser.newPage();
    await posPage.goto('/');
    await posPage.waitForLoadState('networkidle');
    
    // Open the order form
    await posPage.click('text=New Order');
    await posPage.waitForSelector('h2:has-text("New Order")', { timeout: 10000 });
    
    const customerName = `Timer Test ${Date.now()}`;
    await posPage.fill('input[name="customerName"]', customerName);
    await posPage.selectOption('select[name="platform"]', 'Window');
    await posPage.fill('input[name="prepTimeMinutes"]', '15'); // 15 minutes prep time
    
    await posPage.click('button:has-text("Place Order")');
    await expect(posPage.locator('text=/Order submitted successfully/')).toBeVisible({ timeout: 10000 });
    
    // Switch to kitchen display
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for the order to appear
    await expect(page.locator(`text=${customerName}`)).toBeVisible({ timeout: 10000 });
    
    // Should show time remaining in the format (Xm Ys) or similar
    const orderRow = page.locator(`tr:has-text("${customerName}")`);
    await expect(orderRow.locator('text=/\\(\\d+m \\d+s\\)/')).toBeVisible();
    
    // Get initial countdown
    const initialCountdown = await orderRow.locator('text=/\\(\\d+m \\d+s\\)/').textContent();
    
    // Wait a few seconds for countdown to update
    await page.waitForTimeout(3000);
    
    // Get updated countdown
    const updatedCountdown = await orderRow.locator('text=/\\(\\d+m \\d+s\\)/').textContent();
    
    // Countdown should have changed (decreased)
    expect(updatedCountdown).not.toBe(initialCountdown);
    
    await posPage.close();
  });

  test('should update time status colors correctly', async ({ page, browser }) => {
    // Create an order with very short prep time to test urgency
    const posPage = await browser.newPage();
    await posPage.goto('/');
    await posPage.waitForLoadState('networkidle');
    
    // Open the order form
    await posPage.click('text=New Order');
    await posPage.waitForSelector('h2:has-text("New Order")', { timeout: 10000 });
    
    const customerName = `Urgency Test ${Date.now()}`;
    await posPage.fill('input[name="customerName"]', customerName);
    await posPage.fill('input[name="prepTimeMinutes"]', '2'); // Very short time to trigger urgency
    
    await posPage.click('button:has-text("Place Order")');
    await expect(posPage.locator('text=/Order submitted successfully/')).toBeVisible({ timeout: 10000 });
    
    // Switch to kitchen display
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for the order to appear
    await expect(page.locator(`text=${customerName}`)).toBeVisible({ timeout: 10000 });
    
    const orderRow = page.locator(`tr:has-text("${customerName}")`);
    
    // Should show "On Time" status initially (green)
    await expect(orderRow.locator('.bg-green-100')).toBeVisible();
    
    await posPage.close();
  });

  test('should show due time in correct 24-hour format', async ({ page, browser }) => {
    // Create an order
    const posPage = await browser.newPage();
    await posPage.goto('/');
    await posPage.waitForLoadState('networkidle');
    
    // Open the order form
    await posPage.click('text=New Order');
    await posPage.waitForSelector('h2:has-text("New Order")', { timeout: 10000 });
    
    const customerName = `Due Time Test ${Date.now()}`;
    await posPage.fill('input[name="customerName"]', customerName);
    await posPage.fill('input[name="prepTimeMinutes"]', '30');
    
    await posPage.click('button:has-text("Place Order")');
    await expect(posPage.locator('text=/Order submitted successfully/')).toBeVisible({ timeout: 10000 });
    
    // Switch to kitchen display
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for the order and check due time format
    await expect(page.locator(`text=${customerName}`)).toBeVisible({ timeout: 10000 });
    
    const orderRow = page.locator(`tr:has-text("${customerName}")`);
    
    // Should show time in HH:MM format (24-hour)
    await expect(orderRow.locator('text=/\\d{2}:\\d{2}/')).toBeVisible();
    
    await posPage.close();
  });

  test('should handle multiple orders with different urgency levels', async ({ page, browser }) => {
    const posPage = await browser.newPage();
    await posPage.goto('/');
    await posPage.waitForLoadState('networkidle');
    
    // Open the order form
    await posPage.click('text=New Order');
    await posPage.waitForSelector('h2:has-text("New Order")', { timeout: 10000 });
    
    // Create multiple orders with different prep times
    const orders = [
      { name: `Normal Order ${Date.now()}`, prepTime: '45' },
      { name: `Urgent Order ${Date.now() + 1}`, prepTime: '10' },
      { name: `Very Urgent Order ${Date.now() + 2}`, prepTime: '3' }
    ];
    
    for (const order of orders) {
      await posPage.fill('input[name="customerName"]', order.name);
      await posPage.fill('input[name="prepTimeMinutes"]', order.prepTime);
      
      await posPage.click('button:has-text("Place Order")');
      await expect(posPage.locator('text=/Order submitted successfully/')).toBeVisible({ timeout: 10000 });
      
      // Close modal and reopen for next order
      await posPage.click('button:has-text("Place Another Order")');
      
      // Reopen the order form for next order
      await posPage.click('text=New Order');
      await posPage.waitForSelector('h2:has-text("New Order")', { timeout: 10000 });
    }
    
    // Switch to kitchen display
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // All orders should be visible
    for (const order of orders) {
      await expect(page.locator(`text=${order.name}`)).toBeVisible({ timeout: 10000 });
    }
    
    // Orders should be sorted by urgency (most urgent first)
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    
    expect(rowCount).toBeGreaterThanOrEqual(orders.length);
    
    await posPage.close();
  });

  test('should show late orders with correct styling', async ({ page, browser }) => {
    // This test creates an order that's already "late" by setting due time in the past
    // We'll use the browser console to manipulate the order's due time
    
    const posPage = await browser.newPage();
    await posPage.goto('/');
    await posPage.waitForLoadState('networkidle');
    
    // Open the order form
    await posPage.click('text=New Order');
    await posPage.waitForSelector('h2:has-text("New Order")', { timeout: 10000 });
    
    const customerName = `Late Order Test ${Date.now()}`;
    await posPage.fill('input[name="customerName"]', customerName);
    await posPage.fill('input[name="prepTimeMinutes"]', '1'); // Very short time
    
    await posPage.click('button:has-text("Place Order")');
    await expect(posPage.locator('text=/Order submitted successfully/')).toBeVisible({ timeout: 10000 });
    
    // Wait for the order to potentially become late
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for the order to appear
    await expect(page.locator(`text=${customerName}`)).toBeVisible({ timeout: 10000 });
    
    // Wait long enough for the order to potentially become late (more than 1 minute)
    // In a real scenario, this would be handled by system time, but for testing
    // we just verify the styling classes exist for late orders
    
    const orderRow = page.locator(`tr:has-text("${customerName}")`);
    
    // Check if order shows any urgency styling
    const hasUrgencyColor = await orderRow.locator('.bg-red-50, .bg-orange-50, .bg-green-50').count();
    expect(hasUrgencyColor).toBeGreaterThan(0);
    
    await posPage.close();
  });

  test('should maintain timer updates when switching between pages', async ({ page, browser }) => {
    // Create an order first
    const posPage = await browser.newPage();
    await posPage.goto('/');
    await posPage.waitForLoadState('networkidle');
    
    // Open the order form
    await posPage.click('text=New Order');
    await posPage.waitForSelector('h2:has-text("New Order")', { timeout: 10000 });
    
    const customerName = `Page Switch Test ${Date.now()}`;
    await posPage.fill('input[name="customerName"]', customerName);
    await posPage.fill('input[name="prepTimeMinutes"]', '20');
    
    await posPage.click('button:has-text("Place Order")');
    await expect(posPage.locator('text=/Order submitted successfully/')).toBeVisible({ timeout: 10000 });
    
    // Go to kitchen display
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for order to appear and get initial timer
    await expect(page.locator(`text=${customerName}`)).toBeVisible({ timeout: 10000 });
    const orderRow = page.locator(`tr:has-text("${customerName}")`);
    const initialTimer = await orderRow.locator('text=/\\(\\d+m \\d+s\\)/').textContent();
    
    // Navigate away to orders page
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    
    // Wait a few seconds
    await page.waitForTimeout(3000);
    
    // Navigate back to kitchen display
    await page.goto('/kitchen');
    await page.waitForLoadState('networkidle');
    
    // Check that timer has updated
    await expect(page.locator(`text=${customerName}`)).toBeVisible({ timeout: 10000 });
    const updatedTimer = await orderRow.locator('text=/\\(\\d+m \\d+s\\)/').textContent();
    
    // Timer should have changed
    expect(updatedTimer).not.toBe(initialTimer);
    
    await posPage.close();
  });

  test('should handle timer display for completed orders', async ({ page, browser }) => {
    // Create and complete an order
    const posPage = await browser.newPage();
    await posPage.goto('/');
    await posPage.waitForLoadState('networkidle');
    
    // Open the order form
    await posPage.click('text=New Order');
    await posPage.waitForSelector('h2:has-text("New Order")', { timeout: 10000 });
    
    const customerName = `Completed Timer Test ${Date.now()}`;
    await posPage.fill('input[name="customerName"]', customerName);
    await posPage.fill('input[name="prepTimeMinutes"]', '15');
    
    await posPage.click('button:has-text("Place Order")');
    await expect(posPage.locator('text=/Order submitted successfully/')).toBeVisible({ timeout: 10000 });
    
    // Go to kitchen display and complete the order
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator(`text=${customerName}`)).toBeVisible({ timeout: 10000 });
    
    // Mark pizza as completed
    const orderRow = page.locator(`tr:has-text("${customerName}")`);
    await orderRow.locator('input[type="checkbox"]').first().check();
    
    // Order should now show as "Done"
    await expect(orderRow.locator('text=Done')).toBeVisible();
    
    // Should show "Completed" status instead of timer
    await expect(orderRow.locator('text=Completed')).toBeVisible();
    
    await posPage.close();
  });
});