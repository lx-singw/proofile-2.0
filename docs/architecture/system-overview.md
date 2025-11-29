# Proofile - Complete Directory Structure

```
proofile-vocational/
├── README.md
├── .gitignore
├── .env.example
├── docker-compose.yml
├── docker-compose.prod.yml
├── Makefile
└── setup-dev.sh

# Backend Services
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI application entry point
│   │   │
│   │   ├── api/                        # API routes
│   │   │   ├── __init__.py
│   │   │   ├── deps.py                 # API dependencies
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── api.py              # Main API router
│   │   │       ├── auth.py             # Authentication endpoints
│   │   │       ├── profiles.py         # Profile management endpoints
│   │   │       ├── jobs.py             # Job opportunities endpoints
│   │   │       ├── applications.py     # Application tracking endpoints
│   │   │       ├── verification.py     # Verification endpoints
│   │   │       ├── seta.py             # SETA integration endpoints
│   │   │       ├── employers.py        # Employer dashboard endpoints
│   │   │       ├── analytics.py        # Analytics and reporting endpoints
│   │   │       └── webhooks.py         # WhatsApp and external webhooks
│   │   │
│   │   ├── core/                       # Core functionality
│   │   │   ├── __init__.py
│   │   │   ├── config.py               # Configuration settings
│   │   │   ├── security.py             # Authentication & authorization
│   │   │   ├── database.py             # Database connection & session
│   │   │   ├── cache.py                # Redis caching service
│   │   │   ├── monitoring.py           # Metrics and observability
│   │   │   ├── alerts.py               # Error tracking and alerting
│   │   │   └── exceptions.py           # Custom exception handlers
│   │   │
│   │   ├── models/                     # SQLAlchemy models
│   │   │   ├── __init__.py
│   │   │   ├── base.py                 # Base model class
│   │   │   ├── user.py                 # User authentication model
│   │   │   ├── profile.py              # Vocational profile model
│   │   │   ├── job.py                  # Job opportunities model
│   │   │   ├── application.py          # Job applications model
│   │   │   ├── verification.py         # Skills verification model
│   │   │   ├── employer.py             # Employer profile model
│   │   │   ├── training_provider.py    # Training provider model
│   │   │   └── analytics.py            # Analytics and metrics models
│   │   │
│   │   ├── schemas/                    # Pydantic schemas
│   │   │   ├── __init__.py
│   │   │   ├── user.py                 # User schemas
│   │   │   ├── profile.py              # Profile schemas
│   │   │   ├── job.py                  # Job schemas
│   │   │   ├── application.py          # Application schemas
│   │   │   ├── verification.py         # Verification schemas
│   │   │   ├── employer.py             # Employer schemas
│   │   │   └── analytics.py            # Analytics schemas
│   │   │
│   │   ├── services/                   # Business logic services
│   │   │   ├── __init__.py
│   │   │   ├── ai_service.py           # OpenAI integration
│   │   │   ├── embeddings_service.py   # Vector embeddings
│   │   │   ├── seta_service.py         # SETA database integration
│   │   │   ├── whatsapp_service.py     # WhatsApp Business API
│   │   │   ├── verification_service.py # Verification workflows
│   │   │   ├── job_matching_service.py # Job matching algorithms
│   │   │   ├── blockchain_service.py   # Blockchain verification
│   │   │   ├── analytics_service.py    # Business intelligence
│   │   │   ├── dashboard_service.py    # Dashboard metrics
│   │   │   └── notification_service.py # Multi-channel notifications
│   │   │
│   │   ├── utils/                      # Utility functions
│   │   │   ├── __init__.py
│   │   │   ├── security.py             # Security utilities
│   │   │   ├── validators.py           # Data validation
│   │   │   ├── formatters.py           # Data formatting
│   │   │   ├── file_utils.py           # File handling
│   │   │   └── constants.py            # Application constants
│   │   │
│   │   └── tasks/                      # Background tasks (Celery)
│   │       ├── __init__.py
│   │       ├── verification_tasks.py   # SETA verification tasks
│   │       ├── matching_tasks.py       # Job matching tasks
│   │       ├── notification_tasks.py   # Notification tasks
│   │       └── analytics_tasks.py      # Analytics processing tasks
│   │
│   ├── alembic/                        # Database migrations
│   │   ├── versions/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── alembic.ini
│   │
│   ├── tests/                          # Backend tests
│   │   ├── __init__.py
│   │   ├── conftest.py                 # Test configuration
│   │   ├── test_main.py                # Main app tests
│   │   ├── test_auth.py                # Authentication tests
│   │   ├── test_profiles.py            # Profile management tests
│   │   ├── test_seta_integration.py    # SETA API tests
│   │   ├── test_job_matching.py        # Job matching tests
│   │   ├── test_verification.py        # Verification workflow tests
│   │   ├── test_whatsapp.py            # WhatsApp integration tests
│   │   └── integration/                # Integration tests
│   │       ├── test_complete_workflow.py
│   │       └── test_performance.py
│   │
│   ├── scripts/                        # Utility scripts
│   │   ├── init_db.py                  # Database initialization
│   │   ├── seed_data.py                # Test data seeding
│   │   ├── migrate_legacy.py           # Legacy data migration
│   │   └── backup_restore.py           # Backup utilities
│   │
│   ├── requirements.txt                # Production dependencies
│   ├── requirements-dev.txt            # Development dependencies
│   ├── Dockerfile
│   ├── .dockerignore
│   └── pyproject.toml                  # Python project configuration

# Frontend Web Application
├── frontend/
│   ├── app/                            # Next.js 14 app directory
│   │   ├── layout.tsx                  # Root layout
│   │   ├── page.tsx                    # Home page
│   │   ├── providers.tsx               # App providers
│   │   ├── globals.css                 # Global styles
│   │   │
│   │   ├── (auth)/                     # Authentication pages
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── profile/                    # Profile management
│   │   │   ├── page.tsx                # Profile overview
│   │   │   ├── edit/
│   │   │   │   └── page.tsx
│   │   │   ├── skills/
│   │   │   │   └── page.tsx
│   │   │   ├── verification/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Public profile view
│   │   │
│   │   ├── jobs/                       # Job opportunities
│   │   │   ├── page.tsx                # Job listings
│   │   │   ├── search/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Job details
│   │   │
│   │   ├── applications/               # Application tracking
│   │   │   ├── page.tsx                # Applications list
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Application details
│   │   │
│   │   ├── employer/                   # Employer dashboard
│   │   │   ├── page.tsx                # Dashboard overview
│   │   │   ├── candidates/
│   │   │   │   └── page.tsx
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx
│   │   │   │   └── create/
│   │   │   │       └── page.tsx
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   │
│   │   ├── seta/                       # SETA dashboard
│   │   │   ├── page.tsx                # SETA overview
│   │   │   ├── graduates/
│   │   │   │   └── page.tsx
│   │   │   ├── outcomes/
│   │   │   │   └── page.tsx
│   │   │   └── reports/
│   │   │       └── page.tsx
│   │   │
│   │   └── api/                        # API routes
│   │       ├── auth/
│   │       │   └── route.ts
│   │       ├── profiles/
│   │       │   └── route.ts
│   │       ├── upload/
│   │       │   └── route.ts
│   │       └── webhooks/
│   │           └── whatsapp/
│   │               └── route.ts
│   │
│   ├── components/                     # Reusable components
│   │   ├── ui/                         # Base UI components (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── dropdown.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── forms/                      # Form components
│   │   │   ├── ProfileBuilder.tsx      # Multi-step profile builder
│   │   │   ├── SkillsInput.tsx         # Skills input component
│   │   │   ├── EvidenceUploader.tsx    # File upload component
│   │   │   ├── JobSearchForm.tsx       # Job search filters
│   │   │   └── VerificationRequest.tsx # Verification request form
│   │   │
│   │   ├── dashboard/                  # Dashboard components
│   │   │   ├── MetricsCard.tsx         # Metric display card
│   │   │   ├── AnalyticsChart.tsx      # Chart components
│   │   │   ├── SETADashboard.tsx       # SETA reporting dashboard
│   │   │   ├── EmployerDashboard.tsx   # Employer dashboard
│   │   │   └── GraduateDashboard.tsx   # Graduate dashboard
│   │   │
│   │   ├── profile/                    # Profile-related components
│   │   │   ├── ProfileCard.tsx         # Profile display card
│   │   │   ├── SkillsPortfolio.tsx     # Skills showcase
│   │   │   ├── VerificationBadges.tsx  # Verification status
│   │   │   └── TrustScore.tsx          # Trust score display
│   │   │
│   │   ├── jobs/                       # Job-related components
│   │   │   ├── JobCard.tsx             # Job listing card
│   │   │   ├── JobMatchScore.tsx       # Match percentage display
│   │   │   ├── ApplicationStatus.tsx   # Application tracking
│   │   │   └── RecommendedJobs.tsx     # Job recommendations
│   │   │
│   │   └── layout/                     # Layout components
│   │       ├── Header.tsx              # Navigation header
│   │       ├── Sidebar.tsx             # Dashboard sidebar
│   │       ├── Footer.tsx              # Site footer
│   │       └── MobileNav.tsx           # Mobile navigation
│   │
│   ├── lib/                            # Utility libraries
│   │   ├── api.ts                      # API client configuration
│   │   ├── auth.ts                     # Authentication utilities
│   │   ├── utils.ts                    # General utilities
│   │   ├── validations.ts              # Form validations (Zod)
│   │   ├── constants.ts                # Frontend constants
│   │   └── hooks/                      # Custom React hooks
│   │       ├── useAuth.ts              # Authentication hook
│   │       ├── useProfile.ts           # Profile management hook
│   │       ├── useJobs.ts              # Job search hook
│   │       └── useAnalytics.ts         # Analytics hook
│   │
│   ├── styles/                         # Styling
│   │   ├── globals.css                 # Global Tailwind styles
│   │   └── components.css              # Component-specific styles
│   │
│   ├── public/                         # Static assets
│   │   ├── images/
│   │   ├── icons/
│   │   ├── logos/
│   │   └── favicon.ico
│   │
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── .eslintrc.json
│   ├── .prettierrc
│   └── Dockerfile

# Mobile Application
├── mobile/
│   ├── ProofileVocationalApp/
│   │   ├── android/                    # Android-specific files
│   │   ├── ios/                        # iOS-specific files
│   │   │
│   │   ├── src/
│   │   │   ├── components/             # React Native components
│   │   │   │   ├── common/             # Common components
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Card.tsx
│   │   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── profile/            # Profile components
│   │   │   │   │   ├── OfflineProfileBuilder.tsx
│   │   │   │   │   ├── SkillsCamera.tsx    # Camera for skills evidence
│   │   │   │   │   ├── EvidenceGallery.tsx # Evidence viewing
│   │   │   │   │   └── ProfilePreview.tsx
│   │   │   │   │
│   │   │   │   ├── jobs/               # Job components
│   │   │   │   │   ├── JobSwipeCard.tsx    # Tinder-style job swiping
│   │   │   │   │   ├── JobNotifications.tsx
│   │   │   │   │   └── ApplicationTracker.tsx
│   │   │   │   │
│   │   │   │   └── verification/       # Verification components
│   │   │   │       ├── DocumentScanner.tsx
│   │   │   │       ├── VideoRecorder.tsx
│   │   │       └── VerificationProgress.tsx
│   │   │   │
│   │   │   ├── screens/                # Screen components
│   │   │   │   ├── auth/               # Authentication screens
│   │   │   │   │   ├── LoginScreen.tsx
│   │   │   │   │   ├── RegisterScreen.tsx
│   │   │   │   │   └── OnboardingScreen.tsx
│   │   │   │   │
│   │   │   │   ├── profile/            # Profile screens
│   │   │   │   │   ├── ProfileScreen.tsx
│   │   │   │   │   ├── EditProfileScreen.tsx
│   │   │   │   │   ├── SkillsScreen.tsx
│   │   │   │   │   └── VerificationScreen.tsx
│   │   │   │   │
│   │   │   │   ├── jobs/               # Job screens
│   │   │   │   │   ├── JobsScreen.tsx
│   │   │   │   │   ├── JobDetailsScreen.tsx
│   │   │   │   │   └── ApplicationsScreen.tsx
│   │   │   │   │
│   │   │   │   └── dashboard/          # Dashboard screens
│   │   │   │       ├── HomeScreen.tsx
│   │   │   │       ├── ProgressScreen.tsx
│   │   │   │       └── SettingsScreen.tsx
│   │   │   │
│   │   │   ├── navigation/             # Navigation configuration
│   │   │   │   ├── AppNavigator.tsx    # Main navigator
│   │   │   │   ├── AuthNavigator.tsx   # Auth flow navigator
│   │   │   │   └── TabNavigator.tsx    # Bottom tab navigator
│   │   │   │
│   │   │   ├── services/               # Mobile services
│   │   │   │   ├── api.ts              # API client
│   │   │   │   ├── auth.ts             # Authentication
│   │   │   │   ├── storage.ts          # Offline storage (MMKV)
│   │   │   │   ├── camera.ts           # Camera utilities
│   │   │   │   ├── notifications.ts    # Push notifications
│   │   │   │   └── sync.ts             # Data synchronization
│   │   │   │
│   │   │   ├── hooks/                  # Custom hooks
│   │   │   │   ├── useOfflineStorage.ts
│   │   │   │   ├── useNetworkStatus.ts
│   │   │   │   ├── useCamera.ts
│   │   │   │   └── useSync.ts
│   │   │   │
│   │   │   ├── utils/                  # Utility functions
│   │   │   │   ├── constants.ts
│   │   │   │   ├── helpers.ts
│   │   │   │   ├── validations.ts
│   │   │   │   └── formatters.ts
│   │   │   │
│   │   │   └── types/                  # TypeScript type definitions
│   │   │       ├── api.ts
│   │   │       ├── navigation.ts
│   │   │       └── profile.ts
│   │   │
│   │   ├── package.json
│   │   ├── metro.config.js
│   │   ├── babel.config.js
│   │   ├── tsconfig.json
│   │   └── react-native.config.js
│   │
│   └── docs/                           # Mobile app documentation
│       ├── SETUP.md
│       ├── DEPLOYMENT.md
│       └── TROUBLESHOOTING.md

# Infrastructure & DevOps
├── infrastructure/
│   ├── terraform/                      # Infrastructure as Code
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   │   ├── main.tf
│   │   │   │   ├── variables.tf
│   │   │   │   └── terraform.tfvars
│   │   │   ├── staging/
│   │   │   │   ├── main.tf
│   │   │   │   ├── variables.tf
│   │   │   │   └── terraform.tfvars
│   │   │   └── production/
│   │   │       ├── main.tf
│   │   │       ├── variables.tf
│   │   │       └── terraform.tfvars
│   │   │
│   │   ├── modules/                    # Terraform modules
│   │   │   ├── vpc/
│   │   │   │   ├── main.tf
│   │   │   │   ├── variables.tf
│   │   │   │   └── outputs.tf
│   │   │   ├── rds/
│   │   │   │   ├── main.tf
│   │   │   │   ├── variables.tf
│   │   │   │   └── outputs.tf
│   │   │   ├── eks/
│   │   │   │   ├── main.tf
│   │   │   │   ├── variables.tf
│   │   │   │   └── outputs.tf
│   │   │   └── elasticache/
│   │   │       ├── main.tf
│   │   │       ├── variables.tf
│   │   │       └── outputs.tf
│   │   │
│   │   └── scripts/
│   │       ├── deploy.sh
│   │       ├── rollback.sh
│   │       └── backup.sh
│   │
│   ├── kubernetes/                     # Kubernetes configurations
│   │   ├── namespaces/
│   │   │   ├── dev.yaml
│   │   │   ├── staging.yaml
│   │   │   └── production.yaml
│   │   │
│   │   ├── applications/
│   │   │   ├── backend-deployment.yaml
│   │   │   ├── backend-service.yaml
│   │   │   ├── frontend-deployment.yaml
│   │   │   ├── frontend-service.yaml
│   │   │   ├── redis-deployment.yaml
│   │   │   ├── redis-service.yaml
│   │   │   └── ingress.yaml
│   │   │
│   │   ├── configmaps/
│   │   │   ├── app-config.yaml
│   │   │   └── nginx-config.yaml
│   │   │
│   │   ├── secrets/
│   │   │   ├── app-secrets.yaml
│   │   │   └── db-secrets.yaml
│   │   │
│   │   └── monitoring/
│   │       ├── prometheus.yaml
│   │       ├── grafana.yaml
│   │       └── alertmanager.yaml
│   │
│   ├── docker/                         # Docker configurations
│   │   ├── backend/
│   │   │   ├── Dockerfile
│   │   │   ├── Dockerfile.prod
│   │   │   └── .dockerignore
│   │   ├── frontend/
│   │   │   ├── Dockerfile
│   │   │   ├── Dockerfile.prod
│   │   │   └── .dockerignore
│   │   └── nginx/
│   │       ├── Dockerfile
│   │       └── nginx.conf
│   │
│   └── monitoring/                     # Monitoring configurations
│       ├── prometheus/
│       │   ├── prometheus.yml
│       │   └── rules.yml
│       ├── grafana/
│       │   ├── dashboards/
│       │   │   ├── application.json
│       │   │   ├── infrastructure.json
│       │   │   └── business-metrics.json
│       │   └── provisioning/
│       │       ├── dashboards.yml
│       │       └── datasources.yml
│       └── loki/
│           └── loki.yaml

# Smart Contracts (Phase 2)
├── blockchain/
│   ├── contracts/                      # Solidity contracts
│   │   ├── CredentialVerification.sol  # Main verification contract
│   │   ├── SkillsRegistry.sol          # Skills registry contract
│   │   └── Migrations.sol              # Migration contract
│   │
│   ├── migrations/                     # Contract migrations
│   │   ├── 1_initial_migration.js
│   │   ├── 2_deploy_credentials.js
│   │   └── 3_deploy_skills.js
│   │
│   ├── test/                           # Contract tests
│   │   ├── credential_verification.test.js
│   │   └── skills_registry.test.js
│   │
│   ├── scripts/                        # Deployment scripts
│   │   ├── deploy.js
│   │   └── verify.js
│   │
│   ├── truffle-config.js               # Truffle configuration
│   └── package.json

# Documentation & Assets
├── docs/
│   ├── api/                           # API documentation
│   │   ├── authentication.md
│   │   ├── profiles.md
│   │   ├── jobs.md
│   │   ├── applications.md
│   │   ├── verification.md
│   │   ├── seta-integration.md
│   │   └── webhooks.md
│   │
│   ├── architecture/                  # Technical architecture
│   │   ├── system-overview.md
│   │   ├── database-schema.md
│   │   ├── security-model.md
│   │   ├── deployment-guide.md
│   │   └── performance-optimization.md
│   │
│   ├── user-guides/                   # User documentation
│   │   ├── graduate-guide.md
│   │   ├── employer-guide.md
│   │   ├── training-provider-guide.md
│   │   └── seta-admin-guide.md
│   │
│   ├── development/                   # Development docs
│   │   ├── setup-guide.md
│   │   ├── coding-standards.md
│   │   ├── testing-strategy.md
│   │   ├── deployment-process.md
│   │   └── troubleshooting.md
│   │
│   ├── business/                      # Business documentation
│   │   ├── product-requirements.md
│   │   ├── market-analysis.md
│   │   ├── go-to-market.md
│   │   └── partnership-strategy.md
│   │
│   └── legal/                         # Legal documentation
│       ├── privacy-policy.md
│       ├── terms-of-service.md
│       ├── data-processing.md
│       └── seta-agreements.md

# CI/CD and Automation
├── .github/
│   ├── workflows/                     # GitHub Actions
│   │   ├── backend-ci.yml             # Backend CI/CD
│   │   ├── frontend-ci.yml            # Frontend CI/CD
│   │   ├── mobile-ci.yml              # Mobile app CI/CD
│   │   ├── infrastructure-cd.yml      # Infrastructure deployment
│   │   ├── security-scan.yml          # Security scanning
│   │   └── performance-test.yml       # Performance testing
│   │
│   ├── ISSUE_TEMPLATE/                # Issue templates
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── security_issue.md
│   │
│   └── PULL_REQUEST_TEMPLATE.md       # PR template

# Configuration Files
├── .gitattributes                     # Git attributes
├── .pre-commit-config.yaml            # Pre-commit hooks
├── .codecov.yml                       # Code coverage config
├── .dependabot.yml                    # Dependency updates
├── renovate.json                      # Renovate bot config
└── LICENSE                            # License file

# Scripts and Utilities
├── scripts/
│   ├── dev/                           # Development scripts
│   │   ├── setup-local-env.sh         # Local environment setup
│   │   ├── seed-test-data.py          # Test data generation
│   │   ├── run-tests.sh               # Test runner
│   │   └── lint-all.sh                # Code linting
│   │
│   ├── deployment/                    # Deployment scripts
│   │   ├── deploy-staging.sh          # Staging deployment
│   │   ├── deploy-production.sh       # Production deployment
│   │   ├── rollback.sh                # Rollback script
│   │   └── health-check.sh            # Health check script
│   │
│   ├── data/                          # Data management scripts
│   │   ├── backup-database.sh         # Database backup
│   │   ├── restore-database.sh        # Database restore
│   │   ├── migrate-data.py            # Data migration
│   │   └── cleanup-old-data.py        # Data cleanup
│   │
│   └── monitoring/                    # Monitoring scripts
│       ├── check-health.py            # Health monitoring
│       ├── performance-report.py      # Performance reporting
│       └── alert-setup.py             # Alert configuration

# Environment Configurations
├── environments/
│   ├── development.env                # Development environment
│   ├── staging.env                    # Staging environment
│   └── production.env                 # Production environment

# Analytics and Reporting
├── analytics/
│   ├── notebooks/                     # Jupyter notebooks
│   │   ├── user-behavior-analysis.ipynb
│   │   ├── placement-success-analysis.ipynb
│   │   ├── skills-demand-analysis.ipynb
│   │   └── revenue-analysis.ipynb
│   │
│   ├── reports/                       # Generated reports
│   │   ├── monthly-metrics/
│   │   ├── quarterly-business-review/
│   │   └── annual-impact-report/
│   │
│   └── dashboards/                    # Dashboard configurations
│       ├── executive-dashboard.json
│       ├── operations-dashboard.json
│       └── seta-dashboard.json

# Testing Data and Fixtures
├── data/
│   ├── fixtures/                      # Test fixtures
│   │   ├── users.json
│   │   ├── profiles.json
│   │   ├── jobs.json
│   │   └── applications.json
│   │
├── data/
│   ├── fixtures/                      # Test fixtures
│   │   ├── users.json
│   │   ├── profiles.json
│   │   ├── jobs.json
│   │   └── applications.json
│   │
│   ├── samples/                       # Sample data
│   │   ├── cv-templates/
│   │   ├── skills-evidence-examples/
│   │   └── seta-data-samples/
│   │
│   └── migrations/                    # Data migration files
│       ├── legacy-system-export.sql
│       └── data-transformation.py

# External Integrations
├── integrations/
│   ├── seta-apis/                     # SETA-specific integrations
│   │   ├── merseta/
│   │   │   ├── client.py
│   │   │   ├── schemas.py
│   │   │   └── tests.py
│   │   ├── bankseta/
│   │   │   ├── client.py
│   │   │   ├── schemas.py
│   │   │   └── tests.py
│   │   ├── ceta/
│   │   │   ├── client.py
│   │   │   ├── schemas.py
│   │   │   └── tests.py
│   │   └── hwseta/
│   │       ├── client.py
│   │       ├── schemas.py
│   │       └── tests.py
│   │
│   ├── job-boards/                    # Job board integrations
│   │   ├── pnet/
│   │   │   ├── scraper.py
│   │   │   └── parser.py
│   │   ├── careers24/
│   │   │   ├── scraper.py
│   │   │   └── parser.py
│   │   └── indeed/
│   │       ├── scraper.py
│   │       └── parser.py
│   │
│   ├── whatsapp/                      # WhatsApp Business integration
│   │   ├── templates/
│   │   │   ├── profile_verification.json
│   │   │   ├── job_match_notification.json
│   │   │   └── application_update.json
│   │   ├── webhook_handler.py
│   │   └── message_templates.py
│   │
│   └── ai-services/                   # AI service integrations
│       ├── openai/
│       │   ├── content_generator.py
│       │   ├── embeddings.py
│       │   └── fine_tuning.py
│       ├── anthropic/
│       │   ├── claude_client.py
│       │   └── analysis.py
│       └── local-llm/
│           ├── llama_client.py
│           └── optimization.py

# Quality Assurance
├── qa/
│   ├── test-plans/                    # Manual test plans
│   │   ├── user-acceptance-testing.md
│   │   ├── integration-testing.md
│   │   ├── security-testing.md
│   │   └── performance-testing.md
│   │
│   ├── automation/                    # Test automation
│   │   ├── selenium/
│   │   │   ├── page-objects/
│   │   │   ├── test-suites/
│   │   │   └── utilities/
│   │   ├── api-tests/
│   │   │   ├── postman-collections/
│   │   │   └── newman-scripts/
│   │   └── mobile-tests/
│   │       ├── appium/
│   │       └── detox/
│   │
│   └── reports/                       # QA reports
│       ├── test-execution-reports/
│       ├── bug-reports/
│       └── performance-benchmarks/

# Security
├── security/
│   ├── policies/                      # Security policies
│   │   ├── data-governance.md
│   │   ├── access-control.md
│   │   ├── incident-response.md
│   │   └── vulnerability-management.md
│   │
│   ├── scans/                         # Security scan configurations
│   │   ├── sonarqube/
│   │   │   └── sonar-project.properties
│   │   ├── snyk/
│   │   │   └── .snyk
│   │   └── owasp-zap/
│   │       └── zap-config.yaml
│   │
│   ├── certificates/                  # SSL/TLS certificates
│   │   ├── dev/
│   │   ├── staging/
│   │   └── production/
│   │
│   └── audits/                        # Security audit reports
│       ├── penetration-testing/
│       ├── code-review-reports/
│       └── compliance-audits/

# Backup and Disaster Recovery
├── backup/
│   ├── database/
│   │   ├── backup-scripts/
│   │   │   ├── daily-backup.sh
│   │   │   ├── weekly-backup.sh
│   │   │   └── restore.sh
│   │   └── retention-policies/
│   │       ├── daily-retention.policy
│   │       └── weekly-retention.policy
│   │
│   ├── files/
│   │   ├── user-uploads/
│   │   └── application-data/
│   │
│   └── disaster-recovery/
│       ├── recovery-procedures.md
│       ├── rpo-rto-targets.md
│       └── failover-scripts/

# Localization (Future Expansion)
├── localization/
│   ├── translations/
│   │   ├── en/                        # English (default)
│   │   │   ├── common.json
│   │   │   ├── profile.json
│   │   │   ├── jobs.json
│   │   │   └── verification.json
│   │   ├── af/                        # Afrikaans
│   │   │   ├── common.json
│   │   │   ├── profile.json
│   │   │   ├── jobs.json
│   │   │   └── verification.json
│   │   ├── zu/                        # isiZulu
│   │   │   ├── common.json
│   │   │   ├── profile.json
│   │   │   ├── jobs.json
│   │   │   └── verification.json
│   │   └── xh/                        # isiXhosa
│   │       ├── common.json
│   │       ├── profile.json
│   │       ├── jobs.json
│   │       └── verification.json
│   │
│   ├── tools/
│   │   ├── translation-sync.py
│   │   ├── missing-keys-check.py
│   │   └── translation-validation.py
│   │
│   └── guidelines/
│       ├── translation-guide.md
│       └── cultural-considerations.md

# Machine Learning Models
├── ml-models/
│   ├── job-matching/
│   │   ├── training-data/
│   │   │   ├── historical-matches.csv
│   │   │   └── user-feedback.csv
│   │   ├── models/
│   │   │   ├── similarity-model.pkl
│   │   │   └── ranking-model.pkl
│   │   ├── evaluation/
│   │   │   ├── model-performance.py
│   │   │   └── ab-test-results.py
│   │   └── deployment/
│   │       ├── model-serving.py
│   │       └── monitoring.py
│   │
│   ├── skills-extraction/
│   │   ├── training-data/
│   │   │   └── annotated-cvs.json
│   │   ├── models/
│   │   │   └── ner-model/
│   │   └── preprocessing/
│   │       ├── text-cleaning.py
│   │       └── feature-extraction.py
│   │
│   └── fraud-detection/
│       ├── training-data/
│       │   └── verification-attempts.csv
│       ├── models/
│       │   └── fraud-classifier.pkl
│       └── evaluation/
│           └── fraud-metrics.py

# Legal and Compliance
├── legal/
│   ├── contracts/
│   │   ├── templates/
│   │   │   ├── seta-partnership-agreement.docx
│   │   │   ├── employer-terms.docx
│   │   │   └── data-processing-agreement.docx
│   │   └── executed/
│   │       ├── seta-agreements/
│   │       └── partner-contracts/
│   │
│   ├── policies/
│   │   ├── privacy-policy.md
│   │   ├── terms-of-service.md
│   │   ├── cookie-policy.md
│   │   ├── data-retention-policy.md
│   │   └── acceptable-use-policy.md
│   │
│   ├── compliance/
│   │   ├── popia/
│   │   │   ├── assessment.md
│   │   │   ├── implementation.md
│   │   │   └── audit-trail.md
│   │   ├── gdpr/
│   │   │   ├── compliance-checklist.md
│   │   │   └── data-mapping.md
│   │   └── ccpa/
│   │       ├── compliance-checklist.md
│   │       └── rights-requests.md
│   │
│   └── audits/
│       ├── compliance-audits/
│       ├── legal-reviews/
│       └── risk-assessments/

# Marketing and Communications
├── marketing/
│   ├── assets/
│   │   ├── logos/
│   │   │   ├── primary-logo.svg
│   │   │   ├── secondary-logo.svg
│   │   │   └── favicon.ico
│   │   ├── images/
│   │   │   ├── hero-images/
│   │   │   ├── feature-screenshots/
│   │   │   └── social-media/
│   │   └── videos/
│   │       ├── product-demos/
│   │       └── testimonials/
│   │
│   ├── content/
│   │   ├── website-copy/
│   │   │   ├── landing-page.md
│   │   │   ├── features.md
│   │   │   └── pricing.md
│   │   ├── blog-posts/
│   │   │   ├── launch-announcement.md
│   │   │   ├── skills-verification-guide.md
│   │   │   └── employer-success-stories.md
│   │   └── email-templates/
│   │       ├── welcome-sequence/
│   │       ├── product-updates/
│   │       └── partnership-outreach/
│   │
│   ├── campaigns/
│   │   ├── launch-campaign/
│   │   │   ├── strategy.md
│   │   │   ├── creative-assets/
│   │   │   └── performance-metrics.md
│   │   └── partnership-campaigns/
│   │       ├── seta-outreach/
│   │       └── employer-acquisition/
│   │
│   └── brand-guidelines/
│       ├── brand-identity.md
│       ├── voice-and-tone.md
│       ├── visual-guidelines.md
│       └── messaging-framework.md

# Partnership Management
├── partnerships/
│   ├── seta-partnerships/
│   │   ├── merseta/
│   │   │   ├── partnership-proposal.pdf
│   │   │   ├── technical-integration.md
│   │   │   └── success-metrics.md
│   │   ├── bankseta/
│   │   │   ├── partnership-proposal.pdf
│   │   │   ├── technical-integration.md
│   │   │   └── success-metrics.md
│   │   └── templates/
│   │       ├── partnership-proposal-template.docx
│   │       └── integration-checklist.md
│   │
│   ├── training-providers/
│   │   ├── tvet-colleges/
│   │   │   ├── partnership-framework.md
│   │   │   └── integration-guides/
│   │   └── private-providers/
│   │       ├── partnership-terms.md
│   │       └── onboarding-process.md
│   │
│   ├── employers/
│   │   ├── enterprise-partnerships/
│   │   │   ├── partnership-tiers.md
│   │   │   └── enterprise-onboarding.md
│   │   └── sme-partnerships/
│   │       ├── partnership-benefits.md
│   │       └── quick-start-guide.md
│   │
│   └── government/
│       ├── dhet-collaboration/
│       │   ├── policy-alignment.md
│       │   └── data-sharing-agreement.md
│       └── local-government/
│           ├── municipal-partnerships.md
│           └── economic-development.md

# Configuration Files (Root Level)
├── .env.example                       # Environment variables template
├── .gitignore                         # Git ignore rules
├── .gitattributes                     # Git attributes
├── .pre-commit-config.yaml            # Pre-commit hooks
├── .codecov.yml                       # Code coverage configuration
├── .dependabot.yml                    # Dependency updates
├── renovate.json                      # Renovate bot configuration
├── docker-compose.yml                 # Development environment
├── docker-compose.prod.yml            # Production environment
├── Makefile                           # Build and deployment commands
├── package.json                       # Root package.json for workspaces
├── README.md                          # Project overview and setup
├── CONTRIBUTING.md                    # Contribution guidelines
├── CHANGELOG.md                       # Version history
├── CODE_OF_CONDUCT.md                 # Community guidelines
└── LICENSE                            # Software license

# Development Tools Configuration
├── .vscode/                           # VSCode configuration
│   ├── settings.json                  # Editor settings
│   ├── extensions.json                # Recommended extensions
│   ├── launch.json                    # Debug configuration
│   └── tasks.json                     # Build tasks
│
├── .idea/                             # IntelliJ IDEA configuration
│   ├── workspace.xml
│   ├── modules.xml
│   └── vcs.xml
│
└── config/                            # Application configuration
    ├── development/
    │   ├── app.yaml
    │   ├── database.yaml
    │   └── services.yaml
    ├── staging/
    │   ├── app.yaml
    │   ├── database.yaml
    │   └── services.yaml
    └── production/
        ├── app.yaml
        ├── database.yaml
        └── services.yaml
```

