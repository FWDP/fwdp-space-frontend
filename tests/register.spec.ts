import { test, expect } from '@playwright/test';

const mockRegisterSuccess = {
  token: 'new-user-token-abc123',
  token_type: 'Bearer',
  user: {
    id: 2,
    name: 'New User',
    email: 'newuser@example.com',
    role: 'USER',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
};

test.describe('Register page — rendering', () => {
  test('renders heading and all 4 fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Confirm Password')).toBeVisible();
  });

  test('password fields are masked', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
    await expect(page.getByLabel('Confirm Password')).toHaveAttribute('type', 'password');
  });

  test('has link to login page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('sign in link navigates to /login', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/login');
  });

  test('no error shown on initial load', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('.bg-red-50')).not.toBeVisible();
  });
});

test.describe('Register page — form validation', () => {
  test('HTML5 required blocks empty submission', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/register');
  });

  test('HTML5 email type blocks invalid format', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('notvalid');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/register');
  });
});

test.describe('Register page — API responses', () => {
  test('redirects to /dashboard on successful registration', async ({ page }) => {
    await page.route('**/api/auth/register', (route) =>
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(mockRegisterSuccess) })
    );
    await page.route('**/api/profile', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: mockRegisterSuccess.user }) })
    );
    await page.goto('/register');
    await page.getByLabel('Name').fill('New User');
    await page.getByLabel('Email').fill('newuser@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('shows general error on 422', async ({ page }) => {
    await page.route('**/api/auth/register', (route) =>
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'The email has already been taken.' }),
      })
    );
    await page.goto('/register');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('taken@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('The email has already been taken.')).toBeVisible();
  });

  test('shows field-level errors from API', async ({ page }) => {
    await page.route('**/api/auth/register', (route) =>
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'The given data was invalid.',
          errors: {
            email: ['The email has already been taken.'],
            password: ['The password must be at least 8 characters.'],
          },
        }),
      })
    );
    await page.goto('/register');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('taken@example.com');
    await page.getByLabel('Password', { exact: true }).fill('short');
    await page.getByLabel('Confirm Password').fill('short');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('The email has already been taken.')).toBeVisible();
    await expect(page.getByText('The password must be at least 8 characters.')).toBeVisible();
  });

  test('shows fallback error on 500 server error', async ({ page }) => {
    await page.route('**/api/auth/register', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({}) })
    );
    await page.goto('/register');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Registration failed.')).toBeVisible();
  });

  test('shows fallback error on network failure', async ({ page }) => {
    await page.route('**/api/auth/register', (route) => route.abort('failed'));
    await page.goto('/register');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Registration failed.')).toBeVisible();
  });

  test('shows loading state while submitting', async ({ page }) => {
    let resolveRoute: () => void;
    await page.route('**/api/auth/register', (route) => {
      new Promise<void>((res) => { resolveRoute = res; }).then(() =>
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(mockRegisterSuccess) })
      );
    });
    await page.goto('/register');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByRole('button', { name: 'Creating account...' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Creating account...' })).toBeDisabled();
    resolveRoute!();
  });
});

test.describe('Register page — edge cases', () => {
  test('XSS in field error message is rendered as text, not executed', async ({ page }) => {
    const xssPayload = '<img src=x onerror="window.__xss=true">XSS';
    await page.route('**/api/auth/register', (route) =>
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ message: xssPayload }),
      })
    );
    await page.goto('/register');
    await page.getByLabel('Name').fill('Test');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    const xssExecuted = await page.evaluate(() => (window as unknown as Record<string, unknown>).__xss);
    expect(xssExecuted).toBeUndefined();
  });

  test('SQL injection in name field does not crash the app', async ({ page }) => {
    await page.route('**/api/auth/register', (route) =>
      route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ message: 'Invalid input.' }) })
    );
    await page.goto('/register');
    await page.getByLabel('Name').fill("Robert'); DROP TABLE users;--");
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Invalid input.')).toBeVisible();
  });

  test('very long name does not crash the app', async ({ page }) => {
    await page.route('**/api/auth/register', (route) =>
      route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ message: 'The name must not exceed 255 characters.' }) })
    );
    await page.goto('/register');
    await page.getByLabel('Name').fill('A'.repeat(300));
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('The name must not exceed 255 characters.')).toBeVisible();
  });

  test('unicode and emoji in name field do not crash the app', async ({ page }) => {
    await page.route('**/api/auth/register', (route) =>
      route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ message: 'Invalid input.' }) })
    );
    await page.goto('/register');
    await page.getByLabel('Name').fill('José 🔥 Müller');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Invalid input.')).toBeVisible();
  });

  test('double-click on submit does not send duplicate requests', async ({ page }) => {
    let requestCount = 0;
    await page.route('**/api/auth/register', (route) => {
      requestCount++;
      route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ message: 'Error.' }) });
    });
    await page.goto('/register');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).dblclick();
    await page.waitForTimeout(500);
    expect(requestCount).toBe(1);
  });

  test('keyboard Enter submits the form', async ({ page }) => {
    await page.route('**/api/auth/register', (route) =>
      route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ message: 'Error.' }) })
    );
    await page.goto('/register');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');
    await page.getByLabel('Confirm Password').press('Enter');
    await expect(page.getByText('Error.')).toBeVisible();
  });

  test('error clears on new submission attempt', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/auth/register', (route) => {
      callCount++;
      if (callCount === 1) {
        route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({}) });
      } else {
        route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ message: 'Second error.' }) });
      }
    });
    await page.goto('/register');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');

    // First submission - 500 error
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Registration failed.')).toBeVisible();

    // Second submission - previous error should clear, new error shown
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Registration failed.')).not.toBeVisible();
    await expect(page.getByText('Second error.')).toBeVisible();
  });
});
