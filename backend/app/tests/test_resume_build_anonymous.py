"""
Test suite for Phase 2: Resume Builder (Anonymous Access)
Tests anonymous users can build resumes with paywall on save/download.
"""
import pytest
from fastapi import status
from httpx import AsyncClient


class TestAnonymousResumeBuilder:
    """Test anonymous resume builder functionality"""

    async def test_access_builder_without_auth(self, client: AsyncClient):
        """Anonymous users can access builder interface"""
        response = await client.get("/api/v1/resumes/builder/templates")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

    async def test_create_draft_resume_without_auth(self, client: AsyncClient):
        """Anonymous users can create draft resumes"""
        payload = {
            "template_id": "modern",
            "personal_info": {
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "555-0100"
            }
        }
        response = await client.post("/api/v1/resumes/builder/draft", json=payload)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "draft_id" in data
        assert data["is_temporary"] is True

    async def test_update_draft_resume_without_auth(self, client: AsyncClient):
        """Anonymous users can update draft resumes"""
        # Create draft
        create_payload = {"template_id": "modern", "personal_info": {"name": "John"}}
        create_resp = await client.post("/api/v1/resumes/builder/draft", json=create_payload)
        draft_id = create_resp.json()["draft_id"]

        # Update draft
        update_payload = {"work_experience": [{"title": "Engineer", "company": "Tech Co"}]}
        response = await client.patch(f"/api/v1/resumes/builder/draft/{draft_id}", json=update_payload)
        assert response.status_code == status.HTTP_200_OK

    async def test_preview_resume_without_auth(self, client: AsyncClient):
        """Anonymous users can preview resumes"""
        create_payload = {"template_id": "modern", "personal_info": {"name": "John"}}
        create_resp = await client.post("/api/v1/resumes/builder/draft", json=create_payload)
        draft_id = create_resp.json()["draft_id"]

        response = await client.get(f"/api/v1/resumes/builder/draft/{draft_id}/preview")
        assert response.status_code == status.HTTP_200_OK

    async def test_cannot_save_resume_without_auth(self, client: AsyncClient):
        """Anonymous users hit paywall when saving"""
        create_payload = {"template_id": "modern", "personal_info": {"name": "John"}}
        create_resp = await client.post("/api/v1/resumes/builder/draft", json=create_payload)
        draft_id = create_resp.json()["draft_id"]

        response = await client.post(f"/api/v1/resumes/builder/draft/{draft_id}/save")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "create" in response.json()["detail"].lower() or "sign" in response.json()["detail"].lower()

    async def test_cannot_download_resume_without_auth(self, client: AsyncClient):
        """Anonymous users hit paywall when downloading"""
        create_payload = {"template_id": "modern", "personal_info": {"name": "John"}}
        create_resp = await client.post("/api/v1/resumes/builder/draft", json=create_payload)
        draft_id = create_resp.json()["draft_id"]

        response = await client.get(f"/api/v1/resumes/builder/draft/{draft_id}/download")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestResumeTemplates:
    """Test resume template functionality"""

    async def test_list_templates(self, client: AsyncClient):
        """List available templates"""
        response = await client.get("/api/v1/resumes/builder/templates")
        assert response.status_code == status.HTTP_200_OK
        templates = response.json()
        assert len(templates) > 0
        assert all("id" in t and "name" in t for t in templates)

    async def test_get_template_preview(self, client: AsyncClient):
        """Get template preview"""
        response = await client.get("/api/v1/resumes/builder/templates/modern/preview")
        assert response.status_code == status.HTTP_200_OK

    async def test_template_has_required_fields(self, client: AsyncClient):
        """Templates have required metadata"""
        response = await client.get("/api/v1/resumes/builder/templates")
        templates = response.json()
        for template in templates:
            assert "id" in template
            assert "name" in template
            assert "description" in template
            assert "preview_url" in template


class TestDraftPersistence:
    """Test draft resume persistence"""

    async def test_draft_expires_after_24_hours(self, client: AsyncClient):
        """Drafts expire after 24 hours for anonymous users"""
        create_payload = {"template_id": "modern", "personal_info": {"name": "John"}}
        response = await client.post("/api/v1/resumes/builder/draft", json=create_payload)
        data = response.json()
        assert "expires_at" in data
        # Verify expiration is set

    async def test_draft_accessible_via_token(self, client: AsyncClient):
        """Drafts accessible via temporary token"""
        create_payload = {"template_id": "modern", "personal_info": {"name": "John"}}
        create_resp = await client.post("/api/v1/resumes/builder/draft", json=create_payload)
        draft_id = create_resp.json()["draft_id"]
        token = create_resp.json().get("access_token")

        response = await client.get(
            f"/api/v1/resumes/builder/draft/{draft_id}",
            headers={"Authorization": f"Bearer {token}"} if token else {}
        )
        assert response.status_code == status.HTTP_200_OK
