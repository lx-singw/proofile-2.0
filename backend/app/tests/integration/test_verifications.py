import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.verification import Verification
from sqlalchemy import select
from app.models.profile import Profile

@pytest.mark.asyncio
async def test_email_verification_flow(
    client: AsyncClient,
    db_session: AsyncSession,
    auth_headers,
    test_user,
):
    # 1. Initiate
    response = await client.post(
        "/api/v1/verifications/email/initiate",
        json={"email": test_user.email},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "debug_token" in data
    token = data["debug_token"]
    
    # Check DB record
    # Commit purely to refresh snapshot in Repeatable Read isolation
    await db_session.commit()
    stmt = select(Verification).where(Verification.user_id == test_user.id)
    result = await db_session.execute(stmt)
    v = result.scalar_one_or_none()
    assert v is not None
    assert v.status == "pending"
    assert v.token == token
    
    # 2. Confirm
    response = await client.post(
        "/api/v1/verifications/email/confirm",
        json={"token": token},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "verified"
    
    # Check DB update
    await db_session.commit() # Refresh snapshot
    await db_session.refresh(v)
    assert v.status == "verified"
    assert v.token is None
    
    # 3. Check Profile Trust Score
    await db_session.commit() # Refresh again
    stmt = select(Profile).where(Profile.user_id == test_user.id)
    result = await db_session.execute(stmt)
    profile = result.scalar_one()
    
    # Assuming user has no other info, score might be low, but trust should be > 0
    # Email = 5 points
    assert profile.completeness_data is not None
    assert profile.completeness_data.get("trust", 0) == 5
    assert profile.completeness_score >= 5
