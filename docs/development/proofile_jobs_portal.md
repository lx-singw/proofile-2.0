interface RevenueModel {
  // Primary: Proofile Subscriptions
  proofileSubscriptions: {
    free: 0,
    pro: 9, // per month
    verified: 19 // per month
  };
  
  // Secondary: Employer Services
  employerServices: {
    jobPostings: {
      basic: 49, // per posting, 30 days
      featured: 199, // per posting, 30 days, top placement
      unlimited: 499 // per month, unlimited posts
    },
    companyProfile: 299, // per month, branded company page
    analytics: 99, // per month, candidate analytics
    atsIntegration: 499 // per month
  };
  
  // Tertiary: Advertising
  advertising: {
    bannerAds: 500, // per month
    sponsoredJobs: 299, // per job per month
    emailNewsletter: 1000 // per send
  };
  
  // Affiliate: Course/Training Referrals
  affiliateCommissions: {
    courses: '20%', // Commission on course sales
    certifications: '15%',
    careerCoaching: '25%'
  };
}

// Revenue projections
const projections = {
  month1: {
    visitors: 10000,
    signups: 150, // 1.5% conversion
    paidSubscriptions: 15, // 10% of signups
    revenue: 15 * 9 + 5 * 19 = 230
  },
  month3: {
    visitors: 50000,
    signups: 1000,
    paidSubscriptions: 100,
    employerPosts: 20,
    revenue: (100 * 9) + (20 * 49) + (5 * 199) = 2875
  },
  month6: {
    visitors: 200000,
    signups: 5000,
    paidSubscriptions: 500,
    employerPosts: 100,
    advertising: 5000,
    revenue: (500 * 9) + (100 * 49) + (10 * 199) + 5000 = 16390
  },
  year1: {
    visitors: 1000000,
    signups: 30000,
    paidSubscriptions: 3000,
    employerPosts: 500,
    advertising: 15000,
    revenue: (3000 * 9) + (500 * 49) + (50 * 199) + 15000 = 76450
  }
};
```

---

## 🛠️ Technical Implementation

### A. Database Schema

```sql
-- Jobs table (aggregated from all sources)
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(255) NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'pnet', 'linkedin', etc.
  source_url TEXT NOT NULL,
  
  -- Basic info
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  company_logo TEXT,
  
  -- Location
  city VARCHAR(100),
  province VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  remote BOOLEAN DEFAULT false,
  hybrid BOOLEAN DEFAULT false,
  
  -- Content
  description TEXT NOT NULL,
  requirements TEXT[],
  responsibilities TEXT[],
  
  -- Compensation
  salary_min DECIMAL(10, 2),
  salary_max DECIMAL(10, 2),
  salary_currency VARCHAR(3) DEFAULT 'ZAR',
  salary_period VARCHAR(10), -- 'hour', 'month', 'year'
  salary_display VARCHAR(100),
  
  -- Classification
  category VARCHAR(100),
  job_type VARCHAR(20), -- 'full-time', 'part-time', etc.
  experience_level VARCHAR(20), -- 'entry', 'mid', 'senior', etc.
  
  -- Skills & tags
  skills TEXT[],
  tags TEXT[],
  
  -- Application
  application_url TEXT,
  application_email VARCHAR(255),
  application_method VARCHAR(20),
  
  -- Status
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  
  -- Metadata
  posted_at TIMESTAMP NOT NULL,
  scraped_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  -- Analytics
  views INTEGER DEFAULT 0,
  applications INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  -- Search optimization
  search_vector tsvector,
  
  -- Constraints
  UNIQUE(external_id, source),
  INDEX idx_jobs_search (search_vector),
  INDEX idx_jobs_posted_at (posted_at DESC),
  INDEX idx_jobs_location (city, country),
  INDEX idx_jobs_category (category),
  INDEX idx_jobs_active (active, posted_at DESC)
);

-- Create full-text search index
CREATE INDEX idx_jobs_fulltext ON jobs 
USING GIN(to_tsvector('english', title || ' ' || company || ' ' || description));

-- Job applications tracking
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  job_id UUID NOT NULL REFERENCES jobs(id),
  
  -- Application method
  applied_via VARCHAR(20), -- 'proofile', 'external'
  applied_at TIMESTAMP DEFAULT NOW(),
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'applied', -- 'applied', 'viewed', 'interview', 'rejected', 'hired'
  status_updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Additional data
  cover_letter TEXT,
  resume_version_id UUID,
  
  -- Analytics
  source_page VARCHAR(255), -- Where they clicked apply
  
  UNIQUE(user_id, job_id),
  INDEX idx_applications_user (user_id, applied_at DESC),
  INDEX idx_applications_job (job_id, applied_at DESC)
);

-- Saved jobs
CREATE TABLE saved_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  job_id UUID NOT NULL REFERENCES jobs(id),
  saved_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  
  UNIQUE(user_id, job_id),
  INDEX idx_saved_jobs_user (user_id, saved_at DESC)
);

-- Job alerts
CREATE TABLE job_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id), -- NULL for non-registered users
  email VARCHAR(255) NOT NULL,
  
  -- Alert criteria
  keywords TEXT[],
  locations TEXT[],
  categories TEXT[],
  job_types TEXT[],
  remote_only BOOLEAN DEFAULT false,
  
  -- Frequency
  frequency VARCHAR(20) DEFAULT 'daily', -- 'instant', 'daily', 'weekly'
  last_sent_at TIMESTAMP,
  
  -- Status
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_alerts_active (active, frequency),
  INDEX idx_alerts_user (user_id)
);

-- Scraping logs
CREATE TABLE scraping_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source VARCHAR(50) NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(20), -- 'success', 'failed', 'partial'
  jobs_found INTEGER DEFAULT 0,
  jobs_new INTEGER DEFAULT 0,
  jobs_updated INTEGER DEFAULT 0,
  error_message TEXT,
  
  INDEX idx_scraping_logs_source (source, started_at DESC)
);
```

### B. API Endpoints

```typescript
// Public API (no auth required)
const publicRoutes = {
  // Job search
  'GET /api/jobs': {
    query: {
      q?: string,              // Search query
      location?: string,       // City, province, or country
      category?: string,       // Job category
      type?: string,           // Job type
      remote?: boolean,        // Remote only
      salary_min?: number,     // Minimum salary
      page?: number,           // Pagination
      limit?: number           // Results per page
    },
    response: {
      jobs: Job[],
      total: number,
      page: number,
      pages: number
    }
  },
  
  // Job details
  'GET /api/jobs/:id': {
    response: Job
  },
  
  // Related jobs
  'GET /api/jobs/:id/similar': {
    response: Job[]
  },
  
  // Categories
  'GET /api/categories': {
    response: Array<{
      name: string,
      slug: string,
      count: number
    }>
  },
  
  // Locations
  'GET /api/locations': {
    response: Array<{
      city: string,
      province: string,
      country: string,
      count: number
    }>
  },
  
  // Job alerts (no auth)
  'POST /api/alerts/subscribe': {
    body: {
      email: string,
      criteria: AlertCriteria
    },
    response: {
      success: boolean,
      alertId: string
    }
  }
};

