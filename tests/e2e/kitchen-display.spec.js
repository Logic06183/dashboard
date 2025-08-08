// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Kitchen Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the kitchen display page
    await page.goto('/kitchen');
    await page.waitForLoadState('networkidle');
  });

  test('should display kitchen header with current time', async ({ page }) => {
    // Check header elements
    await expect(page.locator('h1:has-text("John Dough\'s Kitchen Display")')).toBeVisible();
    await expect(page.locator('text=/Kitchen Display.*Active/')).toBeVisible();
    await expect(page.locator('text=/Time:.*\\d{2}:\\d{2}:\\d{2}/')).toBeVisible();
  });

  test('should show platform legend and highlighting instructions', async ({ page }) => {
    // Check platform legend is visible
    await expect(page.locator('text=Delivery Platform Legend:')).toBeVisible();
    
    // Check for specific platforms in legend
    await expect(page.locator('text=Window')).toBeVisible();
    await expect(page.locator('text=Uber Eats')).toBeVisible();
    await expect(page.locator('text=Mr D Food')).toBeVisible();
    await expect(page.locator('text=Bolt Food')).toBeVisible();
    
    // Check highlighting instructions
    await expect(page.locator('text=How to Highlight Orders:')).toBeVisible();
    await expect(page.locator('text=Click on any order row to highlight')).toBeVisible();
  });

  test('should display orders table with correct columns', async ({ page }) => {
    // Wait for the table to be present
    await expect(page.locator('table')).toBeVisible();
    
    // Check table headers
    const expectedHeaders = [
      'Due By',
      'Time Left',
      'Customer',
      'Platform',
      'Pizzas',
      'Cold Drinks',
      'Special Instructions',
      'Prep Time',
      'Status',
      'Done'
    ];
    
    for (const header of expectedHeaders) {
      await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
    }
  });

  test('should handle empty orders state', async ({ page }) => {
    // If no orders, should show appropriate message
    const hasOrders = await page.locator('tbody tr').count() > 0;
    
    if (!hasOrders) {
      await expect(page.locator('text=/No active orders/')).toBeVisible();
      await expect(page.locator('text=/New orders will appear here automatically/')).toBeVisible();
    }
  });

  test('should create an order and verify it appears in kitchen display', async ({ page, browser }) => {
    // Open a new page for placing an order
    const posPage = await browser.newPage();
    await posPage.goto('/');
    await posPage.waitForLoadState('networkidle');
    
    // Open the order form
    await posPage.click('text=New Order');
    await posPage.waitForSelector('h2:has-text("New Order")', { timeout: 10000 });
    
    // Create an order
    const customerName = `Kitchen Test ${Date.now()}`;
    await posPage.fill('input[name="customerName"]', customerName);
    await posPage.selectOption('select[name="platform"]', 'Window');
    await posPage.fill('input[name="prepTimeMinutes"]', '15');
    
    // Add special instructions
    await posPage.fill('textarea[name="specialInstructions"]', 'Test order for kitchen display');
    
    // Submit the order
    await posPage.click('button:has-text("Place Order")');
    await expect(posPage.locator('text=/Order submitted successfully/')).toBeVisible({ timeout: 10000 });
    
    // Switch back to kitchen display and check for the order
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should see the customer name in the kitchen display
    await expect(page.locator(`text=${customerName}`)).toBeVisible({ timeout: 10000 });
    
    // Should see the platform
    await expect(page.locator('text=Window')).toBeVisible();
    
    // Should see the special instructions
    await expect(page.locator('text=/Test order for kitchen display/')).toBeVisible();
    
    await posPage.close();
  });

  test('should highlight orders when clicked', async ({ page, browser }) => {
    // First create an order to work with
    const posPage = await browser.newPage();
    await posPage.goto('/');
    await posPage.waitForLoadState('networkidle');
    
    // Open the order form
    await posPage.click('text=New Order');
    await posPage.waitForSelector('h2:has-text("New Order")', { timeout: 10000 });
    
    const customerName = `Highlight Test ${Date.now()}`;
    await posPage.fill('input[name="customerName"]', customerName);
    await posPage.selectOption('select[name="platform"]', 'Window');
    await posPage.click('button:has-text("Place Order")');
    await expect(posPage.locator('text=/Order submitted successfully/')).toBeVisible({ timeout: 10000 });
    
    // Switch to kitchen display
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for the order to appear
    await expect(page.locator(`text=${customerName}`)).toBeVisible({ timeout: 10000 });
    
    // Get the order row
    const orderRow = page.locator(`tr:has-text("${customerName}")`);
    
    // Click to highlight
    await orderRow.click();
    
    // Should show highlighted counter
    await expect(page.locator('text=/1 Highlighted Order/')).toBeVisible();
    
    // Should show highlighted orders section
    await expect(page.locator('text=/Highlighted Orders \\(1\\)/')).toBeVisible();
    
    // Click again to unhighlight
    await orderRow.click();
    
    // Highlighted counter should go back to 0
    await expect(page.locator('text=/0 Highlighted Orders/')).toBeVisible();
    
    await posPage.close();
  });

  test('should mark pizzas as cooked', async ({ page, browser }) => {
    // Create an order with multiple pizzas
    const posPage = await browser.newPage();
    await posPage.goto('/');
    await posPage.waitForLoadState('networkidle');
    
    // Open the order form
    await posPage.click('text=New Order');
    await posPage.waitForSelector('h2:has-text("New Order")', { timeout: 10000 });
    
    const customerName = `Cooking Test ${Date.now()}`;
    await posPage.fill('input[name="customerName"]', customerName);
    await posPage.selectOption('select[name="platform"]', 'Window');
    
    // Add another pizza
    await posPage.click('button:has-text("Add Another Pizza")');
    
    // Set quantities
    await posPage.locator('input[name="quantity"]').first().fill('1');
    await posPage.locator('input[name="quantity"]').nth(1).fill('1');
    
    await posPage.click('button:has-text("Place Order")');
    await expect(posPage.locator('text=/Order submitted successfully/')).toBeVisible({ timeout: 10000 });
    
    // Switch to kitchen display
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for the order to appear
    await expect(page.locator(`text=${customerName}`)).toBeVisible({ timeout: 10000 });
    
    // Get the first pizza checkbox
    const firstPizzaCheckbox = page.locator(`tr:has-text("${customerName}") input[type="checkbox"]`).first();
    
    // Mark first pizza as cooked
    await firstPizzaCheckbox.check();
    
    // Should see one pizza marked as cooked (with line-through)
    await expect(page.locator(`tr:has-text("${customerName}") .line-through`)).toBeVisible();
    
    // Order should still be "In Progress" since not all pizzas are done
    await expect(page.locator(`tr:has-text("${customerName}") text=In Progress`)).toBeVisible();
    
    // Mark second pizza as cooked
    const secondPizzaCheckbox = page.locator(`tr:has-text("${customerName}") input[type="checkbox"]`).nth(1);
    await secondPizzaCheckbox.check();
    
    // Order should now be "Done"
    await expect(page.locator(`tr:has-text("${customerName}") text=Done`)).toBeVisible();
    
    await posPage.close();
  });

  test('should display cold drinks column correctly', async ({ page, browser }) => {
    // Create an order with cold drinks
    const posPage = await browser.newPage();
    await posPage.goto('/');
    await posPage.waitForLoadState('networkidle');
    
    // Open the order form
    await posPage.click('text=New Order');
    await posPage.waitForSelector('h2:has-text("New Order")', { timeout: 10000 });
    
    const customerName = `Drinks Test ${Date.now()}`;
    await posPage.fill('input[name="customerName"]', customerName);
    
    // Add cold drinks
    await posPage.click('button:has-text("Add Cold Drink")');
    await posPage.selectOption('select[name="drinkType"]', 'Coca-Cola 330ml');
    await posPage.locator('input[name="quantity"]').last().fill('2');
    
    await posPage.click('button:has-text("Add Cold Drink")');
    await posPage.locator('select[name="drinkType"]').nth(1).selectOption('Sprite 330ml');
    await posPage.locator('input[name="quantity"]').last().fill('1');
    
    await posPage.click('button:has-text("Place Order")');
    await expect(posPage.locator('text=/Order submitted successfully/')).toBeVisible({ timeout: 10000 });
    
    // Switch to kitchen display
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for the order and check cold drinks display
    await expect(page.locator(`text=${customerName}`)).toBeVisible({ timeout: 10000 });
    
    // Should see both drinks in the cold drinks column
    const orderRow = page.locator(`tr:has-text("${customerName}")`);
    await expect(orderRow.locator('text=/2x Coca-Cola 330ml/')).toBeVisible();
    await expect(orderRow.locator('text=/1x Sprite 330ml/')).toBeVisible();
    
    await posPage.close();
  });

  test('should show order cutoff notice', async ({ page }) => {
    // Check for the 2 AM cutoff notice
    await expect(page.locator('text=/Orders are automatically cleared at 2 AM SAST/')).toBeVisible();
    await expect(page.locator('text=/Previous orders can be viewed in the analytics dashboard/')).toBeVisible();
  });

  test('should display prep time correctly', async ({ page, browser }) => {
    // Create an order with specific prep time
    const posPage = await browser.newPage();
    await posPage.goto('/');
    await posPage.waitForLoadState('networkidle');
    
    // Open the order form
    await posPage.click('text=New Order');
    await posPage.waitForSelector('h2:has-text("New Order")', { timeout: 10000 });
    
    const customerName = `Prep Time Test ${Date.now()}`;
    await posPage.fill('input[name="customerName"]', customerName);
    await posPage.fill('input[name="prepTimeMinutes"]', '25');
    
    await posPage.click('button:has-text("Place Order")');
    await expect(posPage.locator('text=/Order submitted successfully/')).toBeVisible({ timeout: 10000 });
    
    // Switch to kitchen display
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check that prep time is displayed correctly
    await expect(page.locator(`text=${customerName}`)).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/25 min/')).toBeVisible();
    
    await posPage.close();
  });

  test('should update time display every second', async ({ page }) => {
    // Get initial time
    const initialTime = await page.locator('span:has-text(/\\d{2}:\\d{2}:\\d{2}/)').textContent();
    
    // Wait for a few seconds
    await page.waitForTimeout(3000);
    
    // Get updated time
    const updatedTime = await page.locator('span:has-text(/\\d{2}:\\d{2}:\\d{2}/)').textContent();
    
    // Times should be different (assuming test doesn't run exactly at midnight)
    expect(initialTime).not.toBe(updatedTime);
  });

  test('should handle remove highlight button in highlighted section', async ({ page, browser }) => {
    // Create an order to test with
    const posPage = await browser.newPage();
    await posPage.goto('/');
    await posPage.waitForLoadState('networkidle');
    
    // Open the order form
    await posPage.click('text=New Order');
    await posPage.waitForSelector('h2:has-text("New Order")', { timeout: 10000 });
    
    const customerName = `Remove Highlight Test ${Date.now()}`;
    await posPage.fill('input[name="customerName"]', customerName);
    await posPage.click('button:has-text("Place Order")');
    await expect(posPage.locator('text=/Order submitted successfully/')).toBeVisible({ timeout: 10000 });
    
    // Switch to kitchen display
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for order and highlight it
    await expect(page.locator(`text=${customerName}`)).toBeVisible({ timeout: 10000 });
    await page.locator(`tr:has-text("${customerName}")`).click();
    
    // Should show highlighted section
    await expect(page.locator('text=/Highlighted Orders \\(1\\)/')).toBeVisible();
    
    // Click remove button in highlighted section
    await page.locator('button:has-text("Remove")').click();
    
    // Highlighted section should disappear
    await expect(page.locator('text=/0 Highlighted Orders/')).toBeVisible();
    
    await posPage.close();
  });
});