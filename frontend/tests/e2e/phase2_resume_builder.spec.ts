/**
 * E2E Test Suite for Phase 2: Resume Builder
 * Tests anonymous builder flow with paywall on save/download
 */
import { test, expect } from '@playwright/test';

test.describe('Phase 2: Resume Builder (Anonymous)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resume/build');
  });

  test('should display builder interface without authentication', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/build.*resume/i);
    await expect(page.locator('[data-testid="template-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="resume-form"]')).toBeVisible();
  });

  test('should allow template selection', async ({ page }) => {
    await page.click('[data-testid="template-modern"]');
    await expect(page.locator('[data-testid="template-preview"]')).toHaveAttribute('data-template', 'modern');
  });

  test('should allow filling personal information', async ({ page }) => {
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john@example.com');
    await page.fill('[data-testid="phone-input"]', '555-0100');

    await expect(page.locator('[data-testid="preview-name"]')).toContainText('John Doe');
  });

  test('should allow adding work experience', async ({ page }) => {
    await page.click('[data-testid="add-experience-btn"]');
    await page.fill('[data-testid="job-title-input"]', 'Software Engineer');
    await page.fill('[data-testid="company-input"]', 'Tech Corp');
    await page.fill('[data-testid="start-date-input"]', '2020-01');
    await page.fill('[data-testid="end-date-input"]', '2023-12');

    await expect(page.locator('[data-testid="preview-experience"]')).toContainText('Software Engineer');
  });

  test('should allow adding education', async ({ page }) => {
    await page.click('[data-testid="add-education-btn"]');
    await page.fill('[data-testid="degree-input"]', 'BS Computer Science');
    await page.fill('[data-testid="school-input"]', 'University');
    await page.fill('[data-testid="grad-year-input"]', '2020');

    await expect(page.locator('[data-testid="preview-education"]')).toContainText('BS Computer Science');
  });

  test('should allow adding skills', async ({ page }) => {
    await page.fill('[data-testid="skills-input"]', 'JavaScript, Python, React');
    await page.click('[data-testid="add-skills-btn"]');

    await expect(page.locator('[data-testid="preview-skills"]')).toContainText('JavaScript');
  });

  test('should show live preview', async ({ page }) => {
    await page.fill('[data-testid="name-input"]', 'Jane Smith');
    
    // Preview should update in real-time
    await expect(page.locator('[data-testid="preview-pane"]')).toContainText('Jane Smith');
  });

  test('should show paywall when clicking "Save"', async ({ page }) => {
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.click('[data-testid="save-btn"]');

    await expect(page.locator('[data-testid="paywall-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="paywall-modal"]')).toContainText(/create.*proofile/i);
    await expect(page.locator('[data-testid="signup-cta"]')).toBeVisible();
  });

  test('should show paywall when clicking "Download"', async ({ page }) => {
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.click('[data-testid="download-btn"]');

    await expect(page.locator('[data-testid="paywall-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="paywall-modal"]')).toContainText(/download/i);
  });

  test('should persist draft data in session', async ({ page }) => {
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john@example.com');

    // Reload page
    await page.reload();

    // Data should persist
    await expect(page.locator('[data-testid="name-input"]')).toHaveValue('John Doe');
    await expect(page.locator('[data-testid="email-input"]')).toHaveValue('john@example.com');
  });

  test('should show completion progress', async ({ page }) => {
    await expect(page.locator('[data-testid="completion-progress"]')).toContainText('0%');

    await page.fill('[data-testid="name-input"]', 'John Doe');
    await expect(page.locator('[data-testid="completion-progress"]')).toContainText(/\d+%/);
  });
});

test.describe('Phase 2: Resume Builder (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'Test123!@#');
    await page.click('[data-testid="login-btn"]');
    await page.waitForURL('/dashboard');

    await page.goto('/resume/build');
  });

  test('should allow saving resume when authenticated', async ({ page }) => {
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john@example.com');
    await page.click('[data-testid="save-btn"]');

    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="paywall-modal"]')).not.toBeVisible();
  });

  test('should allow downloading resume when authenticated', async ({ page }) => {
    await page.fill('[data-testid="name-input"]', 'John Doe');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-btn"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('should save resume to user account', async ({ page }) => {
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="resume-name-input"]', 'My Tech Resume');
    await page.click('[data-testid="save-btn"]');

    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();

    // Verify in resume list
    await page.goto('/resume');
    await expect(page.locator('[data-testid="resume-list"]')).toContainText('My Tech Resume');
  });

  test('should allow creating multiple resumes', async ({ page }) => {
    // Create first resume
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="resume-name-input"]', 'Resume 1');
    await page.click('[data-testid="save-btn"]');
    await page.waitForSelector('[data-testid="save-success"]');

    // Create second resume
    await page.goto('/resume/build');
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="resume-name-input"]', 'Resume 2');
    await page.click('[data-testid="save-btn"]');

    // Verify both exist
    await page.goto('/resume');
    await expect(page.locator('[data-testid="resume-list"]')).toContainText('Resume 1');
    await expect(page.locator('[data-testid="resume-list"]')).toContainText('Resume 2');
  });
});

test.describe('Phase 2: Template System', () => {
  test('should display multiple templates', async ({ page }) => {
    await page.goto('/resume/build');
    
    const templates = page.locator('[data-testid^="template-"]');
    const count = await templates.count();
    expect(count).toBeGreaterThan(1);
  });

  test('should preview template before selection', async ({ page }) => {
    await page.goto('/resume/build');
    
    await page.hover('[data-testid="template-modern"]');
    await expect(page.locator('[data-testid="template-preview-modal"]')).toBeVisible();
  });

  test('should switch templates without losing data', async ({ page }) => {
    await page.goto('/resume/build');
    
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.click('[data-testid="template-modern"]');
    await page.click('[data-testid="template-classic"]');

    await expect(page.locator('[data-testid="name-input"]')).toHaveValue('John Doe');
  });
});

test.describe('Phase 2: Form Validation', () => {
  test('should validate required fields', async ({ page }) => {
    await page.goto('/resume/build');
    
    await page.click('[data-testid="save-btn"]');
    await expect(page.locator('[data-testid="validation-error"]')).toContainText(/name.*required/i);
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/resume/build');
    
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.blur('[data-testid="email-input"]');
    await expect(page.locator('[data-testid="email-error"]')).toContainText(/invalid.*email/i);
  });

  test('should validate phone format', async ({ page }) => {
    await page.goto('/resume/build');
    
    await page.fill('[data-testid="phone-input"]', 'abc');
    await page.blur('[data-testid="phone-input"]');
    await expect(page.locator('[data-testid="phone-error"]')).toContainText(/invalid.*phone/i);
  });

  test('should validate date ranges', async ({ page }) => {
    await page.goto('/resume/build');
    
    await page.click('[data-testid="add-experience-btn"]');
    await page.fill('[data-testid="start-date-input"]', '2023-01');
    await page.fill('[data-testid="end-date-input"]', '2020-01');
    await page.blur('[data-testid="end-date-input"]');
    
    await expect(page.locator('[data-testid="date-error"]')).toContainText(/end date.*after.*start date/i);
  });
});