// Authenticated API
const authenticatedRoutes = {
  // Save job
  'POST /api/jobs/:id/save': {
    response: { saved: boolean }
  },
  
  // Apply to job
  'POST /api/jobs/:id/apply': {
    body: {
      coverLetter?: string,
      resumeVersionId?: string
    },
    response: {
      applicationId: string,
      status: string
    }
  },
  
  // My applications
  'GET /api/me/applications': {
    response: {
      applications: Array<{
        job: Job,
        appliedAt: Date,
        status: string
      }>
    }
  },
  
  // My saved jobs
  'GET /api/me/saved': {
    response: {
      savedJobs: Array<{
        job: Job,
        savedAt: Date
      }>
    }
  },
  
  // Job recommendations
  'GET /api/me/recommendations': {
    response: {
      recommendations: Job[]
    }
  }
};
```

### C. Scraping Implementation

```typescript
// Base scraper class
abstract class JobBoardScraper {
  abstract sourceName: string;
  abstract baseUrl: string;
  
  async scrape(): Promise<Job[]> {
    try {
      // Log start
      await this.logStart();
      
      // Scrape jobs
      const jobs = await this.fetchJobs();
      
      // Parse and normalize
      const normalized = jobs.map(job => this.normalizeJob(job));
      
      // Log completion
      await this.logComplete(normalized.length);
      
      return normalized;
    } catch (error) {
      await this.logError(error);
      throw error;
    }
  }
  
  protected abstract fetchJobs(): Promise<any[]>;
  protected abstract normalizeJob(rawJob: any): Job;
  
  protected async logStart() {
    await db.scrapingLogs.create({
      source: this.sourceName,
      started_at: new Date(),
      status: 'running'
    });
  }
  
  protected async logComplete(jobCount: number) {
    await db.scrapingLogs.update({
      source: this.sourceName,
      completed_at: new Date(),
      status: 'success',
      jobs_found: jobCount
    });
  }
  
  protected async logError(error: Error) {
    await db.scrapingLogs.update({
      source: this.sourceName,
      completed_at: new Date(),
      status: 'failed',
      error_message: error.message
    });
  }
}

// Example: PNet Scraper
class PNetScraper extends JobBoardScraper {
  sourceName = 'pnet';
  baseUrl = 'https://www.pnet.co.za';
  
  protected async fetchJobs(): Promise<any[]> {
    const jobs = [];
    
    // Fetch search results pages
    for (let page = 1; page <= 50; page++) {
      const url = `${this.baseUrl}/jobs/search-results?page=${page}`;
      const html = await this.fetchHTML(url);
      const pageJobs = await this.parseSearchPage(html);
      
      if (pageJobs.length === 0) break;
      
      jobs.push(...pageJobs);
      
      // Rate limiting
      await this.sleep(1000);
    }
    
    // Fetch individual job details
    const detailedJobs = await Promise.all(
      jobs.map(job => this.fetchJobDetails(job.url))
    );
    
    return detailedJobs;
  }
  
  protected normalizeJob(rawJob: any): Job {
    return {
      id: uuid(),
      externalId: rawJob.id,
      source: this.sourceName,
      sourceUrl: rawJob.url,
      title: rawJob.title,
      company: rawJob.company,
      companyLogo: rawJob.companyLogo,
      location: {
        city: rawJob.location.city,
        province: rawJob.location.province,
        country: 'South Africa',
        remote: rawJob.remote || false,
        hybrid: rawJob.hybrid || false
      },
      description: rawJob.description,
      requirements: this.extractRequirements(rawJob.description),
      responsibilities: this.extractResponsibilities(rawJob.description),
      salary: this.parseSalary(rawJob.salary),
      category: this.categorizeJob(rawJob.title),
      jobType: this.determineJobType(rawJob.description),
      experienceLevel: this.determineExperienceLevel(rawJob.description),
      skills: this.extractSkills(rawJob.description),
      tags: rawJob.tags || [],
      applicationUrl: rawJob.applyUrl,
      applicationMethod: 'url',
      postedAt: this.parseDate(rawJob.postedDate),
      scrapedAt: new Date(),
      active: true,
      verified: false,
      featured: false,
      views: 0,
      applications: 0,
      clicks: 0
    };
  }
  
