import { test, expect } from '@playwright/test';

test.describe('Auth Module', () => {
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Selamat Datang Kembali' })).toBeVisible();
    await expect(page.getByPlaceholder('email@perusahaan.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    await page.route('**/api/**', async route => {
      await route.fulfill({ status: 200, json: { data: [] } });
    });

    // Mock the login API
    await page.route('**/api/auth/login', async route => {
      const json = {
        token: 'fake-jwt-token',
        user: {
          id: 'admin-id',
          name: 'Admin Test',
          email: 'admin@test.com',
          role: 'Administrator',
        }
      };
      await route.fulfill({ json });
    });

    await page.goto('/login');
    await page.getByPlaceholder('email@perusahaan.com').fill('admin@test.com');
    await page.getByPlaceholder('••••••••').fill('password123');
    await page.getByRole('button', { name: 'Masuk ke Sistem' }).click();

    // Verify redirection
    await expect(page).toHaveURL('/dashboard');
    // Dashboard should have heading Dashboard
    await expect(page.getByRole('heading', { name: 'System Overview' })).toBeVisible();
  });
});
