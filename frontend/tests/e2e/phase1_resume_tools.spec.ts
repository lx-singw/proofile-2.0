import { test, expect } from '@playwright/test';

test.describe('Phase 1: Resume Tools (Anonymous Access)', () => {

  // 1. Build from Scratch (/resume/build)
  test('Build from Scratch - Anonymous Access & Paywall', async ({ page }) => {
    // Go to builder
    await page.goto('/resume/build');

    // Select Template (if present)
    // Wait for the template selection screen to appear
    await expect(page.getByText('Choose Your Template')).toBeVisible();
    
    // Click "Start Building"
    await page.getByRole('button', { name: /Start Building/i }).click();

    // ✅ Full builder interface accessible
    await expect(page.getByText('Personal Information')).toBeVisible();
    
    // ✅ All form fields available (Fill some data)
    // Use placeholders since labels might not be linked
    await page.getByPlaceholder('John Davidson').fill('John Doe');
    await page.getByPlaceholder('Senior Product Manager').fill('Software Engineer');

    // ✅ Live preview visible (Check if name appears in preview area)
    // Check if name appears in the preview (it's an h1)
    // Use a more specific selector to avoid matching the editable title
    await expect(page.locator('.shadow-2xl').getByRole('heading', { name: 'John Doe' })).toBeVisible();

    // ❌ Cannot save / Paywall Trigger
    // User clicks "Save" or "Download"
    const saveButton = page.getByRole('button', { name: 'Save', exact: true });
    await saveButton.click();

    // Expect Modal: "Your Professional Resume is Ready!" or "Create Your Proofile"
    await expect(page.getByText(/Create Your Proofile|Sign Up/i)).toBeVisible();
    await expect(page.getByText(/Transform your resume into a living Proofile/i)).toBeVisible();
  });

  // 2. Upload & Analyze (/resume/upload)
  test('Upload & Analyze - Anonymous Access & Paywall', async ({ page }) => {
    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
    page.on('pageerror', exception => console.log(`PAGE ERROR: ${exception}`));
    page.on('request', request => console.log('>>', request.method(), request.url()));

    // Mock the analysis API
    await page.route('**/api/v1/resume/public/analyze', async route => {
      console.log('MOCK HIT: /api/v1/resume/public/analyze');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          score: 72,
          name: 'Uploaded Resume',
          stats: { pages: 1, experience: '2 years', role: 'Developer', location: 'Remote' },
          improvements: [
            { id: 1, text: 'Add more metrics to experience' },
            { id: 2, text: 'Use stronger action verbs' },
            { id: 3, text: 'Optimize skills section' },
            { id: 4, text: 'Fix formatting inconsistencies' },
            { id: 5, text: 'Add a professional summary' },
            { id: 6, text: 'Include LinkedIn profile' },
            { id: 7, text: 'Check for typos' },
            { id: 8, text: 'Quantify achievements' }
          ]
        })
      });
    });

    // Go to upload page
    await page.goto('/resume/upload');

    // ✅ Upload interface accessible
    await expect(page.getByText(/Upload & Refine Resume/i)).toBeVisible();

    // Upload a dummy file
    await page.setInputFiles('input[type="file"]', {
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('dummy content')
    });

    // Wait for File Preview Modal and click "Analyze Resume"
    await expect(page.getByText('File Preview')).toBeVisible();
    
    // Setup request listener
    const requestPromise = page.waitForRequest(req => req.url().includes('/api/v1/resume/public/analyze'));
    
    await page.getByRole('button', { name: /Analyze Resume/i }).click();

    // Wait for request
    try {
        await requestPromise;
        console.log('Request made to /api/v1/resume/public/analyze');
    } catch (e) {
        console.log('Request NOT made to /api/v1/resume/public/analyze');
    }

    // Wait for redirect to analysis preview
    await expect(page).toHaveURL(/.*\/resume\/analysis\/preview/);

    // ✅ View analysis and scores (Wait for analysis to complete)
    // The score is rendered as text "72" inside the circle
    await expect(page.getByText('72', { exact: true })).toBeVisible();
    await expect(page.getByText('Overall Score')).toBeVisible();
    
    // ❌ Paywall Trigger on "Apply Improvements"
    const improveButton = page.getByRole('button', { name: /Apply Improvements|Edit/i }).first();
    await improveButton.click();

    // Expect Modal
    await expect(page.getByText(/Create Your Proofile|Sign Up/i)).toBeVisible();
  });

  // 3. AI Build from Profile (/resume/ai-build)
  test('AI Build from Profile - Paywall on Entry', async ({ page }) => {
    await page.goto('/resume/ai-build');

    // Paywall Trigger: Immediate on page load
    // "To use AI Builder, create your Proofile"
    await expect(page.getByText(/Create Free Proofile to Use AI Builder/i)).toBeVisible();
    
    // Should offer manual builder alternative
    // await expect(page.getByText(/Build Resume Manually/i)).toBeVisible();
  });

  // 4. My Resumes (/resume)
  test('My Resumes - Restricted Access', async ({ page }) => {
    // ❌ Not accessible without sign-up
    await page.goto('/resume');

    // Should redirect to login or show sign-up prompt
    // Check URL or content
    // await expect(page).toHaveURL(/login|register|auth/);
    // OR check for login form
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

});