  private async fetchHTML(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProofileBot/1.0)'
      }
    });
    return response.text();
  }
  
  private async parseSearchPage(html: string): Promise<any[]> {
    const $ = cheerio.load(html);
    const jobs = [];
    
    $('.job-card').each((i, el) => {
      jobs.push({
        id: $(el).data('job-id'),
        url: this.baseUrl + $(el).find('a').attr('href'),
        title: $(el).find('.job-title').text().trim(),
        company: $(el).find('.company-name').text().trim(),
        location: {
          city: $(el).find('.location').text().trim()
        },
        postedDate: $(el).find('.posted-date').text().trim()
      });
    });
    
    return jobs;
  }
  
  private async fetchJobDetails(url: string): Promise<any> {
    const html = await this.fetchHTML(url);
    const $ = cheerio.load(html);
    
    return {
      url,
      description: $('.job-description').html(),
      salary: $('.salary-info').text().trim(),
      remote: $('.job-tags').text().includes('Remote'),
      hybrid: $('.job-tags').text().includes('Hybrid'),
      tags: $('.job-tags .tag').map((i, el) => $(el).text().trim()).get(),
      applyUrl: $('.apply-button').attr('href')
    };
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Scraping scheduler
class ScrapingScheduler {
  async scheduleAll() {
    // Hourly scrapers (high-value sources)
    cron.schedule('0 * * * *', async () => {
      await this.runScrapers([
        'pnet',
        'careers24',
        'indeed_za',
        'linkedin',
        'glassdoor'
      ]);
    });
    
    // Daily scrapers (lower-priority sources)
    cron.schedule('0 2 * * *', async () => {
      await this.runScrapers([
        'gumtree',
        'career_junction',
        'job_mail'
      ]);
    });
    
    // Cleanup old jobs (daily)
    cron.schedule('0 3 * * *', async () => {
      await this.cleanupOldJobs();
    });
  }
  
  async runScrapers(sources: string[]) {
    for (const source of sources) {
      try {
        const scraper = this.getScraperForSource(source);
        const jobs = await scraper.scrape();
        await this.processJobs(jobs);
      } catch (error) {
        console.error(`Scraper ${source} failed:`, error);
      }
    }
  }
  
  async processJobs(jobs: Job[]) {
    for (const job of jobs) {
      // Check for duplicates
      const existing = await db.jobs.findOne({
        external_id: job.externalId,
        source: job.source
      });
      
      if (existing) {
        // Update existing job
        await db.jobs.update(existing.id, job);
      } else {
        // Create new job
        await db.jobs.create(job);
        
        // Trigger job alerts
        await this.triggerJobAlerts(job);
      }
    }
  }
  
  async cleanupOldJobs() {
    // Mark jobs as inactive if older than 60 days
    await db.jobs.update(
      { posted_at: { $lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } },
      { active: false }
    );
    
    // Delete jobs older than 180 days
    await db.jobs.delete({
      posted_at: { $lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }
    });
  }
  
  async triggerJobAlerts(job: Job) {
    // Find matching alerts
    const alerts = await db.jobAlerts.find({
      active: true,
      $or: [
        { keywords: { $in: job.skills } },
        { locations: { $in: [job.location.city] } },
        { categories: { $in: [job.category] } }
      ]
    });
    
    // Queue alert emails
    for (const alert of alerts) {
      await emailQueue.add('job_alert', {
        alertId: alert.id,
        jobId: job.id
      });
    }
  }
}
```

---

## 📧 Email System

### Job Alert Templates

```typescript
// Daily digest email
const dailyDigestEmail = (user: User, jobs: Job[]) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Daily Job Matches</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">Your Daily Job Matches</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">
      ${jobs.length} new opportunities matched to your profile
    </p>
  </div>
  
  <div style="padding: 20px;">
    <p>Hi ${user.name},</p>
    
    <p>Here are today's top job matches based on your Proofile:</p>
    
    ${jobs.map(job => `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0;">
        <h2 style="margin: 0 0 10px 0; font-size: 18px;">
          <a href="${process.env.APP_URL}/jobs/${job.id}" style="color: #1f2937; text-decoration: none;">
            ${job.title}
          </a>
        </h2>
        
        <p style="color: #6b7280; margin: 5px 0;">
          <strong>${job.company}</strong> • ${job.location.city}
          ${job.location.remote ? ' • Remote OK' : ''}
        </p>
        
        ${job.salary ? `
          <p style="color: #10b981; margin: 5px 0; font-weight: 600;">
            ${job.salary.display}
          </p>
        ` : ''}
        
        <p style="color: #4b5563; margin: 10px 0; line-height: 1.6;">
          ${job.description.substring(0, 200)}...
        </p>
        
        <div style="margin-top: 15px;">
          <a href="${process.env.APP_URL}/jobs/${job.id}/apply" 
             style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Apply Now
          </a>
          <a href="${process.env.APP_URL}/jobs/${job.id}" 
             style="color: #667eea; padding: 10px 20px; text-decoration: none; display: inline-block;">
            View Details
          </a>
        </div>
      </div>
    `).join('')}
    
    <div style="text-align: center; margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280;">
        <a href="${process.env.APP_URL}/jobs" style="color: #667eea; text-decoration: none;">
          View All Jobs
        </a> •
        <a href="${process.env.APP_URL}/settings/alerts" style="color: #667eea; text-decoration: none;">
          Manage Alerts
        </a> •
        <a href="${process.env.APP_URL}/unsubscribe?token=${user.unsubscribeToken}" style="color: #6b7280; text-decoration: none;">
          Unsubscribe
        </a>
      </p>
    </div>
  </div>
</body>
</html>
`;

// Instant alert (single job)
const instantAlertEmail = (user: User, job: Job) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #10b981; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">🎯 New Job Match!</h1>
  </div>
  
  <div style="padding: 20px;">
    <p>Hi ${user.name},</p>
    
    <p>A new job that matches your profile was just posted:</p>
    
    <div style="border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="margin: 0 0 15px 0;">
        ${job.title}
      </h2>
      
      <p style="color: #6b7280; margin: 5px 0; font-size: 16px;">
        <strong>${job.company}</strong> • ${job.location.city}
      </p>
      
      ${job.salary ? `
        <p style="color: #10b981; margin: 10px 0; font-size: 18px; font-weight: 600;">
          ${job.salary.display}
        </p>
      ` : ''}
      
      <div style="margin-top: 20px;">
        <a href="${process.env.APP_URL}/jobs/${job.id}/apply" 
           style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
          Apply Now →
        </a>
      </div>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">
      This job was posted ${formatTimeAgo(job.postedAt)}. Apply quickly to increase your chances!
    </p>
  </div>
</body>
</html>
`;
```

---

## 🚀 Implementation Roadmap

### Week 1-2: Foundation

```markdown
**Priority: CRITICAL**

- [ ] Set up database schema
- [ ] Implement first 3 scrapers (PNet, Careers24, Indeed ZA)
- [ ] Build job normalization pipeline
- [ ] Create deduplication system
- [ ] Set up cron jobs for scraping
- [ ] Build basic search API
```

### Week 3-4: Public Portal

```markdown
**Priority: CRITICAL**

- [ ] Design and build homepage
- [ ] Implement job search functionality
- [ ] Create job listing cards
- [ ] Build job details page
- [ ] Add filters and sorting
- [ ] Implement pagination
- [ ] Mobile responsive design
```

### Week 5-6: Apply Flow

```markdown
**Priority: HIGH**

- [ ] Build apply modal (choice screen)
- [ ] Implement quick apply flow
- [ ] Create signup within apply
- [ ] Build application tracking
- [ ] Add external apply option
- [ ] Track conversion metrics
```

### Week 7-8: SEO & Content

```markdown
**Priority: HIGH**

- [ ] Implement SEO metadata
- [ ] Add structured data (JSON-LD)
- [ ] Create category pages
- [ ] Create location pages
- [ ] Build sitemap generation
- [ ] Submit to Google Search Console
```

### Week 9-10: Email & Alerts

```markdown
**Priority: MEDIUM**

- [ ] Build job alert system
- [ ] Create email templates
- [ ] Implement daily digest
- [ ] Add instant alerts
- [ ] Build unsubscribe flow
- [ ] Set up email analytics
```

### Week 11-12: Polish & Launch

```markdown
**Priority: HIGH**

- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Analytics implementation
- [ ] A/B testing setup
- [ ] Marketing materials
- [ ] Soft launch to test users
```

---

## 📊 Success Metrics

### Week 1-4 Goals

```typescript
const earlyMetrics = {
  jobs_scraped: 10000,          // 10K jobs in database
  daily_scrapes: 500,            // 500 new jobs per day
  unique_visitors: 1000,         // 1K visitors
  searches: 500,                 // 500 searches performed
  job_views: 2000,               // 2K job detail views
  apply_attempts: 50,            // 50 people clicked apply
  signups: 20,                   // 20 new Proofile accounts
  conversion_rate: 2             // 2% of visitors sign up
};
```

### Month 3 Goals

```typescript
const month3Metrics = {
  jobs_in_db: 50000,
  unique_visitors: 50000,
  searches: 25000,
  job_views: 75000,
  apply_attempts: 2500,
  signups: 1000,
  proofile_applies: 400,         // 40% use Proofile to apply
  external_applies: 600,         // 60% go to external site
  conversion_rate: 2,            // 2% visitor → signup
  apply_conversion: 16           // 16% of apply attempts → signup
};
```

### Month 6 Goals

```typescript
const month6Metrics = {
  jobs_in_db: 75000,
  monthly_visitors: 200000,
  monthly_job_views: 500000,
  monthly_signups: 5000,
  total_users: 20000,
  proofile_applications: 5000,
  external_applications: 10000,
  job_alerts_sent: 100000,
  email_open_rate: 35,
  alert_ctr: 15,                 // 15% click through from emails
  revenue: 15000                 // $15K MRR
};
```

---

## 🎯 Key Takeaways

### The Strategy

1. **Give First, Ask Later**
   - Free job aggregator = massive value
   - No signup required to browse/search
   - Only ask for signup when applying
   - Even then, make it optional

2. **Proofile as Enhancement**
   - Position as "faster, better way to apply"
   - Not as gatekeeper, but as accelerator
   - Show clear benefits (time saved, tracking, matching)
   - Let users choose their path

3. **SEO as Growth Engine**
   - Thousands of job pages = thousands of entry points
   - Rank for "[job title] jobs south africa"
   - Category and location pages for discovery
   - Content marketing for authority

4. **Network Effects**
   - More jobs → more visitors
   - More visitors → more signups
   - More signups → better matching data
   - Better matching → higher conversions

### The Funnel

```
100,000 visitors (SEO, social, ads)
    ↓ 50% engage (search, browse)
50,000 engaged users
    ↓ 10% attempt to apply
5,000 apply attempts
    ↓ 20% choose Proofile route
1,000 signup attempts
    ↓ 80% complete signup
800 new Proofile users
    ↓ 10% convert to paid
80 paid subscriptions ($720/month)
```

### The Differentiation

**vs. Traditional Job Boards:**
- ✅ Aggregates ALL boards in one place
- ✅ Better search and filtering
- ✅ Cleaner, modern interface
- ✅ Optional Proofile benefits
- ✅ Free forever

**vs. LinkedIn:**
- ✅ Focused on SA market
- ✅ More job sources
- ✅ No social noise
- ✅ Better matching for job seekers
- ✅ Simpler, faster

**The Hook:** "Every job in South Africa, in one place, for free."

**The Conversion:** "Apply faster with your Proofile."

---

## 📋 Final Checklist

### Before Launch

- [ ] 10,000+ jobs scraped and live
- [ ] Search working flawlessly
- [ ] Mobile experience perfect
- [ ] Apply flow tested (both paths)
- [ ] SEO metadata complete
- [ ] Analytics tracking active
- [ ] Email system ready
- [ ] Performance optimized (<2s loads)
- [ ] Legal pages (Terms, Privacy)
- [ ] Support system ready

### Launch Day

- [ ] Announce on social media
- [ ] Post to r/southafrica
- [ ] Share in job seeker groups
- [ ] Send to email list
- [ ] Submit to Product Hunt
- [ ] Reach out to press
- [ ] Monitor analytics closely
-const ApplyModal = ({ job, onClose }: { job: Job; onClose: () => void }) => {
  const [step, setStep] = useState<'choice' | 'quick' | 'external'>('choice');
  
  return (
    <Modal open onClose={onClose} size="lg">
      {step === 'choice' && (
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6">
            How would you like to apply?
          </h2>
          
          {/* Option 1: Quick Apply with Proofile */}
          <div className="border-2 border-blue-500 rounded-lg p-6 mb-4 bg-blue-50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold">Quick Apply with Proofile</h3>
                  <Badge variant="success">Recommended</Badge>
                </div>
                
                <p className="text-gray-600 mb-4">
                  Apply in seconds with your Proofile. No resume upload needed.
                </p>
                
                <ul className="space-y-2 mb-4 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    One-click apply to all future jobs
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Track all applications in one place
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Get matched to similar opportunities
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Employers see your verified profile
                  </li>
                </ul>
                
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full"
                  onClick={() => setStep('quick')}
                >
                  Continue with Proofile (2 min) →
                </Button>
              </div>
            </div>
          </div>
          
          {/* Option 2: Apply Directly */}
          <div className="border rounded-lg p-6 hover:border-gray-400 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                <ExternalLink className="w-6 h-6 text-gray-600" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">Apply on {job.source}</h3>
                
                <p className="text-gray-600 mb-4">
                  You'll be redirected to the original job posting to apply directly.
                </p>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    window.open(job.sourceUrl, '_blank');
                    trackEvent('apply_external', { jobId: job.id });
                    onClose();
                  }}
                >
                  Go to {job.source} →
                </Button>
              </div>
            </div>
          </div>
          
          {/* Small disclaimer */}
          <p className="text-xs text-gray-500 text-center mt-6">
            Your choice won't affect your application. Both options work equally well.
          </p>
        </div>
      )}
      
      {step === 'quick' && (
        <QuickApplyFlow job={job} onClose={onClose} />
      )}
    </Modal>
  );
};
```

### Quick Apply Flow (For New Users)

```typescript
const QuickApplyFlow = ({ job, onClose }: { job: Job; onClose: () => void }) => {
  const [step, setStep] = useState<'auth' | 'profile' | 'review' | 'success'>('auth');
  const [userData, setUserData] = useState({});
  
  return (
    <div className="p-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Step {step === 'auth' ? 1 : step === 'profile' ? 2 : step === 'review' ? 3 : 4} of 3
          </span>
          <span className="text-sm text-gray-600">~2 minutes</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ 
              width: step === 'auth' ? '33%' : 
                     step === 'profile' ? '66%' : 
                     '100%' 
            }}
          />
        </div>
      </div>
      
      {step === 'auth' && (
        <div>
          <h2 className="text-2xl font-bold mb-2">Create your Proofile</h2>
          <p className="text-gray-600 mb-6">
            Sign up to apply and track all your applications
          </p>
          
          {/* Social Auth (Preferred) */}
          <div className="space-y-3 mb-6">
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => signInWithGoogle()}
            >
              <img src="/google.svg" className="w-5 h-5 mr-2" />
              Continue with Google
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => signInWithLinkedIn()}
            >
              <img src="/linkedin.svg" className="w-5 h-5 mr-2" />
              Continue with LinkedIn
            </Button>
          </div>
          
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or with email</span>
            </div>
          </div>
          
          {/* Email Form */}
          <form onSubmit={(e) => {
            e.preventDefault();
            handleEmailSignup(userData);
            setStep('profile');
          }}>
            <div className="space-y-4">
              <Input
                label="Full Name"
                placeholder="John Doe"
                required
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                placeholder="john@example.com"
                required
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Create a secure password"
                required
                onChange={(e) => setUserData({ ...userData, password: e.target.value })}
              />
            </div>
            
            <Button type="submit" size="lg" className="w-full mt-6">
              Continue →
            </Button>
          </form>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      )}
      
      {step === 'profile' && (
        <div>
          <h2 className="text-2xl font-bold mb-2">Quick Profile Setup</h2>
          <p className="text-gray-600 mb-6">
            Help us understand your background (we'll use this for applications)
          </p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            setStep('review');
          }}>
            <div className="space-y-4">
              <Input
                label="Current/Most Recent Job Title"
                placeholder="e.g., Senior Product Manager"
                required
              />
              
              <Input
                label="Company"
                placeholder="e.g., TechCorp"
                required
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Years of Experience"
                  type="number"
                  placeholder="5"
                  required
                />
                <Input
                  label="Location"
                  placeholder="City, Country"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Top Skills (Select up to 5)
                </label>
                <SkillSelector
                  maxSelections={5}
                  suggestions={getSkillSuggestions(job)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload Resume (Optional)
                </label>
                <FileUpload
                  accept=".pdf,.doc,.docx"
                  onUpload={(file) => {
                    // Auto-parse and pre-fill remaining fields
                    parseResumeAndFill(file);
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  We'll extract your experience automatically
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('auth')}
              >
                ← Back
              </Button>
              <Button type="submit" className="flex-1">
                Review Application →
              </Button>
            </div>
          </form>
        </div>
      )}
      
      {step === 'review' && (
        <div>
          <h2 className="text-2xl font-bold mb-2">Review Your Application</h2>
          <p className="text-gray-600 mb-6">
            Make sure everything looks good before submitting
          </p>
          
          {/* Job Summary */}
          <Card className="mb-6 bg-gray-50">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {job.companyLogo && (
                  <img
                    src={job.companyLogo}
                    alt={job.company}
                    className="w-12 h-12 rounded"
                  />
                )}
                <div>
                  <h3 className="font-bold">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.company}</p>
                  <p className="text-xs text-gray-500">
                    {job.location.city} • {job.jobType}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Application Preview */}
          <Card className="mb-6">
            <CardHeader>
              <h3 className="font-bold">Your Application</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('profile')}
              >
                Edit
              </Button>
            </CardHeader>
            <CardContent>
              <ApplicationPreview userData={userData} />
            </CardContent>
          </Card>
          
          {/* Cover Letter (Optional) */}
          <Card className="mb-6">
            <CardHeader>
              <h3 className="font-bold">Cover Letter (Optional)</h3>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full border rounded-lg p-3 min-h-[120px]"
                placeholder="Write a brief cover letter or let AI generate one for you..."
              />
              <Button variant="ghost" size="sm" className="mt-2">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate with AI
              </Button>
            </CardContent>
          </Card>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep('profile')}
            >
              ← Back
            </Button>
            <Button
              className="flex-1"
              onClick={async () => {
                await submitApplication(job, userData);
                setStep('success');
              }}
            >
              Submit Application
            </Button>
          </div>
        </div>
      )}
      
      {step === 'success' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Application Submitted! 🎉</h2>
          <p className="text-gray-600 mb-6">
            Your application for <strong>{job.title}</strong> at <strong>{job.company}</strong> has been sent.
          </p>
          
          {/* Next Steps */}
          <Card className="mb-6 text-left">
            <CardHeader>
              <h3 className="font-bold">What happens next?</h3>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-blue-600">
                    1
                  </div>
                  <div>
                    <p className="font-medium">We've notified the employer</p>
                    <p className="text-sm text-gray-600">
                      Your Proofile has been sent to {job.company}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-blue-600">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Track your application</p>
                    <p className="text-sm text-gray-600">
                      We'll notify you of any updates via email and dashboard
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-blue-600">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Keep applying</p>
                    <p className="text-sm text-gray-600">
                      We've found {similarJobsCount} similar jobs you might like
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
          
          {/* Actions */}
          <div className="space-y-3">
            <Button
              size="lg"
              variant="primary"
              className="w-full"
              onClick={() => navigate('/dashboard')}
            >
              Go to My Dashboard
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => navigate('/jobs')}
            >
              Browse More Jobs
            </Button>
            
            <Button
              variant="ghost"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 🎯 Conversion Optimization Strategy

### A. Value Proposition Hierarchy

```typescript
// Show benefits at key moments
const conversionTriggers = [
  {
    trigger: 'first_job_view',
    message: 'Create a Proofile to track jobs you\'re interested in',
    priority: 'low',
    action: 'save_job'
  },
  {
    trigger: 'third_job_view',
    message: 'Save time! Create a Proofile to apply to multiple jobs instantly',
    priority: 'medium',
    action: 'quick_apply'
  },
  {
    trigger: 'first_apply_attempt',
    message: 'Apply in 30 seconds with Proofile (vs. 10 min traditional application)',
    priority: 'high',
    action: 'signup_modal'
  },
  {
    trigger: 'return_visit',
    message: 'Welcome back! Create a Proofile to pick up where you left off',
    priority: 'medium',
    action: 'resume_session'
  },
  {
    trigger: 'multiple_searches',
    message: 'Get matched to {count} jobs that fit your profile automatically',
    priority: 'high',
    action: 'auto_match'
  }
];
```

### B. Social Proof Integration

```typescript
// Show real-time activity
const SocialProofBanner = () => (
  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
    <div className="flex items-center gap-3">
      <Users className="w-5 h-5 text-blue-600" />
      <div className="text-sm">
        <strong>2,341 people</strong> applied to jobs today using Proofile
        <span className="text-gray-600 ml-2">
          • Average application time: <strong>45 seconds</strong>
        </span>
      </div>
    </div>
  </div>
);

// Success stories
const SuccessStoryCard = () => (
  <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <img
          src="/testimonial-avatar.jpg"
          alt="Success story"
          className="w-12 h-12 rounded-full"
        />
        <div>
          <p className="text-sm text-gray-700 italic mb-2">
            "I got 3 interview requests within a week of creating my Proofile. 
            The verified profile made employers trust me instantly."
          </p>
          <p className="text-xs font-medium">
            Sarah M. • Product Manager • Hired via Proofile
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);
```

### C. Exit Intent Strategy

```typescript
const ExitIntentModal = () => {
  const [email, setEmail] = useState('');
  
  return (
    <Modal trigger="exit_intent">
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">
          Don't Miss Out on Your Dream Job! 🎯
        </h2>
        
        <p className="text-gray-600 mb-6">
          Get daily job alerts matching your profile sent straight to your inbox
        </p>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          subscribeToAlerts(email);
        }}>
          <div className="flex gap-2 mb-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit">
              Subscribe
            </Button>
          </div>
        </form>
        
        <p className="text-xs text-gray-500">
          No spam. Unsubscribe anytime. 15,000+ professionals already subscribed.
        </p>
        
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm font-medium mb-3">Or create a full Proofile for:</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>One-click applications</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Job tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Smart matching</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Profile verification</span>
            </div>
          </div>
          
          <Button variant="primary" className="w-full mt-4">
            Create Free Proofile
          </Button>
        </div>
      </div>
    </Modal>
  );
};
```

---

## 📊 Analytics & Tracking

### Key Metrics to Track

```typescript
interface JobPortalMetrics {
  // Traffic
  pageViews: number;
  uniqueVisitors: number;
  returningVisitors: number;
  avgSessionDuration: number;
  bounceRate: number;
  
