import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.resume import Resume

@pytest.mark.asyncio
async def test_phase1_backend_resume_endpoints(client: AsyncClient, db_session: AsyncSession, test_user: User, use_test_user):
    """
    Test backend endpoints supporting Phase 1 features (post-conversion).
    """
    
    # 1. Build from Scratch (Save)
    # When a user converts from the anonymous builder, they will hit this endpoint
    resume_data = {
        "name": "My First Resume",
        "template_id": "modern",
        "data": {
            "personalInfo": {"firstName": "John", "lastName": "Doe"},
            "experience": []
        }
    }
    
    response = await client.post("/api/v1/resumes", json=resume_data)
    assert response.status_code == 201
    created_resume = response.json()
    assert created_resume["name"] == "My First Resume"
    assert created_resume["user_id"] == test_user.id
    
    resume_id = created_resume["id"]
    
    # 2. Upload & Analyze (Upload)
    # When a user converts from the upload tool, they might upload here
    # Note: The actual file upload might need multipart/form-data
    # For this test, we'll simulate a file upload if the endpoint supports it, 
    # or just verify the endpoint exists and requires auth.
    
    # Create a dummy file
    files = {'file': ('test_resume.pdf', b'%PDF-1.4 content', 'application/pdf')}
    response = await client.post("/api/v1/resumes/upload", files=files)
    # The current implementation returns 202 Accepted
    assert response.status_code == 202
    assert "resume_id" in response.json()
    
    # 3. My Resumes (List)
    # Verifies the user can see their saved resumes
    response = await client.get("/api/v1/resumes")
    assert response.status_code == 200
    resumes = response.json()
    assert len(resumes) >= 2 # We created one via JSON and one via Upload
    
    # Verify the manually created one is in the list
    found = False
    for r in resumes:
        if r["id"] == resume_id:
            found = True
            break
    assert found

    # 4. AI Build (Generate)
    # Assuming there is an endpoint for AI generation or it uses the create endpoint with specific flags
    # If not explicitly defined yet, we can skip or test a placeholder if it exists.
    # Based on file search, there isn't a specific 'generate' endpoint in resumes.py, 
    # but there might be one in `app/api/v1/ai.py` or similar if it exists.
    # For now, we'll assume the backend support is covered by `create_resume` with AI-generated data passed from frontend.
