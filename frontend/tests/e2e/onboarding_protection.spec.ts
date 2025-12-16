import { test, expect } from '@playwright/test';

test.describe('Onboarding Route Protection', () => {
  
  test('redirects to dashboard if user already has username', async ({ page }) => {
    // Mock authenticated user WITH username
    await page.route('**/api/v1/users/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: 'test@example.com',
          username: 'existinguser',
          full_name: 'Test User'
        })
      });
    });

    // Mock other auth endpoints to avoid 401s
    await page.route('**/api/v1/profiles/me', async route => route.fulfill({ status: 404 }));
    await page.route('**/api/v1/auth/me', async route => route.fulfill({ status: 404 }));

    // Navigate to onboarding
    await page.goto('/onboarding');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('stays on onboarding if user has NO username', async ({ page }) => {
    // Mock authenticated user WITHOUT username
    await page.route('**/api/v1/users/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 2,
          email: 'newuser@example.com',
          username: null, // No username
          full_name: 'New User'
        })
      });
    });

    // Mock other auth endpoints
    await page.route('**/api/v1/profiles/me', async route => route.fulfill({ status: 404 }));
    await page.route('**/api/v1/auth/me', async route => route.fulfill({ status: 404 }));

    // Navigate to onboarding
    await page.goto('/onboarding');

    // Should stay on onboarding
    await expect(page).toHaveURL(/\/onboarding/);
    await expect(page.getByText(/Welcome to Proofile/i)).toBeVisible();
  });

  test('redirects to login if not authenticated', async ({ page }) => {
    // Mock unauthenticated
    await page.route('**/api/v1/users/me', async route => route.fulfill({ status: 401 }));
    await page.route('**/api/v1/profiles/me', async route => route.fulfill({ status: 401 }));
    await page.route('**/api/v1/auth/me', async route => route.fulfill({ status: 401 }));

    // Navigate to onboarding
    await page.goto('/onboarding');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

});
