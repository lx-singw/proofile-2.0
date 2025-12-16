import os
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.api import deps
from app.models.resume import Resume
from pdfminer.high_level import extract_text as extract_pdf_text
import mammoth
import re
import json

router = APIRouter()

# Utility functions for parsing

def parse_pdf(file_path):
    try:
        return extract_pdf_text(file_path)
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        return ""

def parse_docx(file_path):
    try:
        with open(file_path, "rb") as docx_file:
            result = mammoth.convert_to_markdown(docx_file)
            return result.value
    except Exception as e:
        print(f"Error parsing DOCX: {e}")
        return ""

def parse_txt(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as txt_file:
            return txt_file.read()
    except Exception as e:
        print(f"Error parsing TXT: {e}")
        return ""

def extract_sections(text):
    # Improved regex-based section extraction
    sections = {}
    # Normalize text
    text_lower = text.lower()
    
    patterns = {
        "contact": r"(?i)(name|email|phone|linkedin|address|portfolio|contact)[\s\S]{0,200}",
        "summary": r"(?i)(summary|objective|profile|about me)[\s\S]{0,500}",
        "experience": r"(?i)(experience|work history|employment|career history)[\s\S]{0,1000}",
        "education": r"(?i)(education|degree|school|university|academic)[\s\S]{0,500}",
        "skills": r"(?i)(skills|technologies|tools|competencies|expertise)[\s\S]{0,500}",
        "projects": r"(?i)(projects|portfolio|key projects)[\s\S]{0,500}",
        "certifications": r"(?i)(certifications|licenses|awards)[\s\S]{0,300}"
    }
    
    # Very basic extraction - just checking presence and grabbing some text
    # In a real app, we'd use position analysis or an LLM
    for key, pat in patterns.items():
        match = re.search(pat, text)
        if match:
            # This is a placeholder. Real extraction needs to find the *end* of the section.
            # For now, we just indicate presence and a snippet.
            sections[key] = match.group(0).strip()
            
    return sections

def calculate_scores(sections, text):
    # Basic scoring logic
    scores = {
        "ats": 70, # Base score
        "content": 60,
        "formatting": 80,
        "keywords": 50,
        "impact": 60,
        "completeness": 0
    }
    
    # Completeness
    present_sections = [k for k in ["contact", "experience", "education", "skills"] if k in sections]
    scores["completeness"] = int((len(present_sections) / 4) * 100)
    
    # ATS checks (mocked logic based on text properties)
    if len(text) > 500: scores["ats"] += 10
    if "education" in sections: scores["ats"] += 10
    
    # Keywords (mock check)
    keywords = ["python", "javascript", "react", "sql", "management", "leadership", "agile"]
    found_keywords = [k for k in keywords if k in text.lower()]
    scores["keywords"] = int((len(found_keywords) / len(keywords)) * 100)
    
    # Overall
    overall = sum(scores.values()) // len(scores)
    
    return overall, scores

@router.get("/analysis/{resume_id}")
async def get_resume_analysis(
    resume_id: str,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    try:
        from sqlalchemy import select
        result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
        resume = result.scalar_one_or_none()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
    except Exception as e:
        import logging
        logging.error(f"Error fetching resume for analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    if resume.status == 'analyzed' and resume.analysis_results:
        return JSONResponse(resume.analysis_results)

    # Perform analysis
    if not resume.file_path or not os.path.exists(resume.file_path):
        # Fallback for text-only or missing files
        text = "" 
        # If data has text content (e.g. from builder), use that? 
        # For now, assume upload flow.
    else:
        ext = os.path.splitext(resume.file_path)[1].lower()
        if ext == ".pdf":
            text = parse_pdf(resume.file_path)
        elif ext == ".docx":
            text = parse_docx(resume.file_path)
        elif ext == ".txt":
            text = parse_txt(resume.file_path)
        else:
            text = ""

    sections = extract_sections(text)
    overall_score, detailed_scores = calculate_scores(sections, text)
    
    # Construct response matching frontend expectations
    analysis_data = {
        "name": resume.name,
        "score": overall_score,
        "scores": detailed_scores,
        "stats": {
            "pages": 1, # Mock
            "experience": "3 Years", # Mock
            "role": "Detected Role", # Mock
            "location": "Detected Location", # Mock
            "words": len(text.split())
        },
        "insights": [
            "Good use of action verbs",
            "Missing some key technical skills",
            "Education section is well formatted"
        ], # Mock
        "sections": sections,
        "raw_text": text[:1000] + "..." # Truncate for response
    }

    # Update DB
    resume.status = 'analyzed'
    resume.ats_score = overall_score
    resume.analysis_results = analysis_data
    await db.commit()

    return JSONResponse(analysis_data)

@router.post("/public/analyze")
async def analyze_public_resume(
    file: UploadFile = None,
    text: str = None
):
    """
    Analyze a resume without requiring authentication.
    Returns the analysis result directly without saving to DB.
    """
    from fastapi import Form, File
    
    # Handle file upload
    content = ""
    if file:
        # Save temporarily to parse
        import tempfile
        import shutil
        
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
                shutil.copyfileobj(file.file, tmp)
                tmp_path = tmp.name
            
            ext = os.path.splitext(file.filename)[1].lower()
            if ext == ".pdf":
                content = parse_pdf(tmp_path)
            elif ext == ".docx":
                content = parse_docx(tmp_path)
            elif ext == ".txt":
                content = parse_txt(tmp_path)
            
            # Cleanup
            os.unlink(tmp_path)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")
            
    elif text:
        content = text
    else:
        raise HTTPException(status_code=400, detail="No file or text provided")

    if not content:
        raise HTTPException(status_code=400, detail="Could not extract text from resume")

    # Perform analysis
    sections = extract_sections(content)
    overall_score, detailed_scores = calculate_scores(sections, content)
    
    analysis_data = {
        "name": file.filename if file else "Pasted Resume",
        "score": overall_score,
        "scores": detailed_scores,
        "stats": {
            "pages": 1, 
            "experience": "3 Years", 
            "role": "Detected Role", 
            "location": "Detected Location", 
            "words": len(content.split())
        },
        "insights": [
            "Good use of action verbs",
            "Missing some key technical skills",
            "Education section is well formatted"
        ],
        "sections": sections,
        "raw_text": content[:1000] + "..." 
    }
    
    return JSONResponse(analysis_data)
