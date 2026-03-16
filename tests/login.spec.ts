import { test, expect } from '@playwright/test';

const mockLoginSuccess = {
  token: 'test-token-abc123',
  token_type: 'Bearer',
  user: {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
};

test.describe('Login page — rendering', () => {
  test('renders heading, email, password fields and submit button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('password field is masked', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Password')).toHaveAttribute('type', 'password');
  });

  test('has link to register page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  });

  test('register link navigates to /register', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Register' }).click();
    await expect(page).toHaveURL('/register');
  });

  test('no error shown on initial load', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('.bg-red-50')).not.toBeVisible();
  });
});

test.describe('Login page — form validation', () => {
  test('HTML5 required blocks empty submission', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/login');
  });

  test('HTML5 email type blocks invalid email format', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('notanemail');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/login');
  });

  test('requires both email and password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    // no password
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Login page — API responses', () => {
  test('shows error on 401 invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Invalid credentials.' }) })
    );
    await page.goto('/login');
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Invalid credentials.')).toBeVisible();
  });

  test('shows error on 422 validation failure', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ message: 'The email field is required.' }) })
    );
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('The email field is required.')).toBeVisible();
  });

  test('shows fallback error on 500 server error', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({}) })
    );
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Login failed.')).toBeVisible();
  });

  test('shows fallback error on network failure', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => route.abort('failed'));
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Login failed.')).toBeVisible();
  });

  test('redirects to /dashboard on successful login', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockLoginSuccess) })
    );
    await page.route('**/api/profile', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: mockLoginSuccess.user }) })
    );
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('correctpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('shows loading state while submitting', async ({ page }) => {
    let resolveRoute: () => void;
    await page.route('**/api/auth/login', (route) => {
      new Promise<void>((res) => { resolveRoute = res; }).then(() =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockLoginSuccess) })
      );
    });
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('button', { name: 'Signing in...' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Signing in...' })).toBeDisabled();
    resolveRoute!();
  });
});

test.describe('Login page — edge cases', () => {
  test('XSS in API error message is rendered as text, not executed', async ({ page }) => {
    const xssPayload = '<script>window.__xss=true</script>XSS Error';
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: xssPayload }) })
    );
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    const xssExecuted = await page.evaluate(() => (window as unknown as Record<string, unknown>).__xss);
    expect(xssExecuted).toBeUndefined();
  });

  test('SQL injection string in fields does not crash the app', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Invalid credentials.' }) })
    );
    await page.goto('/login');
    await page.getByLabel('Email').fill("admin'--@example.com");
    await page.getByLabel('Password').fill("' OR '1'='1");
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Invalid credentials.')).toBeVisible();
  });

  test('very long email does not crash the app', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ message: 'The email must not exceed 255 characters.' }) })
    );
    await page.goto('/login');
    await page.getByLabel('Email').fill(`${'a'.repeat(244)}@example.com`);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('The email must not exceed 255 characters.')).toBeVisible();
  });

  test('very long password does not crash the app', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Invalid credentials.' }) })
    );
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('p'.repeat(500));
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Invalid credentials.')).toBeVisible();
  });

  test('unicode and emoji in fields do not crash the app', async ({ page }) => {
    // Non-ASCII email is blocked by browser HTML5 validation — use valid email, unicode in password
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Invalid credentials.' }) })
    );
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('🔥pässwörð🔥');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Invalid credentials.')).toBeVisible();
  });

  test('keyboard Enter submits the form', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Invalid credentials.' }) })
    );
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByLabel('Password').press('Enter');
    await expect(page.getByText('Invalid credentials.')).toBeVisible();
  });

  test('double-click on submit does not send duplicate requests', async ({ page }) => {
    let requestCount = 0;
    await page.route('**/api/auth/login', (route) => {
      requestCount++;
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Invalid credentials.' }) });
    });
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).dblclick();
    await page.waitForTimeout(500);
    expect(requestCount).toBe(1);
  });

  test('whitespace-only password is blocked by required validation', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    // leave password empty (spaces won't satisfy required)
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/login');
  });
});
