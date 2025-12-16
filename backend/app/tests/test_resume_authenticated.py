"""
Test suite for Phase 2: Authenticated Resume Features
Tests authenticated users can save, download, and manage resumes.
"""
import pytest
from fastapi import status
from httpx import AsyncClient


class TestAuthenticatedResumeAccess:
    """Test authenticated resume functionality"""

    async def test_save_resume_with_auth(self, client: AsyncClient, auth_headers: dict):
        """Authenticated users can save resumes"""
        # Create draft
        create_payload = {"template_id": "modern", "personal_info": {"name": "John"}}
        create_resp = await client.post("/api/v1/resumes/builder/draft", json=create_payload)
        draft_id = create_resp.json()["draft_id"]

        # Save with auth
        response = await client.post(
            f"/api/v1/resumes/builder/draft/{draft_id}/save",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "resume_id" in data
        assert data["is_temporary"] is False

    async def test_download_resume_with_auth(self, client: AsyncClient, auth_headers: dict):
        """Authenticated users can download resumes"""
        # Create and save
        create_payload = {"template_id": "modern", "personal_info": {"name": "John"}}
        create_resp = await client.post("/api/v1/resumes/builder/draft", json=create_payload)
        draft_id = create_resp.json()["draft_id"]
        save_resp = await client.post(
            f"/api/v1/resumes/builder/draft/{draft_id}/save",
            headers=auth_headers
        )
        resume_id = save_resp.json()["resume_id"]

        # Download
        response = await client.get(
            f"/api/v1/resumes/{resume_id}/download",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["content-type"] == "application/pdf"

    async def test_list_user_resumes(self, client: AsyncClient, auth_headers: dict):
        """Authenticated users can list their resumes"""
        response = await client.get("/api/v1/resumes", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

    async def test_update_saved_resume(self, client: AsyncClient, auth_headers: dict):
        """Authenticated users can update saved resumes"""
        # Create and save
        create_payload = {"template_id": "modern", "personal_info": {"name": "John"}}
        create_resp = await client.post("/api/v1/resumes/builder/draft", json=create_payload)
        draft_id = create_resp.json()["draft_id"]
        save_resp = await client.post(
            f"/api/v1/resumes/builder/draft/{draft_id}/save",
            headers=auth_headers
        )
        resume_id = save_resp.json()["resume_id"]

        # Update
        update_payload = {"personal_info": {"name": "John Updated"}}
        response = await client.patch(
            f"/api/v1/resumes/{resume_id}",
            json=update_payload,
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK

    async def test_delete_resume(self, client: AsyncClient, auth_headers: dict):
        """Authenticated users can delete resumes"""
        # Create and save
        create_payload = {"template_id": "modern", "personal_info": {"name": "John"}}
        create_resp = await client.post("/api/v1/resumes/builder/draft", json=create_payload)
        draft_id = create_resp.json()["draft_id"]
        save_resp = await client.post(
            f"/api/v1/resumes/builder/draft/{draft_id}/save",
            headers=auth_headers
        )
        resume_id = save_resp.json()["resume_id"]

        # Delete
        response = await client.delete(
            f"/api/v1/resumes/{resume_id}",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT


class TestResumeImprovements:
    """Test AI improvement features for authenticated users"""

    async def test_apply_improvements(self, client: AsyncClient, auth_headers: dict):
        """Authenticated users can apply AI improvements"""
        # Upload resume
        files = {"file": ("test.pdf", b"content", "application/pdf")}
        upload_resp = await client.post("/api/v1/resumes/upload", files=files)
        resume_id = upload_resp.json()["resume_id"]

        # Apply improvements
        response = await client.post(
            f"/api/v1/resumes/{resume_id}/apply-improvements",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "improved_resume_id" in data

    async def test_get_improvement_preview(self, client: AsyncClient, auth_headers: dict):
        """Get preview of improvements before applying"""
        files = {"file": ("test.pdf", b"content", "application/pdf")}
        upload_resp = await client.post("/api/v1/resumes/upload", files=files)
        resume_id = upload_resp.json()["resume_id"]

        response = await client.get(
            f"/api/v1/resumes/{resume_id}/improvements/preview",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "improvements" in data
        assert "before" in data
        assert "after" in data


class TestResumeVersioning:
    """Test resume version control"""

    async def test_create_resume_version(self, client: AsyncClient, auth_headers: dict):
        """Create new version of resume"""
        # Create and save
        create_payload = {"template_id": "modern", "personal_info": {"name": "John"}}
        create_resp = await client.post("/api/v1/resumes/builder/draft", json=create_payload)
        draft_id = create_resp.json()["draft_id"]
        save_resp = await client.post(
            f"/api/v1/resumes/builder/draft/{draft_id}/save",
            headers=auth_headers
        )
        resume_id = save_resp.json()["resume_id"]

        # Create version
        response = await client.post(
            f"/api/v1/resumes/{resume_id}/versions",
            json={"description": "Updated for tech role"},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED

    async def test_list_resume_versions(self, client: AsyncClient, auth_headers: dict):
        """List all versions of a resume"""
        create_payload = {"template_id": "modern", "personal_info": {"name": "John"}}
        create_resp = await client.post("/api/v1/resumes/builder/draft", json=create_payload)
        draft_id = create_resp.json()["draft_id"]
        save_resp = await client.post(
            f"/api/v1/resumes/builder/draft/{draft_id}/save",
            headers=auth_headers
        )
        resume_id = save_resp.json()["resume_id"]

        response = await client.get(
            f"/api/v1/resumes/{resume_id}/versions",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), list)

    async def test_restore_resume_version(self, client: AsyncClient, auth_headers: dict):
        """Restore previous version of resume"""
        create_payload = {"template_id": "modern", "personal_info": {"name": "John"}}
        create_resp = await client.post("/api/v1/resumes/builder/draft", json=create_payload)
        draft_id = create_resp.json()["draft_id"]
        save_resp = await client.post(
            f"/api/v1/resumes/builder/draft/{draft_id}/save",
            headers=auth_headers
        )
        resume_id = save_resp.json()["resume_id"]

        # Create version
        version_resp = await client.post(
            f"/api/v1/resumes/{resume_id}/versions",
            json={"description": "Version 1"},
            headers=auth_headers
        )
        version_id = version_resp.json()["version_id"]

        # Restore
        response = await client.post(
            f"/api/v1/resumes/{resume_id}/versions/{version_id}/restore",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