  // Engagement
  searchesPerformed: number;
  jobsViewed: number;
  jobsSaved: number;
  jobsShared: number;
  filtersApplied: number;
  
  // Conversion Funnel
  applyAttempts: number;
  applyModalShown: number;
  appliedViaProofile: number;
  appliedExternal: number;
  signupsFromApply: number;
  
  // Signup Funnel
  signupStarted: number;
  signupCompleted: number;
  signupAbandoned: number;
  signupMethod: {
    google: number;
    linkedin: number;
    email: number;
  };
  
  // Job Board Performance
  jobsBySource: Record<string, {
    posted: number;
    views: number;
    applications: number;
    clickThroughRate: number;
  }>;
  
  // Search Insights
  topSearchTerms: Array<{ term: string; count: number }>;
  topLocations: Array<{ location: string; count: number }>;
  topCategories: Array<{ category: string; count: number }>;
}

// Track user journey
const trackUserJourney = (userId: string) => {
  analytics.track({
    userId,
    events: [
      'page_view',
      'job_search',
      'job_view',
      'job_save',
      'apply_clicked',
      'modal_shown',
      'option_selected',
      'signup_started',
      'signup_completed',
      'application_submitted'
    ]
  });
};

// A/B Testing
const experiments = {
  applyModalDesign: {
    variants: ['option_first', 'proofile_first', 'side_by_side'],
    metric: 'signup_conversion_rate'
  },
  heroMessage: {
    variants: ['all_boards', 'dream_job', 'south_africa_focus'],
    metric: 'engagement_rate'
  },
  ctaPlacement: {
    variants: ['sticky_header', 'in_cards', 'both'],
    metric: 'signup_clicks'
  }
};
```

---

## 🚀 SEO Strategy

### A. URL Structure

```
Domain options:
- jobs.proofile.co (subdomain)
- proofile.co/jobs (subfolder - RECOMMENDED for SEO)

