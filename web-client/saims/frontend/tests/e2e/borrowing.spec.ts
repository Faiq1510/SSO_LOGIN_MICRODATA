import { test, expect } from '@playwright/test';

test.describe('Borrowing Module', () => {
  test.beforeEach(async ({ page }) => {
    // Set localStorage to simulate logged in state
    await page.addInitScript(() => {
      localStorage.setItem('saims_token', 'fake-token');
      localStorage.setItem('saims_user', JSON.stringify({ id: '1', role: 'Staff', name: 'Staff Test' }));
    });
    // Set cookie as well since some components use it
    await page.context().addCookies([
      { name: 'saims_token', value: 'fake-token', domain: 'localhost', path: '/' },
      { name: 'saims_user', value: JSON.stringify({ id: '1', role: 'Staff', name: 'Staff Test' }), domain: 'localhost', path: '/' }
    ]);

    await page.route('**/api/**', async route => {
      await route.fulfill({ status: 200, json: { data: [] } });
    });

    // Mock API for getting borrowings
    await page.route('**/api/borrowings**', async route => {
      await route.fulfill({
        json: {
          data: [
            {
              id: 'BRW-26070901-STAF',
              asset_id: 'JKT-IT-26-0001',
              asset_name: 'Projector Epson',
              user_id: '1',
              user_name: 'Staff Test',
              status: 'Menunggu Persetujuan',
              start_date: '2023-10-01',
              end_date: '2023-10-05',
              purpose: 'Presentasi Klien'
            }
          ],
          total: 1
        }
      });
    });
    // Mock API for getting assets
    await page.route('**/api/assets**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          json: {
            data: [
              {
                id: 'JKT-IT-26-0002',
                name: 'Laptop Lenovo',
                category: 'IT',
                status: 'Tersedia',
                location: 'Ruang Server'
              }
            ],
            total: 1
          }
        });
      }
    });
    
    // Mock POST borrowing
    await page.route('**/api/borrowings', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, json: { message: 'Success' } });
      }
    });
  });

  test('should display borrowing history and test new request form', async ({ page }) => {
    // Navigate to borrowings page
    await page.goto('/borrowings');
    
    // Check heading
    await expect(page.getByRole('heading', { name: 'Peminjaman & Penggunaan Aset' })).toBeVisible();
    
    // Check history table
    const content = await page.content();
    console.log("BORROWING PAGE CONTENT:", content);
    await expect(page.getByText('Projector Epson')).toBeVisible();
    await expect(page.getByText('Presentasi Klien')).toBeVisible();

    await expect(page.getByText('Form Pengajuan Peminjaman')).toBeVisible();

    // Wait for assets to load in dropdown
    // selectOption auto-waits for the option to be available
    await page.locator('select[name="asset_id"]').selectOption('JKT-IT-26-0002');
    await page.locator('input[name="start_date"]').fill('2025-01-01');
    await page.locator('input[name="end_date"]').fill('2025-01-02');
    await page.locator('textarea[name="purpose"]').fill('Untuk Presentasi VIP');

    // Submit
    await page.getByRole('button', { name: /Sampaikan Pengajuan/i }).click();
  });
});
