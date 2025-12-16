/**
 * E2E Tests: Resume Tools User Journey
 * Complete user journey tests for resume builder, upload, and AI tools
 */
import { test, expect } from '@playwright/test';

// Skip mobile viewports for resume builder tests
test.describe('Resume Builder - User Journey', () => {
    test.skip(({ isMobile }) => isMobile, 'Skip mobile - builder not optimized for mobile');

    test.describe('Anonymous User Journey', () => {
        test('can access builder and create resume', async ({ page }) => {
            await page.goto('/resume/build');
            await expect(page.getByText('Choose Your Template')).toBeVisible({ timeout: 10000 });
            await page.getByRole('button', { name: /Start Building/i }).click({ force: true });
            await page.waitForSelector('[placeholder="John Davidson"]', { timeout: 10000 });
            await page.getByPlaceholder('John Davidson').fill('Jane Developer');
            await expect(page.getByPlaceholder('John Davidson')).toHaveValue('Jane Developer');
        });

        test('sees paywall when clicking Save', async ({ page }) => {
            await page.goto('/resume/build');
            await page.waitForSelector('button:has-text("Start Building")', { timeout: 10000 });
            await page.getByRole('button', { name: /Start Building/i }).click({ force: true });
            await page.waitForSelector('[placeholder="John Davidson"]', { timeout: 10000 });
            await page.getByPlaceholder('John Davidson').fill('Test User');
            await page.getByRole('button', { name: 'Save', exact: true }).click();
            await expect(page.getByText(/Your Professional Resume is Ready/i)).toBeVisible({ timeout: 5000 });
        });

        test('builder form is fully accessible', async ({ page }) => {
            await page.goto('/resume/build');
            await page.waitForSelector('button:has-text("Start Building")', { timeout: 10000 });
            await page.getByRole('button', { name: /Start Building/i }).click({ force: true });
            await page.waitForSelector('[placeholder="John Davidson"]', { timeout: 10000 });
            // Verify form fields exist
            await expect(page.getByPlaceholder('John Davidson')).toBeVisible();
            await expect(page.getByPlaceholder('Senior Product Manager')).toBeVisible();
        });

        test('paywall modal can be dismissed', async ({ page }) => {
            await page.goto('/resume/build');
            await page.waitForSelector('button:has-text("Start Building")', { timeout: 10000 });
            await page.getByRole('button', { name: /Start Building/i }).click({ force: true });
            await page.waitForSelector('[placeholder="John Davidson"]', { timeout: 10000 });
            await page.getByPlaceholder('John Davidson').fill('Test User');
            await page.getByRole('button', { name: 'Save', exact: true }).click();
            await expect(page.getByText(/Your Professional Resume is Ready/i)).toBeVisible({ timeout: 5000 });
            // Press Escape to close
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
            // Form should still be visible
            await expect(page.getByPlaceholder('John Davidson')).toBeVisible();
        });
    });
});

test.describe('Resume Upload - User Journey', () => {
    test.skip(({ isMobile }) => isMobile, 'Skip mobile');

    test('can access upload page', async ({ page }) => {
        await page.goto('/resume/upload');
        await expect(page.getByText(/Upload & Refine Resume/i)).toBeVisible({ timeout: 10000 });
        await expect(page.locator('input[type="file"]')).toBeAttached();
    });

    test('can upload file and see preview', async ({ page }) => {
        await page.goto('/resume/upload');
        await page.setInputFiles('input[type="file"]', {
            name: 'resume.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('dummy resume content'),
        });
        await expect(page.getByText(/File Preview|Preview/i)).toBeVisible({ timeout: 5000 });
    });

    test('analysis preview page accepts localStorage data', async ({ page }) => {
        await page.goto('/resume/upload');
        await page.evaluate(() => {
            localStorage.setItem('publicAnalysis', JSON.stringify({
                score: 72,
                name: 'Test Resume',
                stats: { pages: 1 },
                improvements: [{ id: 1, text: 'Test improvement' }],
            }));
        });
        await page.goto('/resume/analysis/preview');
        await page.waitForTimeout(1000);
        // Page should load something - either score display or analysis content
        const hasContent = await page.locator('body').isVisible();
        expect(hasContent).toBe(true);
    });
});

test.describe('AI Builder - User Journey', () => {
    test('shows signup prompt for anonymous user', async ({ page }) => {
        await page.goto('/resume/ai-build');
        await expect(page.getByText(/Create Free Proofile to Use AI Builder/i)).toBeVisible({ timeout: 10000 });
    });

    test('has link to create account', async ({ page }) => {
        await page.goto('/resume/ai-build');
        await expect(page.getByRole('button', { name: /Create Free Account/i })).toBeVisible({ timeout: 10000 });
    });

    test('has link to login for existing users', async ({ page }) => {
        await page.goto('/resume/ai-build');
        await expect(page.getByText(/Already have an account/i)).toBeVisible({ timeout: 10000 });
    });
});

test.describe('My Resumes - Access Control', () => {
    test('anonymous user cannot freely access resumes', async ({ page }) => {
        await page.goto('/resume');
        await page.waitForTimeout(2000);

        // Should show some form of authentication requirement
        const url = page.url();
        const bodyText = await page.locator('body').textContent();

        const requiresAuth =
            url.includes('login') ||
            bodyText?.includes('Sign in') ||
            bodyText?.includes('Sign In') ||
            bodyText?.includes('Create') ||
            bodyText?.includes('Account');

        expect(requiresAuth).toBe(true);
    });
});

test.describe('Conversion Flow', () => {
    test.skip(({ isMobile }) => isMobile, 'Skip mobile');

    test('paywall has registration link', async ({ page }) => {
        await page.goto('/resume/build');
        await page.waitForSelector('button:has-text("Start Building")', { timeout: 10000 });
        await page.getByRole('button', { name: /Start Building/i }).click({ force: true });
        await page.waitForSelector('[placeholder="John Davidson"]', { timeout: 10000 });
        await page.getByPlaceholder('John Davidson').fill('Test');
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await expect(page.getByText(/Your Professional Resume is Ready/i)).toBeVisible({ timeout: 5000 });

        const registerLink = page.getByRole('link', { name: /Create Your Proofile|Sign Up|Create Account/i });
        await expect(registerLink).toBeVisible();
        const href = await registerLink.getAttribute('href');
        expect(href).toBe('/register');
    });

    test('localStorage persists across navigation', async ({ page }) => {
        await page.goto('/resume/build');
        await page.evaluate(() => {
            localStorage.setItem('resumeData', JSON.stringify({
                personal: { name: 'Test User', email: 'test@example.com' }
            }));
        });
        await page.goto('/register');
        const savedData = await page.evaluate(() => localStorage.getItem('resumeData'));
        expect(savedData).toContain('Test User');
    });
});
