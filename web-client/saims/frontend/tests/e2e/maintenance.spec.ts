import { test, expect } from '@playwright/test';

test.describe('Maintenance Module', () => {
  test.beforeEach(async ({ page }) => {
    // Set localStorage to simulate logged in state
    await page.addInitScript(() => {
      localStorage.setItem('saims_token', 'fake-token');
      localStorage.setItem('saims_user', JSON.stringify({ id: '1', role: 'Teknisi', name: 'Teknisi Test' }));
    });
    // Set cookie as well since some components use it
    await page.context().addCookies([
      { name: 'saims_token', value: 'fake-token', domain: 'localhost', path: '/' },
      { name: 'saims_user', value: JSON.stringify({ id: '1', role: 'Teknisi', name: 'Teknisi Test' }), domain: 'localhost', path: '/' }
    ]);

    await page.route('**/api/**', async route => {
      await route.fulfill({ status: 200, json: { data: [] } });
    });

    // Mock API for getting maintenance records
    await page.route('**/api/maintenance**', async route => {
      await route.fulfill({
        json: {
          data: [
            {
              id: 'MNT-26-0001',
              asset_id: 'JKT-AC-26-0005',
              asset_name: 'AC Daikin 2PK',
              technician_id: '1',
              technician_name: 'Teknisi Test',
              type: 'Perbaikan',
              status: 'Selesai',
              cost: 500000,
              notes: 'Ganti freon',
              scheduled_date: '2023-10-10'
            }
          ],
          total: 1
        }
      });
    });
  });

  test('should display maintenance records', async ({ page }) => {
    await page.goto('/maintenance');
    
    // Check heading
    await expect(page.getByRole('heading', { name: 'Perbaikan & Maintenance' })).toBeVisible();
    
    // Check records table
    await expect(page.getByText('AC Daikin 2PK')).toBeVisible();
    await expect(page.getByText('Ganti freon')).toBeVisible();
    await expect(page.getByText('Selesai')).toBeVisible();
  });
});
