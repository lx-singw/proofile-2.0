"""
Create Portal Jobs Table (with cleanup)

Drops orphaned indexes and creates the portal_jobs table.
Run with: python -m scripts.create_portal_table_sql
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SyncSessionLocal
from sqlalchemy import text

print("🔧 Creating portal_jobs table with cleanup...")

db = SyncSessionLocal()
try:
    # Drop orphaned indexes first
    orphan_indexes = [
        "ix_portal_jobs_external_id",
        "ix_portal_jobs_source", 
        "ix_portal_jobs_title",
        "ix_portal_jobs_company",
        "ix_portal_jobs_location",
        "ix_portal_jobs_category",
        "ix_portal_jobs_posted_at",
        "ix_portal_jobs_is_active",
        "ix_portal_jobs_slug",
        "ix_portal_jobs_id",
        "ix_portal_jobs_opportunity_category",
        "ix_portal_jobs_opportunity_type",
        "ix_portal_jobs_active_posted",
        "ix_portal_jobs_filter",
        "ix_portal_jobs_search",
    ]
    
    print("   Dropping orphaned indexes...")
    for idx in orphan_indexes:
        try:
            db.execute(text(f"DROP INDEX IF EXISTS {idx}"))
        except Exception as e:
            pass
    
    # Drop table if exists (clean slate)
    db.execute(text("DROP TABLE IF EXISTS portal_jobs CASCADE"))
    
    # Create table with all columns
    print("   Creating portal_jobs table...")
    db.execute(text("""
        CREATE TABLE portal_jobs (
            id SERIAL PRIMARY KEY,
            external_id VARCHAR(255),
            source VARCHAR(50) NOT NULL,
            source_url VARCHAR(500),
            title VARCHAR(255) NOT NULL,
            company VARCHAR(255) NOT NULL,
            company_logo_url VARCHAR(500),
            location VARCHAR(255),
            location_type VARCHAR(50),
            country VARCHAR(100),
            city VARCHAR(100),
            salary_min NUMERIC(12, 2),
            salary_max NUMERIC(12, 2),
            salary_currency VARCHAR(10),
            salary_period VARCHAR(20),
            description TEXT,
            description_html TEXT,
            skills VARCHAR[],
            experience_level VARCHAR(50),
            education_requirement VARCHAR(255),
            years_experience_min INTEGER,
            years_experience_max INTEGER,
            category VARCHAR(100),
            job_type VARCHAR(50),
            opportunity_category VARCHAR(50),
            opportunity_type VARCHAR(50),
            posted_at TIMESTAMP,
            expires_at TIMESTAMP,
            scraped_at TIMESTAMP,
            is_active BOOLEAN DEFAULT true,
            is_verified BOOLEAN DEFAULT false,
            views_count INTEGER DEFAULT 0,
            applies_count INTEGER DEFAULT 0,
            saves_count INTEGER DEFAULT 0,
            slug VARCHAR(300),
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """))
    
    # Create indexes
    print("   Creating indexes...")
    db.execute(text("CREATE INDEX ix_portal_jobs_external_id ON portal_jobs (external_id)"))
    db.execute(text("CREATE INDEX ix_portal_jobs_source ON portal_jobs (source)"))
    db.execute(text("CREATE INDEX ix_portal_jobs_title ON portal_jobs (title)"))
    db.execute(text("CREATE INDEX ix_portal_jobs_company ON portal_jobs (company)"))
    db.execute(text("CREATE INDEX ix_portal_jobs_location ON portal_jobs (location)"))
    db.execute(text("CREATE INDEX ix_portal_jobs_category ON portal_jobs (category)"))
    db.execute(text("CREATE INDEX ix_portal_jobs_opportunity_category ON portal_jobs (opportunity_category)"))
    db.execute(text("CREATE INDEX ix_portal_jobs_opportunity_type ON portal_jobs (opportunity_type)"))
    db.execute(text("CREATE INDEX ix_portal_jobs_posted_at ON portal_jobs (posted_at DESC)"))
    db.execute(text("CREATE INDEX ix_portal_jobs_is_active ON portal_jobs (is_active)"))
    db.execute(text("CREATE UNIQUE INDEX ix_portal_jobs_slug ON portal_jobs (slug)"))
    
    db.commit()
    print("✅ portal_jobs table created successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
    raise
finally:
    db.close()
