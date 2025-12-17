"""
Seed Portal Jobs Script

Populates the portal_jobs table with realistic South African job listings for testing.
Run with: python -m scripts.seed_portal_jobs
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
import random
import re
from sqlalchemy.orm import Session

from app.core.database import SyncSessionLocal
from app.models.portal_job import PortalJob


def slugify(text: str) -> str:
    """Simple slugify function"""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')


# South African companies
COMPANIES = [
    {"name": "Takealot", "logo": None, "category": "technology"},
    {"name": "FNB", "logo": None, "category": "finance"},
    {"name": "Discovery", "logo": None, "category": "finance"},
    {"name": "Standard Bank", "logo": None, "category": "finance"},
    {"name": "Nedbank", "logo": None, "category": "finance"},
    {"name": "MTN", "logo": None, "category": "technology"},
    {"name": "Vodacom", "logo": None, "category": "technology"},
    {"name": "Shoprite", "logo": None, "category": "retail"},
    {"name": "Woolworths", "logo": None, "category": "retail"},
    {"name": "Capitec Bank", "logo": None, "category": "finance"},
    {"name": "Old Mutual", "logo": None, "category": "finance"},
    {"name": "Sanlam", "logo": None, "category": "finance"},
    {"name": "Naspers", "logo": None, "category": "technology"},
    {"name": "MultiChoice", "logo": None, "category": "technology"},
    {"name": "Dimension Data", "logo": None, "category": "technology"},
    {"name": "Accenture South Africa", "logo": None, "category": "consulting"},
    {"name": "Deloitte SA", "logo": None, "category": "consulting"},
    {"name": "PwC South Africa", "logo": None, "category": "consulting"},
    {"name": "KPMG South Africa", "logo": None, "category": "consulting"},
    {"name": "Amazon Web Services SA", "logo": None, "category": "technology"},
    {"name": "Microsoft South Africa", "logo": None, "category": "technology"},
    {"name": "Google South Africa", "logo": None, "category": "technology"},
    {"name": "Yoco", "logo": None, "category": "technology"},
    {"name": "Luno", "logo": None, "category": "technology"},
    {"name": "Jumo", "logo": None, "category": "technology"},
]

# Job templates by category
JOB_TEMPLATES = {
    "technology": [
        {"title": "Senior Software Engineer", "skills": ["Python", "JavaScript", "AWS", "Docker"], "exp": "senior"},
        {"title": "Frontend Developer", "skills": ["React", "TypeScript", "CSS", "Next.js"], "exp": "mid"},
        {"title": "Backend Developer", "skills": ["Python", "Django", "PostgreSQL", "Redis"], "exp": "mid"},
        {"title": "Full Stack Developer", "skills": ["React", "Node.js", "MongoDB", "GraphQL"], "exp": "mid"},
        {"title": "DevOps Engineer", "skills": ["Kubernetes", "AWS", "Terraform", "CI/CD"], "exp": "senior"},
        {"title": "Data Engineer", "skills": ["Python", "Spark", "Airflow", "SQL"], "exp": "mid"},
        {"title": "Data Scientist", "skills": ["Python", "Machine Learning", "TensorFlow", "SQL"], "exp": "senior"},
        {"title": "Mobile Developer", "skills": ["React Native", "Swift", "Kotlin", "Firebase"], "exp": "mid"},
        {"title": "QA Engineer", "skills": ["Selenium", "Python", "Jest", "Cypress"], "exp": "mid"},
        {"title": "Cloud Architect", "skills": ["AWS", "Azure", "GCP", "Kubernetes"], "exp": "lead"},
        {"title": "Junior Developer", "skills": ["JavaScript", "HTML", "CSS", "Git"], "exp": "entry"},
        {"title": "Machine Learning Engineer", "skills": ["Python", "PyTorch", "MLOps", "AWS"], "exp": "senior"},
    ],
    "finance": [
        {"title": "Financial Analyst", "skills": ["Excel", "Financial Modeling", "SQL", "Power BI"], "exp": "mid"},
        {"title": "Risk Analyst", "skills": ["Risk Management", "Python", "SQL", "Basel III"], "exp": "mid"},
        {"title": "Investment Analyst", "skills": ["Financial Analysis", "Bloomberg", "Excel", "CFA"], "exp": "senior"},
        {"title": "Quantitative Analyst", "skills": ["Python", "R", "Statistics", "Financial Modeling"], "exp": "senior"},
        {"title": "Credit Analyst", "skills": ["Credit Risk", "Financial Analysis", "Excel", "SQL"], "exp": "mid"},
        {"title": "Compliance Officer", "skills": ["Regulatory Compliance", "FAIS", "Risk Management"], "exp": "senior"},
    ],
    "consulting": [
        {"title": "Management Consultant", "skills": ["Strategy", "PowerPoint", "Excel", "Project Management"], "exp": "mid"},
        {"title": "Business Analyst", "skills": ["Requirements Gathering", "SQL", "JIRA", "Agile"], "exp": "mid"},
        {"title": "Strategy Consultant", "skills": ["Strategy", "Market Research", "Financial Modeling"], "exp": "senior"},
        {"title": "IT Consultant", "skills": ["IT Strategy", "Cloud", "Digital Transformation"], "exp": "senior"},
    ],
    "retail": [
        {"title": "Supply Chain Manager", "skills": ["Logistics", "SAP", "Inventory Management"], "exp": "senior"},
        {"title": "E-commerce Manager", "skills": ["E-commerce", "Digital Marketing", "Analytics"], "exp": "mid"},
        {"title": "Category Manager", "skills": ["Category Management", "Negotiation", "Excel"], "exp": "mid"},
    ],
}

# Training & Skills Program templates
TRAINING_TEMPLATES = {
    "internship": [
        {"title": "Software Developer Intern", "skills": ["Python", "JavaScript", "Git"], "exp": "entry", "duration": "6 months"},
        {"title": "Data Science Intern", "skills": ["Python", "SQL", "Statistics"], "exp": "entry", "duration": "12 months"},
        {"title": "Finance Graduate Programme", "skills": ["Excel", "Financial Analysis", "SAP"], "exp": "entry", "duration": "24 months"},
        {"title": "Marketing Intern", "skills": ["Social Media", "Analytics", "Copywriting"], "exp": "entry", "duration": "6 months"},
        {"title": "IT Graduate Programme", "skills": ["Networking", "Cloud", "Security"], "exp": "entry", "duration": "18 months"},
    ],
    "learnership": [
        {"title": "ICT Learnership (NQF 4)", "skills": ["Computer Literacy", "Networking", "Technical Support"], "exp": "entry", "duration": "12 months"},
        {"title": "Financial Services Learnership", "skills": ["Customer Service", "Banking", "Compliance"], "exp": "entry", "duration": "12 months"},
        {"title": "Business Administration Learnership", "skills": ["Administration", "MS Office", "Communication"], "exp": "entry", "duration": "12 months"},
        {"title": "Retail Operations Learnership", "skills": ["Customer Service", "Inventory", "POS Systems"], "exp": "entry", "duration": "12 months"},
    ],
    "apprenticeship": [
        {"title": "Electrical Apprenticeship", "skills": ["Electrical Installation", "Safety", "Wiring"], "exp": "entry", "duration": "36 months"},
        {"title": "Mechanical Fitter Apprenticeship", "skills": ["Mechanical Systems", "Welding", "Maintenance"], "exp": "entry", "duration": "36 months"},
        {"title": "Plumbing Apprenticeship", "skills": ["Plumbing", "Safety", "Installation"], "exp": "entry", "duration": "36 months"},
    ],
}

# Locations
LOCATIONS = [
    {"city": "Johannesburg", "province": "Gauteng"},
    {"city": "Cape Town", "province": "Western Cape"},
    {"city": "Durban", "province": "KwaZulu-Natal"},
    {"city": "Pretoria", "province": "Gauteng"},
    {"city": "Sandton", "province": "Gauteng"},
    {"city": "Centurion", "province": "Gauteng"},
    {"city": "Stellenbosch", "province": "Western Cape"},
]

LOCATION_TYPES = ["onsite", "hybrid", "remote"]
JOB_TYPES = ["full-time", "contract", "part-time"]
SOURCES = ["careers24", "pnet", "linkedin", "indeed", "careerjunction", "studentroom"]

# Opportunity types mapping
OPPORTUNITY_TYPES = {
    "jobs": ["employment", "contract", "freelance", "consulting"],
    "training_skills_programs": ["internship", "learnership", "apprenticeship"],
}

# Salary ranges by experience level (monthly in ZAR)
SALARY_RANGES = {
    "entry": (15000, 30000),
    "mid": (35000, 65000),
    "senior": (70000, 120000),
    "lead": (100000, 180000),
}


def generate_description(job_title: str, company: str, skills: list) -> str:
    """Generate a realistic job description"""
    return f"""
