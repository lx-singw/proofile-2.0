/**
 * E2E Test Suite for Phase 2: Paywall & Conversion Flow
 * Tests paywall triggers and sign-up conversion from resume tools
 */
import { test, expect } from '@playwright/test';

test.describe('Phase 2: Paywall Triggers', () => {
  test('should show paywall modal with value proposition', async ({ page }) => {
    await page.goto('/resume/build');
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.click('[data-testid="download-btn"]');

    const modal = page.locator('[data-testid="paywall-modal"]');
    await expect(modal).toBeVisible();
    
    // Check value proposition elements
    await expect(modal).toContainText(/proofile/i);
    await expect(modal).toContainText(/living.*profile/i);
    await expect(modal).toContainText(/verified/i);
    await expect(modal).toContainText(/job.*match/i);
  });

  test('should preserve resume data when showing paywall', async ({ page }) => {
    await page.goto('/resume/build');
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john@example.com');
    await page.click('[data-testid="save-btn"]');

    await expect(page.locator('[data-testid="paywall-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="paywall-modal"]')).toContainText(/data.*saved/i);
  });

  test('should show different paywall messages for different actions', async ({ page }) => {
    await page.goto('/resume/build');
    await page.fill('[data-testid="name-input"]', 'John Doe');

    // Download paywall
    await page.click('[data-testid="download-btn"]');
    const downloadModal = page.locator('[data-testid="paywall-modal"]');
    await expect(downloadModal).toContainText(/download/i);
    await page.click('[data-testid="close-modal"]');

    // Save paywall
    await page.click('[data-testid="save-btn"]');
    const saveModal = page.locator('[data-testid="paywall-modal"]');
    await expect(saveModal).toContainText(/save/i);
  });

  test('should show paywall for improvements', async ({ page }) => {
    await page.goto('/resume/upload');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('content'),
    });

    await page.waitForSelector('[data-testid="apply-improvements-btn"]', { timeout: 10000 });
    await page.click('[data-testid="apply-improvements-btn"]');

    await expect(page.locator('[data-testid="paywall-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="paywall-modal"]')).toContainText(/improve/i);
  });
});