## Quick Start Guide

### Essential Setup Commands

```bash
# Clone and setup the entire project
git clone https://github.com/your-org/proofile-vocational.git
cd proofile-vocational

# Setup development environment
make setup-dev

# Start all services
make start-dev

# Run tests
make test-all

# Deploy to staging
make deploy-staging
```

### Directory Navigation Shortcuts

```bash
# Backend development
cd backend && source venv/bin/activate

# Frontend development  
cd frontend && npm run dev

# Mobile development
cd mobile/ProofileVocationalApp && npx react-native start

# Infrastructure management
cd infrastructure/terraform/environments/dev

# View logs
cd logs/application && tail -f app.log
```

## Key Directory Relationships

**Data Flow Architecture:**
- `backend/app/api/` → `frontend/lib/api.ts` → `mobile/src/services/api.ts`
- `backend/app/services/seta_service.py` ↔ `integrations/seta-apis/*/client.py`
- `backend/app/tasks/` → `infrastructure/kubernetes/applications/`

**Configuration Dependencies:**
- `environments/*.env` → `config/*/app.yaml` → `infrastructure/terraform/*/variables.tf`
- `.github/workflows/` → `scripts/deployment/` → `infrastructure/kubernetes/`

**Asset Management:**
- `frontend/public/` → `marketing/assets/` → CDN deployment
- `mobile/src/assets/` → App store submissions
- `docs/` → Documentation website deployment

This directory structure supports a microservices architecture while maintaining clear separation of concerns, comprehensive testing coverage, and scalable deployment patterns essential for the South African government integration requirements.