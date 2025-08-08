// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Order Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard and open the order form
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click the "New Order" button to open the modal
    await page.click('text=New Order');
    
    // Wait for the modal to appear
    await page.waitForSelector('h2:has-text("New Order")', { timeout: 10000 });
  });

  test('should create a basic pizza order', async ({ page }) => {
    // Fill in customer name
    await page.fill('input[name="customerName"]', 'Test Customer');
    
    // Select delivery platform
    await page.selectOption('select[name="platform"]', 'Window');
    
    // Set prep time
    await page.fill('input[name="prepTimeMinutes"]', '20');
    
    // Verify default pizza is selected (MARGIE)
    const pizzaSelect = page.locator('select[name="pizzaType"]').first();
    await expect(pizzaSelect).toHaveValue('MARGIE');
    
    // Set pizza quantity
    await page.fill('input[name="quantity"]', '2');
    
    // Add special instructions
    await page.fill('textarea[name="specialInstructions"]', 'Extra cheese please');
    
    // Check the order summary
    await expect(page.locator('text=/Total: R/')).toBeVisible();
    
    // Submit the order
    await page.click('button:has-text("Place Order")');
    
    // Wait for success message
    await expect(page.locator('text=/Order submitted successfully/')).toBeVisible({ timeout: 10000 });
  });

  test('should add multiple pizzas to an order', async ({ page }) => {
    // Fill basic order info
    await page.fill('input[name="customerName"]', 'Multi Pizza Customer');
    await page.selectOption('select[name="platform"]', 'Uber Eats');
    
    // Add another pizza
    await page.click('button:has-text("Add Another Pizza")');
    
    // Configure second pizza
    const secondPizzaSelect = page.locator('select[name="pizzaType"]').nth(1);
    await secondPizzaSelect.selectOption('THE CHAMP');
    
    // Set quantities
    await page.locator('input[name="quantity"]').first().fill('1');
    await page.locator('input[name="quantity"]').nth(1).fill('2');
    
    // Verify order summary shows correct pizza count
    await expect(page.locator('text=/3 pizza\\(s\\), 2 different type/')).toBeVisible();
    
    // Submit the order
    await page.click('button:has-text("Place Order")');
    
    // Wait for success
    await expect(page.locator('text=/Order submitted successfully/')).toBeVisible({ timeout: 10000 });
  });

  test('should add cold drinks to an order', async ({ page }) => {
    // Fill basic order info
    await page.fill('input[name="customerName"]', 'Drink Test Customer');
    
    // Add a cold drink
    await page.click('button:has-text("Add Cold Drink")');
    
    // Select drink type
    await page.selectOption('select[name="drinkType"]', 'Coca-Cola 330ml');
    
    // Set drink quantity
    await page.locator('input[name="quantity"]').last().fill('3');
    
    // Add another drink
    await page.click('button:has-text("Add Cold Drink")');
    const secondDrinkSelect = page.locator('select[name="drinkType"]').nth(1);
    await secondDrinkSelect.selectOption('Sprite 330ml');
    
    // Verify order summary includes drinks
    await expect(page.locator('text=/drink\\(s\\)/')).toBeVisible();
    
    // Submit the order
    await page.click('button:has-text("Place Order")');
    
    // Wait for success
    await expect(page.locator('text=/Order submitted successfully/')).toBeVisible({ timeout: 10000 });
  });

  test('should handle different delivery platforms', async ({ page }) => {
    const platforms = ['Window', 'Uber Eats', 'Mr D Food', 'Bolt Food', 'Customer Pickup'];
    
    for (const platform of platforms) {
      // Clear previous state
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Fill order with different platform
      await page.fill('input[name="customerName"]', `${platform} Customer`);
      await page.selectOption('select[name="platform"]', platform);
      
      // Submit the order
      await page.click('button:has-text("Place Order")');
      
      // Wait for success
      await expect(page.locator('text=/Order submitted successfully/')).toBeVisible({ timeout: 10000 });
      
      // Click to place another order
      await page.click('button:has-text("Place Another Order")');
    }
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without selecting anything
    await page.click('button:has-text("Place Order")');
    
    // The form should not submit (check that we're still on the form)
    await expect(page.locator('button:has-text("Place Order")')).toBeVisible();
    
    // Fill in minimum required fields
    await page.selectOption('select[name="platform"]', 'Window');
    await page.fill('input[name="prepTimeMinutes"]', '15');
    
    // Now it should submit
    await page.click('button:has-text("Place Order")');
    await expect(page.locator('text=/Order submitted successfully/')).toBeVisible({ timeout: 10000 });
  });

  test('should calculate correct total price', async ({ page }) => {
    // Select a specific pizza with known price
    await page.selectOption('select[name="pizzaType"]', 'MARGIE');
    await page.fill('input[name="quantity"]', '2');
    
    // MARGIE costs R125.00, so 2 should be R250.00
    await expect(page.locator('text=/Total: R250.00/')).toBeVisible();
    
    // Add a cold drink
    await page.click('button:has-text("Add Cold Drink")');
    await page.selectOption('select[name="drinkType"]', 'Coca-Cola 330ml');
    await page.locator('input[name="quantity"]').last().fill('1');
    
    // Coca-Cola costs R25.00, so total should be R275.00
    await expect(page.locator('text=/Total: R275.00/')).toBeVisible();
  });

  test('should handle special instructions', async ({ page }) => {
    const specialInstructions = [
      'No onions please',
      'Extra crispy',
      'Half and half toppings',
      'Allergic to nuts',
      'Please call on arrival'
    ];
    
    await page.fill('input[name="customerName"]', 'Special Instructions Test');
    
    // Add multiple pizzas with different instructions
    for (let i = 0; i < 3; i++) {
      if (i > 0) {
        await page.click('button:has-text("Add Another Pizza")');
      }
      await page.locator('textarea[name="specialInstructions"]').nth(i).fill(specialInstructions[i]);
    }
    
    // Submit the order
    await page.click('button:has-text("Place Order")');
    
    // Wait for success
    await expect(page.locator('text=/Order submitted successfully/')).toBeVisible({ timeout: 10000 });
  });

  test('should remove pizza items from order', async ({ page }) => {
    // Add multiple pizzas
    await page.click('button:has-text("Add Another Pizza")');
    await page.click('button:has-text("Add Another Pizza")');
    
    // Should have 3 pizza sections
    await expect(page.locator('text=/Pizza #3/')).toBeVisible();
    
    // Remove the second pizza
    await page.locator('button:has-text("Remove")').nth(1).click();
    
    // Should now only have 2 pizzas
    await expect(page.locator('text=/Pizza #3/')).not.toBeVisible();
    await expect(page.locator('text=/Pizza #2/')).toBeVisible();
  });

  test('should remove cold drinks from order', async ({ page }) => {
    // Add multiple drinks
    await page.click('button:has-text("Add Cold Drink")');
    await page.click('button:has-text("Add Cold Drink")');
    
    // Should have 2 drink sections
    await expect(page.locator('text=/Drink #2/')).toBeVisible();
    
    // Remove the first drink
    await page.locator('div:has-text("Drink #1") button:has-text("Remove")').click();
    
    // Should now only have 1 drink
    await expect(page.locator('text=/Drink #2/')).not.toBeVisible();
    await expect(page.locator('text=/Drink #1/')).toBeVisible();
  });
});