/**
 * E2E Tests: Authenticated User Journey
 * Tests for logged-in users using resume tools
 */
import { test, expect } from '@playwright/test';

// Helper to login
async function loginUser(page: any) {
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL(/dashboard/);
}

test.describe('Authenticated Resume Builder', () => {
    test.beforeEach(async ({ page }) => {
        // Setup auth cookie/state for tests
        // In real tests, use storageState or API login
    });

    test.skip('authenticated user can save without paywall', async ({ page }) => {
        // This test requires actual auth setup
        await loginUser(page);
        await page.goto('/resume/build');

        // Should not show paywall on save
        await page.getByRole('button', { name: /Start Building/i }).click();
        await page.getByPlaceholder('John Davidson').fill('Auth User');
        await page.getByRole('button', { name: 'Save' }).click();

        // Should NOT see paywall
        await expect(page.getByText(/Your Professional Resume is Ready/i)).not.toBeVisible();
    });

    test.skip('authenticated user can access My Resumes', async ({ page }) => {
        await loginUser(page);
        await page.goto('/resume');

        // Should see resumes list, not login
        await expect(page.getByText(/My Resumes/i)).toBeVisible();
    });

    test.skip('authenticated user can use AI Builder', async ({ page }) => {
        await loginUser(page);
        await page.goto('/resume/ai-build');

        // Should see builder, not signup prompt
        await expect(page.getByText(/Create Free Proofile/i)).not.toBeVisible();
        await expect(page.getByPlaceholder(/Target Role/i)).toBeVisible();
    });
});