## About the Role

We're looking for a talented {job_title} to join our team at {company}. This is an exciting opportunity to work on challenging problems and make a real impact.

## Responsibilities

- Collaborate with cross-functional teams to deliver high-quality solutions
- Design, develop, and maintain scalable systems
- Participate in code reviews and contribute to technical discussions
- Mentor junior team members and share knowledge
- Stay up-to-date with industry trends and best practices

## Requirements

- Proven experience as a {job_title} or similar role
- Strong proficiency in: {', '.join(skills)}
- Excellent problem-solving and communication skills
- Ability to work in a fast-paced, collaborative environment
- South African citizenship or valid work permit

## What We Offer

- Competitive salary and benefits package
- Flexible working arrangements
- Learning and development opportunities
- Medical aid contribution
- Retirement fund contribution
- Employee wellness programs

## About {company}

{company} is a leading organization in South Africa, committed to innovation and excellence. We value diversity, collaboration, and continuous improvement.
"""


def seed_portal_jobs(db: Session, count: int = 30) -> int:
    """Seed the database with sample portal jobs"""
    
    # Clear existing jobs (optional - uncomment if you want to reset)
    # db.query(PortalJob).delete()
    # db.commit()
    
    jobs_created = 0
    
    for i in range(count):
        # Pick random company
        company = random.choice(COMPANIES)
        
        # Pick random job from matching category or any technology job
        category = company["category"]
        if category in JOB_TEMPLATES:
            job_template = random.choice(JOB_TEMPLATES[category])
        else:
            job_template = random.choice(JOB_TEMPLATES["technology"])
        
        # Pick random location
        location = random.choice(LOCATIONS)
        location_type = random.choice(LOCATION_TYPES)
        
        # Generate salary
        exp_level = job_template["exp"]
        salary_min, salary_max = SALARY_RANGES.get(exp_level, (30000, 60000))
        salary_min = random.randint(salary_min, salary_min + 10000)
        salary_max = random.randint(salary_max - 10000, salary_max)
        
        # Random posted date within last 30 days
        days_ago = random.randint(0, 30)
        posted_at = datetime.utcnow() - timedelta(days=days_ago)
        
        # Some jobs expire
        expires_at = posted_at + timedelta(days=random.randint(30, 90)) if random.random() > 0.3 else None
        
        # Determine opportunity category and type
        job_type_picked = random.choice(JOB_TYPES)
        if job_type_picked == "contract":
            opportunity_type = "contract"
        elif category == "consulting":
            opportunity_type = "consulting"
        else:
            opportunity_type = "employment"
        
        # Create job
        job = PortalJob(
            external_id=f"seed-{i+1}",
            source=random.choice(SOURCES),
            title=job_template["title"],
            company=company["name"],
            company_logo_url=company["logo"],
            location=f"{location['city']}, {location['province']}",
            location_type=location_type,
            city=location["city"],
            country="South Africa",
            salary_min=salary_min,
            salary_max=salary_max,
            salary_currency="ZAR",
            salary_period="monthly",
            description=generate_description(job_template["title"], company["name"], job_template["skills"]),
            skills=job_template["skills"],
            experience_level=exp_level,
            category=category,
            job_type=job_type_picked,
            opportunity_category="jobs",
            opportunity_type=opportunity_type,
            posted_at=posted_at,
            expires_at=expires_at,
            is_active=True,
            is_verified=random.random() > 0.7,  # 30% are verified
            views_count=random.randint(10, 500),
            applies_count=random.randint(1, 50),
            slug=slugify(f"{job_template['title']}-{company['name']}-{i+1}"),
        )
        
        db.add(job)
        jobs_created += 1
    
    # Seed training programs (internships, learnerships, apprenticeships)
    training_sources = ["studentroom", "yes4youth", "careerjunction", "careers24"]
    training_count = count // 3  # About 1/3 as many training opportunities
    
    for opp_type, templates in TRAINING_TEMPLATES.items():
        for i in range(training_count // len(TRAINING_TEMPLATES)):
            template = random.choice(templates)
            company = random.choice(COMPANIES)
            location = random.choice(LOCATIONS)
            
            # Training programs are typically entry level with lower/no salary
            salary_min = random.randint(3000, 8000) if opp_type == "learnership" else random.randint(8000, 15000)
            salary_max = salary_min + random.randint(2000, 5000)
            
            days_ago = random.randint(0, 14)
            posted_at = datetime.utcnow() - timedelta(days=days_ago)
            expires_at = posted_at + timedelta(days=random.randint(14, 45))
            
            job = PortalJob(
                external_id=f"training-{opp_type}-{i+1}",
                source=random.choice(training_sources),
                title=template["title"],
                company=company["name"],
                company_logo_url=company["logo"],
                location=f"{location['city']}, {location['province']}",
                location_type="onsite" if opp_type in ["learnership", "apprenticeship"] else random.choice(["onsite", "hybrid"]),
                city=location["city"],
                country="South Africa",
                salary_min=salary_min,
                salary_max=salary_max,
                salary_currency="ZAR",
                salary_period="monthly",
                description=f"""## {template['title']} at {company['name']}

