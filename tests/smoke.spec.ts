import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('renders title and tagline', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'FWDP MSME' })).toBeVisible();
    await expect(page.getByText('Welcome to the FWDP MSME platform.')).toBeVisible();
  });

  test('has Sign in and Register links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  });

  test('Sign in link navigates to /login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/login');
  });

  test('Register link navigates to /register', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Register' }).click();
    await expect(page).toHaveURL('/register');
  });

  test('page title is set', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/FWDP/i);
  });

  test('renders without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    expect(errors).toHaveLength(0);
  });
});
