import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.mark.asyncio
async def test_public_resume_analysis_text(client: AsyncClient):
    """
    Test that the public resume analysis endpoint works with text input
    and does not require authentication.
    """
    response = await client.post(
        "/api/v1/resume/public/analyze",
        params={"text": "Experienced Python Developer with 5 years of experience in FastAPI and React."}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Check structure of response
    assert "score" in data
    assert "improvements" in data
    assert "sections" in data
    assert isinstance(data["improvements"], list)
    assert data["score"] >= 0

@pytest.mark.asyncio
async def test_public_resume_analysis_file(client: AsyncClient):
    """
    Test that the public resume analysis endpoint works with file upload
    and does not require authentication.
    """
    # Create a dummy PDF file content
    file_content = b"%PDF-1.4 dummy content"
    files = {"file": ("resume.pdf", file_content, "application/pdf")}
    
    response = await client.post(
        "/api/v1/resume/public/analyze",
        files=files
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert "score" in data
    assert "improvements" in data

@pytest.mark.asyncio
async def test_create_resume_requires_auth(client: AsyncClient):
    """
    Test that creating a resume requires authentication.
    """
    response = await client.post(
        "/api/v1/resumes",
        json={
            "name": "My Resume",
            "template_id": "modern",
            "data": {}
        }
    )
    
    # Should be 401 Unauthorized or 403 Forbidden
    assert response.status_code in [401, 403]
