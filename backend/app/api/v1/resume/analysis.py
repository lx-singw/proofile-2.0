import os
from fastapi import APIRouter, HTTPException, Query, UploadFile
from fastapi.responses import JSONResponse
from typing import Optional
from pdfminer.high_level import extract_text as extract_pdf_text
from mammoth import convert_to_markdown as convert_docx_to_md
import re

router = APIRouter()

# Utility functions for parsing

def parse_pdf(file_path):
    return extract_pdf_text(file_path)

def parse_docx(file_path):
    with open(file_path, "rb") as docx_file:
        result = convert_docx_to_md(docx_file)
        return result.value

def parse_txt(file_path):
    with open(file_path, "r", encoding="utf-8") as txt_file:
        return txt_file.read()

def extract_sections(text):
    # Simple regex-based section extraction
    sections = {}
    patterns = {
        "contact": r"(?i)(name|email|phone|linkedin|address|portfolio)[\s:]+(.+)",
        "summary": r"(?i)(summary|objective)[\s:]+(.+)",
        "experience": r"(?i)(experience|work history|employment)[\s:]+(.+)",
        "education": r"(?i)(education|degree|school|university)[\s:]+(.+)",
        "skills": r"(?i)(skills|technologies|tools)[\s:]+(.+)",
    }
    for key, pat in patterns.items():
        match = re.search(pat, text)
        if match:
            sections[key] = match.group(2).strip()
    return sections

def score_resume(sections):
    # Basic scoring logic (expand as needed)
    score = 0
    if "contact" in sections: score += 15
    if "summary" in sections: score += 15
    if "experience" in sections: score += 25
    if "education" in sections: score += 15
    if "skills" in sections: score += 15
    # Add more detailed scoring here
    return min(score, 100)

@router.get("/{resume_id}")
async def get_resume_analysis(resume_id: int):
    # TODO: Fetch resume file path from DB
    # For now, use a sample file
    file_path = f"/tmp/sample_resume.pdf"
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        text = parse_pdf(file_path)
    elif ext == ".docx":
        text = parse_docx(file_path)
    elif ext == ".txt":
        text = parse_txt(file_path)
    else:
        text = ""
    sections = extract_sections(text)
    score = score_resume(sections)
    return JSONResponse({
        "resume_id": resume_id,
        "score": score,
        "sections": sections,
        "raw_text": text,
    })