This is a {template.get('duration', '12 month')} {opp_type} opportunity for young South Africans.

## Requirements
- South African citizen between 18-35 years
- Matric certificate
- Strong interest in {', '.join(template['skills'][:2])}
- Good communication skills

## What You'll Learn
- Hands-on experience in {', '.join(template['skills'])}
- Industry-relevant skills
- Professional development

## Duration: {template.get('duration', '12 months')}

This opportunity is part of the YES (Youth Employment Service) initiative.""",
                skills=template["skills"],
                experience_level="entry",
                category="training",
                job_type="learnership" if opp_type == "learnership" else "internship",
                opportunity_category="training_skills_programs",
                opportunity_type=opp_type,
                posted_at=posted_at,
                expires_at=expires_at,
                is_active=True,
                is_verified=random.random() > 0.5,
                views_count=random.randint(50, 300),
                applies_count=random.randint(10, 100),
                slug=slugify(f"{template['title']}-{company['name']}-{opp_type}-{i+1}"),
            )
            
            db.add(job)
            jobs_created += 1
    
    db.commit()
    return jobs_created


def main():
    """Main entry point"""
    print("🌱 Seeding portal jobs...")
    
    db = SyncSessionLocal()
    try:
        # Check existing count
        existing = db.query(PortalJob).count()
        print(f"   Existing jobs: {existing}")
        
        # Seed new jobs
        count = seed_portal_jobs(db, count=30)
        print(f"✅ Created {count} sample jobs")
        
        # Show new total
        total = db.query(PortalJob).count()
        print(f"   Total jobs now: {total}")
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
