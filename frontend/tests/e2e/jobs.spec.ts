import { test, expect, Page } from '@playwright/test';

// Helper: Mock authentication by setting token in localStorage
async function authenticateUser(page: Page) {
  // Ensure a clean browser context
  await page.context().clearCookies();
  await page.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });

  // Perform a real login against the backend to obtain tokens and cookies.
  const email = 'e2e+test@example.com';
  const password = 'Passw0rd!';

  const body = new URLSearchParams();
  body.append('username', email);
  body.append('password', password);

  const res = await page.request.post('http://localhost:3000/api/v1/auth/token', {
    data: body.toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!res.ok()) {
    // Fallback: if real login fails (e.g. user doesn't exist), try to mock it
    // But for now, let's assume the test env has this user or we can seed it.
    // If we can't login, we can't test protected routes properly if middleware enforces cookies.
    console.warn(`Failed to login test user: ${res.status()} ${await res.text()}`);
    // Try setting just localStorage as a fallback, though it might fail middleware checks
    await page.addInitScript(() => {
        localStorage.setItem('auth:accessToken', 'fake-token');
    });
    return;
  }

  const data = await res.json();
  const accessToken = data.access_token;

  await page.addInitScript((token: string) => {
    localStorage.setItem('auth:accessToken', token);
  }, accessToken);
}

test.describe('Jobs Page', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
    
    // Mock User Profile
    await page.route('**/api/v1/users/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'apprentice'
        })
      });
    });

    // Mock Advanced Recommendations
    await page.route('**/api/v1/jobs/recommendations/advanced*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            job: {
              id: 1,
              title: 'Senior Product Manager',
              company_name: 'TechCorp',
              location: 'Remote',
              description: 'Great job',
              created_at: new Date().toISOString(),
              job_type: 'Full-time',
              salary_range: '$120k - $150k',
              industry: 'Technology'
            },
            match_score: 95,
            score_breakdown: {
              title_match: 50,
              skills_match: 25,
              experience_match: 10,
              industry_match: 10
            }
          }
        ])
      });
    });
  });

  test('should display job recommendations', async ({ page }) => {
    await page.goto('/jobs');
    
    // Check header
    await expect(page.getByText('Job Matches')).toBeVisible();
    
    // Check job card
    await expect(page.getByText('Senior Product Manager')).toBeVisible();
    await expect(page.getByText('TechCorp')).toBeVisible();
    
    // Check match score
    await expect(page.getByText('95% Match')).toBeVisible();
    
    // Check breakdown
    await expect(page.getByText("Why you're a match")).toBeVisible();
    await expect(page.getByText('Role matches your goal')).toBeVisible();
  });
});
