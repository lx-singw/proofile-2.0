import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.user import User, UserRole
from app.models.opportunity import Job  # Job is alias for Opportunity
from app.models.profile import Profile
from app.services import job_service
from app.schemas.job import JobCreate

@pytest.mark.asyncio
async def test_job_matching_algorithm(client: AsyncClient, db_session: AsyncSession, test_user: User):
    # 1. Setup: Create a user with specific profile attributes
    # Update test_user to have specific industry and goal
    test_user.industry = "Technology"
    test_user.primary_goal = "Product Manager"
    db_session.add(test_user)
    
    # Create a profile for the user to test headline matching
    profile = Profile(
        user_id=test_user.id,
        headline="Experienced Product Manager looking for new opportunities",
        summary="Bio..."
    )
    db_session.add(profile)
    await db_session.commit()
    
    # Reload user with profile relationship
    result = await db_session.execute(
        select(User).options(selectinload(User.profile)).where(User.id == test_user.id)
    )
    test_user = result.scalar_one()
    
    # Create an employer user
    employer = User(
        email="employer@example.com",
        hashed_password="hashed_password",
        full_name="Employer User",
        role=UserRole.EMPLOYER
    )
    db_session.add(employer)
    await db_session.commit()
    await db_session.refresh(employer)

    # 2. Create test jobs with varying degrees of relevance
    
    # Job A: Perfect Match (Title + Industry)
    job_a = await job_service.create_job(
        db_session, 
        JobCreate(
            title="Senior Product Manager",
            description="Leading product in Technology sector",
            company_name="TechCorp",
            industry="Technology",
            required_skills=["Product Management", "Agile"],
            experience_level="Senior"
        ),
        employer_id=employer.id
    )
    
    # Job B: Partial Match (Title only)
    job_b = await job_service.create_job(
        db_session, 
        JobCreate(
            title="Product Manager",
            description="General PM role",
            company_name="RetailCo",
            industry="Retail",
            required_skills=["Product Management"],
            experience_level="Mid"
        ),
        employer_id=employer.id
    )
    
    # Job C: Weak Match (Industry only)
    job_c = await job_service.create_job(
        db_session, 
        JobCreate(
            title="Software Engineer",
            description="Coding in Technology sector",
            company_name="TechCorp",
            industry="Technology",
            required_skills=["Python", "React"],
            experience_level="Mid"
        ),
        employer_id=employer.id
    )
    
    # Job D: No Match
    job_d = await job_service.create_job(
        db_session, 
        JobCreate(
            title="Accountant",
            description="Finance role",
            company_name="BankCo",
            industry="Finance",
            required_skills=["Accounting"],
            experience_level="Mid"
        ),
        employer_id=employer.id
    )

    # 3. Execute: Call the recommendation service
    recommendations = await job_service.get_recommended_jobs(db_session, user=test_user, limit=10)
    
    # 4. Verify: Check the order of recommendations
    # Expectation: Job A > Job B > Job C > Job D (or D might not be recommended if score is 0, depending on implementation)
    
    rec_ids = [job.id for job in recommendations]
    
    # Job A should be first (highest score)
    assert rec_ids[0] == job_a.id
    
    # Job B should be before Job C (Title match usually weighted higher than just industry)
    # Note: This depends on the exact weights in get_recommended_jobs. 
    # Let's verify the logic: Title match (50) vs Industry match (20). So B > C.
    assert job_b.id in rec_ids
    assert job_c.id in rec_ids
    assert rec_ids.index(job_b.id) < rec_ids.index(job_c.id)
    
    # Job D might be present but last, or not present if we filter 0 scores (current impl doesn't filter 0s explicitly but sorts them last)
    if job_d.id in rec_ids:
        assert rec_ids.index(job_c.id) < rec_ids.index(job_d.id)

@pytest.mark.asyncio
async def test_advanced_matching_scores(client: AsyncClient, db_session: AsyncSession, test_user: User):
    # Setup similar to above
    test_user.industry = "Technology"
    test_user.primary_goal = "Product Manager"
    db_session.add(test_user)
    
    employer = User(email="employer2@example.com", hashed_password="pw", role=UserRole.EMPLOYER)
    db_session.add(employer)
    await db_session.commit()
    await db_session.refresh(employer)
    
    job = await job_service.create_job(
        db_session, 
        JobCreate(
            title="Senior Product Manager",
            description="Tech role",
            company_name="TechCorp",
            industry="Technology",
            required_skills=["Product Management"],
            experience_level="Senior"
        ),
        employer_id=employer.id
    )
    
    # Call advanced recommendations
    results = await job_service.get_recommended_jobs_advanced(db_session, user=test_user, limit=1)
    
    assert len(results) > 0
    matched_job, total_score, breakdown = results[0]
    
    assert matched_job.id == job.id
    assert total_score > 0
    assert "title_match" in breakdown
    assert "industry_match" in breakdown
    # Title match should be 50 (based on current service logic)
    assert breakdown["title_match"] == 50
    # Industry match should be 20
    assert breakdown["industry_match"] == 20
