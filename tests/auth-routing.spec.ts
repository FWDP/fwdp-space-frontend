import { test, expect } from '@playwright/test';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/notifications',
  '/subscriptions',
  '/payments',
];

const PUBLIC_ROUTES = ['/', '/login', '/register'];

// Mock profile endpoint for authenticated state tests
const mockProfile = {
  data: {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
};

test.describe('Unauthenticated routing', () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route} redirects to /login without token`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL('/login');
    });
  }

  for (const route of PUBLIC_ROUTES) {
    test(`${route} is accessible without token`, async ({ page }) => {
      await page.goto(route);
      // Public routes should stay on their URL, not be redirected to a different page
      if (route === '/login') {
        await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
      } else if (route === '/register') {
        await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
      } else {
        await expect(page).not.toHaveURL('/login');
      }
    });
  }
});

test.describe('Authenticated routing', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'fake-token-for-testing',
        domain: 'localhost',
        path: '/',
      },
    ]);
  });

  test('/ redirects to /dashboard when authenticated', async ({ page }) => {
    await page.route('**/api/profile', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProfile) })
    );
    await page.goto('/');
    await expect(page).toHaveURL('/dashboard');
  });

  test('/login redirects to /dashboard when authenticated', async ({ page }) => {
    await page.route('**/api/profile', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProfile) })
    );
    await page.goto('/login');
    await expect(page).toHaveURL('/dashboard');
  });

  test('/register redirects to /dashboard when authenticated', async ({ page }) => {
    await page.route('**/api/profile', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProfile) })
    );
    await page.goto('/register');
    await expect(page).toHaveURL('/dashboard');
  });

  test('/dashboard is accessible when authenticated', async ({ page }) => {
    await page.route('**/api/profile', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProfile) })
    );
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('Token edge cases', () => {
  test('empty auth_token cookie is treated as unauthenticated', async ({ page, context }) => {
    await context.addCookies([
      { name: 'auth_token', value: '', domain: 'localhost', path: '/' },
    ]);
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('expired/invalid token on profile fetch clears session', async ({ page, context }) => {
    await context.addCookies([
      { name: 'auth_token', value: 'expired-token', domain: 'localhost', path: '/' },
    ]);
    await page.route('**/api/profile', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthenticated.' }) })
    );
    await page.goto('/dashboard');
    // After 401 on profile, token is removed and redirected
    await expect(page).toHaveURL('/login');
  });
});