URL patterns:
/jobs                           → All jobs
/jobs/search?q=developer        → Search results
/jobs/category/it               → Category pages
/jobs/location/johannesburg     → Location pages
/jobs/remote                    → Remote jobs
/jobs/{id}/{slug}               → Job detail page
/jobs/company/{company-slug}    → Company pages
```

### B. SEO-Optimized Pages

```typescript
// Job listing page metadata
const generateJobSEO = (job: Job) => ({
  title: `${job.title} at ${job.company} - ${job.location.city} | Proofile Jobs`,
  description: `Apply for ${job.title} position at ${job.company} in ${job.location.city}. ${job.salary ? `Salary: ${job.salary.display}.` : ''} ${job.description.substring(0, 150)}...`,
  keywords: [
    job.title,
    job.company,
    ...job.skills,
    job.location.city,
    job.location.country,
    job.category
  ].join(', '),
  openGraph: {
    title: `${job.title} at ${job.company}`,
    description: job.description.substring(0, 200),
    image: job.companyLogo || '/default-job-og.png',
    type: 'website'
  },
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.postedAt.toISOString(),
    employmentType: job.jobType.toUpperCase(),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
      logo: job.companyLogo
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location.city,
        addressCountry: job.location.country
      }
    },
    baseSalary: job.salary ? {
      '@type': 'MonetaryAmount',
      currency: job.salary.currency,
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.salary.min,
        maxValue: job.salary.max,
        unitText: job.salary.period.toUpperCase()
      }
    } : undefined
  }
});

