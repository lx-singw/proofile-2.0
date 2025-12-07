/**
 * E2E Test Suite for Phase 2: Resume Upload & Analyze
 * Tests anonymous upload flow with paywall triggers
 */
import { test, expect } from '@playwright/test';

test.describe('Phase 2: Resume Upload (Anonymous)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resume/upload');
  });

  test('should display upload interface without authentication', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/upload.*resume/i);
    await expect(page.locator('[data-testid="resume-dropzone"]')).toBeVisible();
  });

  test('should allow file upload without authentication', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake pdf content'),
    });

    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible({ timeout: 10000 });
  });

  test('should display analysis results after upload', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake pdf content'),
    });

    await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 10000 });
    
    await expect(page.locator('[data-testid="resume-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="improvement-suggestions"]')).toBeVisible();
    await expect(page.locator('[data-testid="ats-score"]')).toBeVisible();
  });

  test('should show paywall when clicking "Apply Improvements"', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake pdf content'),
    });

    await page.waitForSelector('[data-testid="apply-improvements-btn"]', { timeout: 10000 });
    await page.click('[data-testid="apply-improvements-btn"]');

    await expect(page.locator('[data-testid="paywall-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="paywall-modal"]')).toContainText(/sign up/i);
    await expect(page.locator('[data-testid="signup-cta"]')).toBeVisible();
  });

  test('should show paywall when clicking "Download"', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake pdf content'),
    });

    await page.waitForSelector('[data-testid="download-btn"]', { timeout: 10000 });
    await page.click('[data-testid="download-btn"]');

    await expect(page.locator('[data-testid="paywall-modal"]')).toBeVisible();
  });

  test('should allow text paste upload', async ({ page }) => {
    const resumeText = 'John Doe\nSoftware Engineer\n5 years experience';
    await page.fill('[data-testid="resume-text-input"]', resumeText);
    await page.click('[data-testid="analyze-text-btn"]');

    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible({ timeout: 10000 });
  });

  test('should validate file type', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('text content'),
    });

    await expect(page.locator('[data-testid="error-message"]')).toContainText(/invalid file type/i);
  });

  test('should validate file size', async ({ page }) => {
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'large-resume.pdf',
      mimeType: 'application/pdf',
      buffer: largeBuffer,
    });

    await expect(page.locator('[data-testid="error-message"]')).toContainText(/file too large/i);
  });
});

test.describe('Phase 2: Resume Upload (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'Test123!@#');
    await page.click('[data-testid="login-btn"]');
    await page.waitForURL('/dashboard');

    await page.goto('/resume/upload');
  });

  test('should allow applying improvements when authenticated', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake pdf content'),
    });

    await page.waitForSelector('[data-testid="apply-improvements-btn"]', { timeout: 10000 });
    await page.click('[data-testid="apply-improvements-btn"]');

    await expect(page.locator('[data-testid="improvements-applied"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="paywall-modal"]')).not.toBeVisible();
  });

  test('should allow downloading resume when authenticated', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake pdf content'),
    });

    await page.waitForSelector('[data-testid="download-btn"]', { timeout: 10000 });
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-btn"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('should save resume to user account', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake pdf content'),
    });

    await page.waitForSelector('[data-testid="save-btn"]', { timeout: 10000 });
    await page.click('[data-testid="save-btn"]');

    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
    
    // Verify it appears in resume list
    await page.goto('/resume');
    await expect(page.locator('[data-testid="resume-list"]')).toContainText('test-resume');
  });
});

test.describe('Phase 2: Analysis Quality', () => {
  test('should display comprehensive analysis', async ({ page }) => {
    await page.goto('/resume/upload');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake pdf content'),
    });

    await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 10000 });

    // Check all analysis components
    await expect(page.locator('[data-testid="overall-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="ats-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="keyword-analysis"]')).toBeVisible();
    await expect(page.locator('[data-testid="format-check"]')).toBeVisible();
    await expect(page.locator('[data-testid="improvement-suggestions"]')).toBeVisible();
  });

  test('should show score breakdown', async ({ page }) => {
    await page.goto('/resume/upload');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake pdf content'),
    });

    await page.waitForSelector('[data-testid="score-breakdown"]', { timeout: 10000 });

    const scoreText = await page.locator('[data-testid="overall-score"]').textContent();
    expect(scoreText).toMatch(/\d+\/100/);
  });
});