test.describe('Phase 2: Sign-Up Conversion Flow', () => {
  test('should navigate to sign-up from paywall', async ({ page }) => {
    await page.goto('/resume/build');
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.click('[data-testid="save-btn"]');

    await page.click('[data-testid="signup-cta"]');
    await expect(page).toHaveURL(/\/register/);
  });

  test('should pre-fill sign-up form with resume data', async ({ page }) => {
    await page.goto('/resume/build');
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john@example.com');
    await page.click('[data-testid="save-btn"]');

    await page.click('[data-testid="signup-cta"]');
    
    await expect(page.locator('[data-testid="signup-email"]')).toHaveValue('john@example.com');
    await expect(page.locator('[data-testid="signup-name"]')).toHaveValue('John Doe');
  });

  test('should restore resume after sign-up', async ({ page }) => {
    await page.goto('/resume/build');
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john@example.com');
    await page.click('[data-testid="save-btn"]');

    await page.click('[data-testid="signup-cta"]');
    
    // Complete sign-up
    await page.fill('[data-testid="signup-password"]', 'Test123!@#');
    await page.click('[data-testid="signup-submit"]');

    // Should redirect to resume with data
    await expect(page).toHaveURL(/\/resume\/build/);
    await expect(page.locator('[data-testid="name-input"]')).toHaveValue('John Doe');
  });

  test('should show "already have account" link', async ({ page }) => {
    await page.goto('/resume/build');
    await page.click('[data-testid="save-btn"]');

    const modal = page.locator('[data-testid="paywall-modal"]');
    await expect(modal.locator('[data-testid="login-link"]')).toBeVisible();
    await expect(modal.locator('[data-testid="login-link"]')).toContainText(/sign in/i);
  });

  test('should navigate to login from paywall', async ({ page }) => {
    await page.goto('/resume/build');
    await page.click('[data-testid="save-btn"]');

    await page.click('[data-testid="login-link"]');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Phase 2: Post-Conversion Experience', () => {
  test('should complete action after sign-up', async ({ page }) => {
    await page.goto('/resume/build');
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.click('[data-testid="save-btn"]');

    // Sign up
    await page.click('[data-testid="signup-cta"]');
    await page.fill('[data-testid="signup-email"]', 'newuser@example.com');
    await page.fill('[data-testid="signup-password"]', 'Test123!@#');
    await page.click('[data-testid="signup-submit"]');

    // Should auto-save after sign-up
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
  });

  test('should show onboarding after first sign-up', async ({ page }) => {
    await page.goto('/resume/build');
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.click('[data-testid="save-btn"]');

    await page.click('[data-testid="signup-cta"]');
    await page.fill('[data-testid="signup-email"]', 'newuser@example.com');
    await page.fill('[data-testid="signup-password"]', 'Test123!@#');
    await page.click('[data-testid="signup-submit"]');

    // Should show onboarding
    await expect(page).toHaveURL(/\/onboarding/);
    await expect(page.locator('[data-testid="onboarding-welcome"]')).toBeVisible();
  });

  test('should import resume data to profile', async ({ page }) => {
    await page.goto('/resume/build');
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john@example.com');
    await page.click('[data-testid="add-experience-btn"]');
    await page.fill('[data-testid="job-title-input"]', 'Engineer');
    await page.click('[data-testid="save-btn"]');

    // Sign up and complete onboarding
    await page.click('[data-testid="signup-cta"]');
    await page.fill('[data-testid="signup-email"]', 'newuser@example.com');
    await page.fill('[data-testid="signup-password"]', 'Test123!@#');
    await page.click('[data-testid="signup-submit"]');

    // Onboarding should offer to import
    await expect(page.locator('[data-testid="import-resume-data"]')).toBeVisible();
    await page.click('[data-testid="import-resume-data"]');

    // Check profile has data
    await page.goto('/profile');
    await expect(page.locator('[data-testid="profile-name"]')).toContainText('John Doe');
    await expect(page.locator('[data-testid="profile-experience"]')).toContainText('Engineer');
  });
});

test.describe('Phase 2: Paywall Analytics', () => {
  test('should track paywall impressions', async ({ page }) => {
    await page.goto('/resume/build');
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.click('[data-testid="save-btn"]');

    // Paywall shown - should fire analytics event
    await expect(page.locator('[data-testid="paywall-modal"]')).toBeVisible();
    
    // Check analytics (if exposed for testing)
    const analyticsEvents = await page.evaluate(() => {
      return (window as any).dataLayer || [];
    });
    
    const paywallEvent = analyticsEvents.find((e: any) => e.event === 'paywall_shown');
    expect(paywallEvent).toBeDefined();
  });

  test('should track conversion from paywall', async ({ page }) => {
    await page.goto('/resume/build');
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.click('[data-testid="save-btn"]');

    await page.click('[data-testid="signup-cta"]');
    
    const analyticsEvents = await page.evaluate(() => {
      return (window as any).dataLayer || [];
    });
    
    const conversionEvent = analyticsEvents.find((e: any) => e.event === 'paywall_conversion');
    expect(conversionEvent).toBeDefined();
  });
});

test.describe('Phase 2: Paywall Dismissal', () => {
  test('should allow closing paywall', async ({ page }) => {
    await page.goto('/resume/build');
    await page.click('[data-testid="save-btn"]');

    await expect(page.locator('[data-testid="paywall-modal"]')).toBeVisible();
    await page.click('[data-testid="close-modal"]');
    await expect(page.locator('[data-testid="paywall-modal"]')).not.toBeVisible();
  });

  test('should remember paywall dismissal', async ({ page }) => {
    await page.goto('/resume/build');
    await page.click('[data-testid="save-btn"]');
    await page.click('[data-testid="close-modal"]');

    // Try again - should still show (no permanent dismissal)
    await page.click('[data-testid="save-btn"]');
    await expect(page.locator('[data-testid="paywall-modal"]')).toBeVisible();
  });

  test('should show paywall again after dismissal', async ({ page }) => {
    await page.goto('/resume/build');
    await page.click('[data-testid="save-btn"]');
    await page.click('[data-testid="close-modal"]');

    // Different action should show paywall again
    await page.click('[data-testid="download-btn"]');
    await expect(page.locator('[data-testid="paywall-modal"]')).toBeVisible();
  });
});