// Category page metadata
const generateCategorySEO = (category: string, jobCount: number) => ({
  title: `${category} Jobs in South Africa | Proofile`,
  description: `Browse ${jobCount}+ ${category} jobs from all major job boards in South Africa. Find your next ${category} opportunity today.`,
  canonical: `/jobs/category/${slugify(category)}`
});

// Location page metadata
const generateLocationSEO = (location: string, jobCount: number) => ({
  title: `Jobs in ${location}, South Africa | Proofile`,
  description: `Discover ${jobCount}+ job opportunities in ${location}. Search across all major job boards in one place.`,
  canonical: `/jobs/location/${slugify(location)}`
});
```

### C. Content Strategy

```typescript
// Blog/Resources Section
const contentPages = [
  {
    slug: '/blog/job-search-tips-south-africa',
    title: 'Ultimate Job Search Guide for South Africa 2024',
    purpose: 'Rank for "job search tips south africa"'
  },
  {
    slug: '/blog/cv-writing-guide',
    title: 'How to Write a CV That Gets Interviews',
    purpose: 'Rank for "cv writing guide"'
  },
  {
    slug: '/blog/salary-guide-south-africa',
    title: 'South African Salary Guide by Industry',
    purpose: 'Rank for "salary south africa"'
  },
  {
    slug: '/blog/interview-tips',
    title: '20 Interview Questions and How to Answer Them',
    purpose: 'Rank for "interview tips"'
  },
  {
    slug: '/blog/remote-work-south-africa',
    title: 'Complete Guide to Remote Work in South Africa',
    purpose: 'Rank for "remote work south africa"'
  }
];
```

---

## 🎯 Growth Strategy

### Phase 1: Launch (Month 1)

```markdown
**Goal:** Get first 10,000 visitors

1. **SEO Foundation**
   - Submit sitemap to Google
   - Ensure all job pages indexed
   - Optimize for "jobs south africa"
   - Target long-tail keywords

2. **Content Marketing**
   - Publish 10 SEO-optimized blog posts
   - Create ultimate job search guide
   - Share on social media

3. **Community Outreach**
   - Post on r/southafrica
   - Share in Facebook job groups
   - Engage with Twitter job seekers
   - Partner with university career centers

4. **Word of Mouth**
   - Referral program: "Share and earn"
   - Social sharing incentives
   - Viral job alerts
```

### Phase 2: Growth (Month 2-3)

```markdown
**Goal:** Reach 50,000 monthly visitors

1. **Paid Advertising**
   - Google Ads: "jobs south africa" keywords
   - Facebook/Instagram ads targeting job seekers
   - LinkedIn sponsored content

2. **Partnerships**
   - Partner with recruitment agencies
   - Collaborate with job boards
   - University partnerships

3. **Content Expansion**
   - Industry-specific job guides
   - Company profiles
   - Salary reports
   - Interview prep resources

4. **Email Marketing**
   - Daily job alerts
   - Weekly newsletter
   - Personalized recommendations
```

### Phase 3: Scale (Month 4-6)

```markdown
**Goal:** 200,000+ monthly visitors, 10,000 Proofile signups

1. **Brand Building**
   - PR campaign
   - Success stories
   - Employer testimonials
   - Media coverage

2. **Product Expansion**
   - Mobile app launch
   - Advanced matching algorithm
   - Company reviews
   - Salary comparison tool

3. **Network Effects**
   - Referral bonuses
   - Social proof badges
   - Leaderboards
   - Community features

4. **Enterprise Sales**
   - Direct employer postings
   - Featured listings
   - Recruitment analytics
   - ATS integration
```

---

## 💰 Monetization Strategy

### Revenue Streams

```typescript
interface RevenueModel {
  // Primary: Proofile Subscriptions
  proofileSubscriptions: {
    free: 0,
    pro: 9, // per month
    verified: 19 // per month
  };
  
