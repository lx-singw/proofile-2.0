"""
Test suite for Phase 2: Resume Upload & Analyze (Anonymous Access)
Tests anonymous users can upload and analyze resumes with paywall triggers.
"""
import pytest
from fastapi import status
from httpx import AsyncClient


class TestAnonymousResumeUpload:
    """Test anonymous resume upload functionality"""

    async def test_upload_resume_without_auth(self, client: AsyncClient):
        """Anonymous users can upload resumes"""
        files = {"file": ("test_resume.pdf", b"fake pdf content", "application/pdf")}
        response = await client.post("/api/v1/resumes/upload", files=files)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "resume_id" in data
        assert "analysis" in data

    async def test_upload_resume_text_without_auth(self, client: AsyncClient):
        """Anonymous users can upload resume text"""
        payload = {"text": "John Doe\nSoftware Engineer\n5 years experience"}
        response = await client.post("/api/v1/resumes/upload/text", json=payload)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "resume_id" in data
        assert "analysis" in data

    async def test_get_analysis_without_auth(self, client: AsyncClient):
        """Anonymous users can view analysis results"""
        # First upload
        files = {"file": ("test.pdf", b"content", "application/pdf")}
        upload_resp = await client.post("/api/v1/resumes/upload", files=files)
        resume_id = upload_resp.json()["resume_id"]

        # Then get analysis
        response = await client.get(f"/api/v1/resumes/{resume_id}/analysis")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "score" in data
        assert "suggestions" in data
        assert "keywords" in data

    async def test_cannot_apply_improvements_without_auth(self, client: AsyncClient):
        """Anonymous users hit paywall when applying improvements"""
        files = {"file": ("test.pdf", b"content", "application/pdf")}
        upload_resp = await client.post("/api/v1/resumes/upload", files=files)
        resume_id = upload_resp.json()["resume_id"]

        response = await client.post(f"/api/v1/resumes/{resume_id}/apply-improvements")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "sign up" in response.json()["detail"].lower()

    async def test_cannot_download_without_auth(self, client: AsyncClient):
        """Anonymous users cannot download resumes"""
        files = {"file": ("test.pdf", b"content", "application/pdf")}
        upload_resp = await client.post("/api/v1/resumes/upload", files=files)
        resume_id = upload_resp.json()["resume_id"]

        response = await client.get(f"/api/v1/resumes/{resume_id}/download")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_cannot_save_without_auth(self, client: AsyncClient):
        """Anonymous users cannot save resumes"""
        files = {"file": ("test.pdf", b"content", "application/pdf")}
        upload_resp = await client.post("/api/v1/resumes/upload", files=files)
        resume_id = upload_resp.json()["resume_id"]

        response = await client.post(f"/api/v1/resumes/{resume_id}/save")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestResumeAnalysisQuality:
    """Test resume analysis quality and scoring"""

    async def test_analysis_includes_score(self, client: AsyncClient):
        """Analysis includes numerical score"""
        files = {"file": ("test.pdf", b"content", "application/pdf")}
        response = await client.post("/api/v1/resumes/upload", files=files)
        data = response.json()
        assert "analysis" in data
        assert "score" in data["analysis"]
        assert 0 <= data["analysis"]["score"] <= 100

    async def test_analysis_includes_suggestions(self, client: AsyncClient):
        """Analysis includes improvement suggestions"""
        files = {"file": ("test.pdf", b"content", "application/pdf")}
        response = await client.post("/api/v1/resumes/upload", files=files)
        data = response.json()
        assert "suggestions" in data["analysis"]
        assert isinstance(data["analysis"]["suggestions"], list)

    async def test_analysis_includes_keywords(self, client: AsyncClient):
        """Analysis includes keyword analysis"""
        files = {"file": ("test.pdf", b"content", "application/pdf")}
        response = await client.post("/api/v1/resumes/upload", files=files)
        data = response.json()
        assert "keywords" in data["analysis"]
        assert isinstance(data["analysis"]["keywords"], list)

    async def test_analysis_includes_ats_score(self, client: AsyncClient):
        """Analysis includes ATS compatibility score"""
        files = {"file": ("test.pdf", b"content", "application/pdf")}
        response = await client.post("/api/v1/resumes/upload", files=files)
        data = response.json()
        assert "ats_score" in data["analysis"]
        assert 0 <= data["analysis"]["ats_score"] <= 100


class TestResumeFileValidation:
    """Test file upload validation"""

    async def test_reject_invalid_file_type(self, client: AsyncClient):
        """Reject non-PDF/DOCX files"""
        files = {"file": ("test.txt", b"content", "text/plain")}
        response = await client.post("/api/v1/resumes/upload", files=files)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    async def test_reject_oversized_file(self, client: AsyncClient):
        """Reject files over size limit"""
        large_content = b"x" * (10 * 1024 * 1024 + 1)  # 10MB + 1 byte
        files = {"file": ("test.pdf", large_content, "application/pdf")}
        response = await client.post("/api/v1/resumes/upload", files=files)
        assert response.status_code == status.HTTP_413_REQUEST_ENTITY_TOO_LARGE

    async def test_accept_pdf_file(self, client: AsyncClient):
        """Accept valid PDF files"""
        files = {"file": ("test.pdf", b"content", "application/pdf")}
        response = await client.post("/api/v1/resumes/upload", files=files)
        assert response.status_code == status.HTTP_201_CREATED

    async def test_accept_docx_file(self, client: AsyncClient):
        """Accept valid DOCX files"""
        files = {"file": ("test.docx", b"content", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        response = await client.post("/api/v1/resumes/upload", files=files)
        assert response.status_code == status.HTTP_201_CREATED
