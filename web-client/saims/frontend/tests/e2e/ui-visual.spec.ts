import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('login page visual snapshot', async ({ page }) => {
    // Navigate to the page
    await page.goto('/login');

    // Wait for the fonts/layout to settle
    await page.waitForLoadState('networkidle');

    // Take a full page screenshot and compare it with the baseline
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1, // Allow 10% diff due to slight font rendering diffs
    });
  });

  // We can add more snapshots for other pages here
});