  // Secondary: Employer Services
  employerServices: {
    jobPostings: {
      basic: 49, // per posting, 30 days
      featured: 199, // per posting, 30 days, top placement
      unlimited: 499 //# 🚀 Proofile Jobs Portal
## Public Gateway & Aggregator Strategy

**Version:** 1.0  
**Date:** December 2024  
**Purpose:** Free job aggregator as primary growth engine

---

## 🎯 Core Strategy Overview

### The Hook: Free Job Aggregator

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  PUBLIC LANDING PAGE: proofile.co or jobs.proofile.co     │
│  (No login required - 100% free and open)                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  🔍 Search 50,000+ Jobs from All Major Boards          │ │
│  │  [Search: Job title, skills, company...          🔎]  │ │
│  │  [Location: City, Remote, Worldwide             📍]  │ │
│  │                                                         │ │
│  │  Latest Jobs Posted:                                   │ │
│  │  • Senior Developer @ Google - $120K-150K (1 hr ago)  │ │
│  │  • Product Manager @ Meta - Remote (2 hrs ago)        │ │
│  │  • UX Designer @ Shopify - $90K-110K (3 hrs ago)      │ │
│  │  ... (50+ visible without scrolling)                  │ │
│  │                                                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
        User searches/browses (NO SIGNUP REQUIRED)
                           ↓
                  Views job details
                           ↓
              Clicks "Apply" on any job
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  OPTIONAL (NON-BLOCKING) PROOFILE PITCH                     │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  ⚡ Apply Faster with Proofile                        │ │
│  │                                                         │ │
│  │  ✅ One-click applications to all jobs                 │ │
│  │  ✅ Get matched to 1000s of jobs automatically         │ │
│  │  ✅ Track all applications in one place                │ │
│  │  ✅ Let opportunities find YOU                          │ │
│  │                                                         │ │
│  │  [Create Free Proofile - 2 min]  [Skip, Apply Now →] │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Either choice works - NO BLOCKING                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Principle:** Give value FIRST, ask for signup LATER (and optionally)

---

## 🏗️ Technical Architecture

### 1. Job Aggregation System

```typescript
interface JobSource {
  id: string;
  name: string;
  url: string;
  type: 'api' | 'scraper';
  frequency: 'realtime' | 'hourly' | 'daily';
  enabled: boolean;
}

// South African Sources
const southAfricanSources: JobSource[] = [
  {
    id: 'pnet',
    name: 'PNet',
    url: 'https://www.pnet.co.za',
    type: 'scraper',
    frequency: 'hourly',
    enabled: true
  },
  {
    id: 'careers24',
    name: 'Careers24',
    url: 'https://www.careers24.com',
    type: 'scraper',
    frequency: 'hourly',
    enabled: true
  },
  {
    id: 'indeed_za',
    name: 'Indeed South Africa',
    url: 'https://za.indeed.com',
    type: 'scraper',
    frequency: 'hourly',
    enabled: true
  },
  {
    id: 'career_junction',
    name: 'CareerJunction',
    url: 'https://www.careerjunction.co.za',
    type: 'scraper',
    frequency: 'hourly',
    enabled: true
  },
  {
    id: 'job_mail',
    name: 'JobMail',
    url: 'https://www.jobmail.co.za',
    type: 'scraper',
    frequency: 'hourly',
    enabled: true
  },
  {
    id: 'gumtree_jobs',
    name: 'Gumtree Jobs',
    url: 'https://www.gumtree.co.za/jobs',
    type: 'scraper',
    frequency: 'daily',
    enabled: true
  }
];

// International Sources
const internationalSources: JobSource[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn Jobs',
    url: 'https://www.linkedin.com/jobs',
    type: 'scraper',
    frequency: 'hourly',
    enabled: true
  },
  {
    id: 'indeed_global',
    name: 'Indeed',
    url: 'https://www.indeed.com',
    type: 'scraper',
    frequency: 'hourly',
    enabled: true
  },
  {
    id: 'glassdoor',
    name: 'Glassdoor',
    url: 'https://www.glassdoor.com',
    type: 'scraper',
    frequency: 'hourly',
    enabled: true
  },
  {
    id: 'remote_ok',
    name: 'Remote OK',
    url: 'https://remoteok.com',
    type: 'api',
    frequency: 'realtime',
    enabled: true
  },
  {
    id: 'we_work_remotely',
    name: 'We Work Remotely',
    url: 'https://weworkremotely.com',
    type: 'scraper',
    frequency: 'daily',
    enabled: true
  }
];
```

### 2. Job Schema (Unified)

```typescript
interface Job {
  // Identity
  id: string;                          // Our internal ID
  externalId: string;                  // Source's ID
  source: string;                      // 'pnet', 'linkedin', etc.
  sourceUrl: string;                   // Direct link to original posting
  
  // Basic Info
  title: string;
  company: string;
  companyLogo?: string;
  
  // Location
  location: {
    city?: string;
    province?: string;
    country: string;
    remote: boolean;
    hybrid: boolean;
  };
  
  // Details
  description: string;                 // Full job description
  requirements: string[];              // Extracted requirements
  responsibilities: string[];          // Key responsibilities
  
  // Compensation
  salary?: {
    min?: number;
    max?: number;
    currency: string;
    period: 'hour' | 'month' | 'year';
    display: string;                   // "R50K - R80K per month"
  };
  
  // Classification
  category: string;                    // 'IT', 'Finance', 'Marketing', etc.
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  
  // Skills & Tags
  skills: string[];                    // Extracted skills
  tags: string[];                      // General tags
  
  // Metadata
  postedAt: Date;                      // When posted on source
  scrapedAt: Date;                     // When we found it
  expiresAt?: Date;                    // When it expires
  
  // Application
  applicationUrl?: string;             // Direct apply URL
  applicationEmail?: string;           // Apply via email
  applicationMethod: 'url' | 'email' | 'platform' | 'unknown';
  
  // Quality & Status
  verified: boolean;                   // Verified by us as legit
  featured: boolean;                   // Paid featured listing
  active: boolean;                     // Still accepting applications
  
  // Analytics
  views: number;
  applications: number;
  clicks: number;
}
```

### 3. Scraping Pipeline

```typescript
class JobScraper {
  private sources: JobSource[];
  private queue: JobQueue;
  
  async scrapeAll() {
    for (const source of this.sources) {
      if (!source.enabled) continue;
      
      try {
        await this.queue.add('scrape_source', {
          sourceId: source.id,
          url: source.url
        });
      } catch (error) {
        console.error(`Failed to queue ${source.name}:`, error);
      }
    }
  }
  
  async scrapeSource(source: JobSource): Promise<Job[]> {
    // Different scraper for each source
    const scraper = this.getScraperForSource(source);
    
    // Fetch jobs
    const rawJobs = await scraper.scrape();
    
    // Normalize to our schema
    const normalizedJobs = rawJobs.map(job => 
      this.normalizeJob(job, source)
    );
    
    // Deduplicate
    const uniqueJobs = await this.deduplicateJobs(normalizedJobs);
    
    // Enrich with AI
    const enrichedJobs = await this.enrichJobs(uniqueJobs);
    
    // Save to database
    await this.saveJobs(enrichedJobs);
    
    return enrichedJobs;
  }
  
  private async enrichJobs(jobs: Job[]): Promise<Job[]> {
    return Promise.all(jobs.map(async job => {
      // Extract skills from description using AI
      const skills = await this.extractSkills(job.description);
      
      // Categorize job
      const category = await this.categorizeJob(job);
      
      // Determine experience level
      const experienceLevel = await this.determineLevel(job);
      
      // Extract salary if in description
      const salary = this.extractSalary(job.description);
      
      return {
        ...job,
        skills,
        category,
        experienceLevel,
        salary: salary || job.salary
      };
    }));
  }
}
```

### 4. Deduplication System

```typescript
class JobDeduplicator {
  async findDuplicates(job: Job): Promise<Job[]> {
    // Check by exact external ID
    const exactMatch = await this.findByExternalId(
      job.externalId, 
      job.source
    );
    if (exactMatch) return [exactMatch];
    
    // Check by similarity
    const similar = await this.findSimilar(job);
    
    return similar;
  }
  
  private async findSimilar(job: Job): Promise<Job[]> {
    // Use multiple signals
    const candidates = await db.jobs.find({
      company: job.company,
      postedAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    });
    
    return candidates.filter(candidate => {
      // Title similarity
      const titleSim = this.similarity(job.title, candidate.title);
      
      // Location match
      const locationMatch = job.location.city === candidate.location.city;
      
      // High confidence if title >80% similar and location matches
      return titleSim > 0.8 && locationMatch;
    });
  }
  
  private similarity(str1: string, str2: string): number {
    // Levenshtein distance or use AI embeddings
    const embedding1 = await this.getEmbedding(str1);
    const embedding2 = await this.getEmbedding(str2);
    return this.cosineSimilarity(embedding1, embedding2);
  }
}
```

---

## 🎨 Public Portal UI/UX

### A. Homepage Layout

```typescript
// Route: / or jobs.proofile.co
const Homepage = () => {
  return (
    <div className="min-h-screen">
      {/* Header - Clean & Simple */}
      <header className="sticky top-0 bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Logo />
              <span className="text-sm text-gray-600">
                50,000+ Jobs from All Boards
              </span>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button variant="primary" onClick={() => navigate('/signup')}>
                Create Proofile
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Search Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">
              Find Your Dream Job in South Africa
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Search across all major job boards in one place. Free. Forever.
            </p>
            
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-lg p-2">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Job title, skills, or company..."
                    className="w-full px-4 py-3 pl-12 rounded-lg border-0 focus:ring-2"
                  />
                  <Search className="absolute left-4 top-4 text-gray-400" />
                </div>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="City, province, or remote..."
                    className="w-full px-4 py-3 pl-12 rounded-lg border-0 focus:ring-2"
                  />
                  <MapPin className="absolute left-4 top-4 text-gray-400" />
                </div>
                
                <Button size="lg" className="px-8">
                  Search Jobs
                </Button>
              </div>
              
              {/* Quick Filters */}
              <div className="flex gap-2 mt-4 flex-wrap">
                <Badge variant="outline">Remote</Badge>
                <Badge variant="outline">Full-time</Badge>
                <Badge variant="outline">Entry Level</Badge>
                <Badge variant="outline">R50K+</Badge>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex justify-center gap-8 mt-8 text-sm text-gray-600">
              <div>
                <strong className="text-2xl text-black block">52,341</strong>
                Active Jobs
              </div>
              <div>
                <strong className="text-2xl text-black block">234</strong>
                Posted Today
              </div>
              <div>
                <strong className="text-2xl text-black block">15+</strong>
                Job Boards
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Job Listings */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Filters Sidebar (Desktop) */}
          <div className="flex gap-8">
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <FilterSidebar />
              </div>
            </aside>
            
            {/* Job Cards */}
            <main className="flex-1">
              {/* Sort & View Options */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-gray-600">
                  Showing <strong>2,451</strong> jobs
                </div>
                <div className="flex items-center gap-4">
                  <select className="border rounded-lg px-4 py-2">
                    <option>Most Recent</option>
                    <option>Most Relevant</option>
                    <option>Highest Salary</option>
                  </select>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" icon={Grid} />
                    <Button variant="ghost" size="sm" icon={List} />
                  </div>
                </div>
              </div>
              
              {/* Job Cards Grid */}
              <div className="grid grid-cols-1 gap-4">
                <JobCard job={job1} />
                <JobCard job={job2} />
                <JobCard job={job3} />
                {/* ... more jobs */}
              </div>
              
              {/* Load More */}
              <div className="mt-8 text-center">
                <Button variant="outline" size="lg">
                  Load More Jobs
                </Button>
              </div>
            </main>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Stop Missing Opportunities
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Create your Proofile and let jobs find you automatically
          </p>
          <Button size="lg" variant="white" className="px-8">
            Create Free Proofile →
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};
```

### B. Job Card Component

```typescript
interface JobCardProps {
  job: Job;
  variant?: 'compact' | 'detailed';
}

const JobCard = ({ job, variant = 'compact' }: JobCardProps) => {
  return (
    <article className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex gap-4">
        {/* Company Logo */}
        {job.companyLogo && (
          <div className="shrink-0">
            <img
              src={job.companyLogo}
              alt={job.company}
              className="w-16 h-16 rounded-lg object-cover"
            />
          </div>
        )}
        
        {/* Job Info */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {job.title}
              </h3>
              <p className="text-gray-600 flex items-center gap-2">
                <Building className="w-4 h-4" />
                {job.company}
              </p>
            </div>
            
            {/* Save Button */}
            <button className="shrink-0 p-2 hover:bg-gray-100 rounded-lg">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
          
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {job.location.city}, {job.location.country}
              {job.location.remote && <Badge variant="success" size="sm">Remote OK</Badge>}
            </span>
            
            {job.salary && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {job.salary.display}
              </span>
            )}
            
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTimeAgo(job.postedAt)}
            </span>
            
            <span className="flex items-center gap-1 text-xs">
              <ExternalLink className="w-3 h-3" />
              {job.source}
            </span>
          </div>
          
          {/* Skills/Tags */}
          {job.skills && job.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {job.skills.slice(0, 5).map(skill => (
                <Badge key={skill} variant="secondary" size="sm">
                  {skill}
                </Badge>
              ))}
              {job.skills.length > 5 && (
                <Badge variant="outline" size="sm">
                  +{job.skills.length - 5} more
                </Badge>
              )}
            </div>
          )}
          
          {/* Description Preview */}
          {variant === 'detailed' && (
            <p className="text-gray-600 mb-4 line-clamp-3">
              {job.description}
            </p>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => handleApply(job)}
            >
              Apply Now
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/jobs/${job.id}`)}
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};
```

### C. Job Details Page

```typescript
// Route: /jobs/:id
const JobDetailsPage = ({ jobId }: { jobId: string }) => {
  const job = useJob(jobId);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </button>
          
          {/* Job Header Card */}
          <Card className="mb-6">
            <div className="flex gap-6 p-8">
              {job.companyLogo && (
                <img
                  src={job.companyLogo}
                  alt={job.company}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              )}
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      {job.title}
                    </h1>
                    <p className="text-xl text-gray-600">
                      {job.company}
                    </p>
                  </div>
                  
                  {job.verified && (
                    <Badge variant="success" size="lg">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                {/* Quick Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <InfoItem
                    icon={MapPin}
                    label="Location"
                    value={`${job.location.city}, ${job.location.country}`}
                  />
                  <InfoItem
                    icon={Briefcase}
                    label="Job Type"
                    value={job.jobType}
                  />
                  <InfoItem
                    icon={Clock}
                    label="Posted"
                    value={formatTimeAgo(job.postedAt)}
                  />
                  {job.salary && (
                    <InfoItem
                      icon={DollarSign}
                      label="Salary"
                      value={job.salary.display}
                    />
                  )}
                </div>
                
                {/* Apply Button (Prominent) */}
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    variant="primary"
                    className="px-8"
                    onClick={() => handleApply(job)}
                  >
                    Apply for this Job
                  </Button>
                  <Button size="lg" variant="outline">
                    <Bookmark className="w-5 h-5 mr-2" />
                    Save Job
                  </Button>
                  <Button size="lg" variant="ghost">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Job Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-bold">Job Description</h2>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.description }}
                  />
                </CardContent>
              </Card>
              
              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <Card>
                  <CardHeader>
                    <h2 className="text-2xl font-bold">Requirements</h2>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {job.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              
              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <h2 className="text-2xl font-bold">Required Skills</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map(skill => (
                        <Badge key={skill} variant="secondary" size="lg">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Apply CTA (Sticky) */}
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <Button
                    size="lg"
                    variant="primary"
                    className="w-full mb-4"
                    onClick={() => handleApply(job)}
                  >
                    Apply Now
                  </Button>
                  
                  <div className="text-sm text-gray-600 space-y-2">
                    <p className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <strong>{job.applications}</strong> applications
                    </p>
                    <p className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <strong>{job.views}</strong> views
                    </p>
                  </div>
                  
                  <hr className="my-4" />
                  
                  <div className="text-xs text-gray-500">
                    <p className="flex items-center gap-1 mb-1">
                      <ExternalLink className="w-3 h-3" />
                      Originally posted on {job.source}
                    </p>
                    <a 
                      href={job.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View original posting →
                    </a>
                  </div>
                </CardContent>
              </Card>
              
              {/* Similar Jobs */}
              <Card>
                <CardHeader>
                  <h3 className="font-bold">Similar Jobs</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <SimilarJobCard job={similarJob1} />
                    <SimilarJobCard job={similarJob2} />
                    <SimilarJobCard job={similarJob3} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};
```

---

## 🎯 Application Flow (The Conversion Moment)

### Apply Modal (Non-Blocking)

```typescript
const ApplyModal = ({ job, onClose }: { job: Job; onClose: () => void }) => {
  const [step, setStep] = useState<'choice' | 'quick' | 'external'>('choice');
  
  return (
    <Modal open onClose={onClose} size="lg">
      {step === 'choice' && (
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6">
            How would you like to apply?
          </h2>
          
          {/* Option 1: Quick Apply with Proofile */}
          <div className="border-2 border-blue-500 rounded-lg p-6 mb-4 bg-blue-50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12