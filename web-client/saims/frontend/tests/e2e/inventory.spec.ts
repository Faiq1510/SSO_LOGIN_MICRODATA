import { test, expect } from '@playwright/test';

test.describe('Inventory Module', () => {
  test.beforeEach(async ({ page }) => {
    // Set localStorage to simulate logged in state
    await page.addInitScript(() => {
      localStorage.setItem('saims_token', 'fake-token');
      localStorage.setItem('saims_user', JSON.stringify({ id: '1', role: 'Administrator', name: 'Admin Test' }));
    });
    // Set cookie as well since some components use it
    await page.context().addCookies([
      { name: 'saims_token', value: 'fake-token', domain: 'localhost', path: '/' },
      { name: 'saims_user', value: JSON.stringify({ id: '1', role: 'Administrator', name: 'Admin Test' }), domain: 'localhost', path: '/' }
    ]);

    await page.route('**/api/**', async route => {
      await route.fulfill({ status: 200, json: { data: [] } });
    });

    // Mock API requests for inventory
    await page.route('**/api/assets**', async route => {
      await route.fulfill({
        json: {
          data: [
            {
              id: 'JKT-IT-26-0001',
              name: 'Laptop Lenovo Thinkpad',
              category: 'IT',
              location: 'Ruang Server',
              status: 'Tersedia',
              condition: 'Baik',
              qr_code: 'qr-123'
            }
          ],
          total: 1
        }
      });
    });
  });

  test('should display inventory table and support searching', async ({ page }) => {
    await page.goto('/inventory');
    
    // Check heading
    await expect(page.getByRole('heading', { name: 'Inventory Management' })).toBeVisible();
    
    // Check if table contains data
    await expect(page.getByText('Laptop Lenovo Thinkpad')).toBeVisible();
    await expect(page.getByText('Ruang Server').first()).toBeVisible();

    // Mock search API call
    await page.route('**/api/assets?*search=Lenovo*', async route => {
      await route.fulfill({
        json: {
          data: [
            {
              id: 'JKT-IT-26-0001',
              name: 'Laptop Lenovo Thinkpad',
              category: 'IT',
              location: 'Ruang Server',
              status: 'Tersedia',
              condition: 'Baik',
              qr_code: 'qr-123'
            }
          ],
          total: 1
        }
      });
    });

    // Test search functionality
    await page.getByPlaceholder('Cari ID, Nama, Serial, Lokasi...').fill('Lenovo');
    // We expect the text to still be visible
    await expect(page.getByText('Laptop Lenovo Thinkpad')).toBeVisible();
  });
});
