import { test, expect } from '@playwright/test';

test.describe('Users Module', () => {
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

    // Mock API for getting users list
    await page.route('**/api/users**', async route => {
      await route.fulfill({
        json: {
          data: [
            {
              id: 'USR-001',
              name: 'Andi Staff',
              email: 'andi@test.com',
              phone: '081234567890',
              role: 'Staff',
              department: 'HR'
            }
          ],
          total: 1
        }
      });
    });
  });

  test('should display users management page for Administrator', async ({ page }) => {
    await page.goto('/users');
    
    // Check heading
    await expect(page.getByRole('heading', { name: 'Manajemen Pengguna Sistem' })).toBeVisible();
    
    // Check users table
    const content = await page.content();
    console.log("USERS PAGE CONTENT:", content);
    await expect(page.getByText('Andi Staff')).toBeVisible();
    await expect(page.getByText('andi@test.com')).toBeVisible();
    await expect(page.getByText('Staff', { exact: true })).toBeVisible();
    await expect(page.getByText('HR')).toBeVisible();
  });
});
