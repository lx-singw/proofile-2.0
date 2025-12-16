"""
OpenAI Vision Integration
Wrapper for GPT-4o Vision API for document OCR
"""

import os
import base64
import logging
from typing import Dict, Any, Optional
import json

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


async def extract_document_data(
    content: bytes,
    content_type: str,
    document_type: str
) -> Dict[str, Any]:
    """
    Extract structured data from a document image using GPT-4o Vision.
    
    Args:
        content: Raw file bytes
        content_type: MIME type (image/jpeg, image/png, application/pdf)
        document_type: Type of document (employment, education)
    
    Returns:
        Extracted structured data
    """
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not configured")
    
    # Convert to base64
    base64_content = base64.b64encode(content).decode("utf-8")
    
    # Build prompt based on document type
    prompt = _get_extraction_prompt(document_type)
    
    try:
        import openai
        client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
        
        # Handle PDF differently (extract first page as image)
        if content_type == "application/pdf":
            base64_content = await _pdf_to_base64_image(content)
            content_type = "image/png"
        
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a document analysis expert. Extract structured data from documents accurately. Return only valid JSON."
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{content_type};base64,{base64_content}",
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000,
            response_format={"type": "json_object"}
        )
        
        result_text = response.choices[0].message.content
        result = json.loads(result_text)
        
        # Add confidence score based on the model's assessment
        if "confidence" not in result:
            result["confidence"] = 0.9  # Default high confidence for GPT-4o
        
        return result
        
    except openai.APIError as e:
        logger.error(f"OpenAI API error: {e}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse OpenAI response: {e}")
        raise ValueError("Could not parse document data")


def _get_extraction_prompt(document_type: str) -> str:
    """Get the appropriate extraction prompt for document type"""
    
    if document_type == "employment":
        return """
Analyze this employment document (paystub, offer letter, or employment verification).
Extract and return a JSON object with the following fields:
{
    "company_name": "The employer's company name",
    "job_title": "The employee's job title/position",
    "dates": {
        "start": "Start date in YYYY-MM format if found",
        "end": "End date in YYYY-MM format or 'present' if current"
    },
    "salary": "Annual or hourly salary if visible (null if not found)",
    "employee_name": "Employee name if visible",
    "document_type": "paystub/offer_letter/verification_letter/w2/other",
    "confidence": 0.0-1.0 confidence score for the extraction
}
Return only valid JSON. If a field cannot be determined, use null.
"""
    
    elif document_type == "education":
        return """
Analyze this education document (transcript, diploma, or certificate).
Extract and return a JSON object with the following fields:
{
    "institution_name": "The school/university name",
    "degree": "Degree type (e.g., Bachelor's, Master's, PhD)",
    "field_of_study": "Major or field of study",
    "graduation_date": "Graduation date in YYYY-MM format",
    "student_name": "Student name if visible",
    "gpa": "GPA if visible (null if not found)",
    "document_type": "transcript/diploma/certificate/other",
    "confidence": 0.0-1.0 confidence score for the extraction
}
Return only valid JSON. If a field cannot be determined, use null.
"""
    
    else:
        return """
Analyze this document and extract any relevant information.
Return a JSON object with all detected fields including:
- Names, dates, organizations mentioned
- Any numerical data (amounts, scores, etc.)
- Document type and confidence score
"""


async def _pdf_to_base64_image(pdf_content: bytes) -> str:
    """Convert first page of PDF to base64 image"""
    try:
        import fitz  # PyMuPDF
        
        doc = fitz.open(stream=pdf_content, filetype="pdf")
        page = doc[0]  # First page
        
        # Render at 2x resolution for better OCR
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img_bytes = pix.tobytes("png")
        
        return base64.b64encode(img_bytes).decode("utf-8")
        
    except ImportError:
        logger.warning("PyMuPDF not installed, returning raw PDF")
        return base64.b64encode(pdf_content).decode("utf-8")


async def analyze_document_authenticity(
    content: bytes,
    content_type: str
) -> Dict[str, Any]:
    """
    Analyze a document for signs of manipulation or fraud.
    
    Returns:
        {
            "authentic": bool,
            "confidence": float,
            "issues": list of detected issues
        }
    """
    if not OPENAI_API_KEY:
        return {"authentic": True, "confidence": 0.5, "issues": ["API not configured"]}
    
    base64_content = base64.b64encode(content).decode("utf-8")
    
    try:
        import openai
        client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
        
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a document fraud detection expert. Analyze documents for signs of manipulation, forgery, or suspicious elements."
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """Analyze this document for authenticity. Look for:
1. Signs of digital manipulation (inconsistent fonts, misaligned text, artifacts)
2. Unusual formatting that doesn't match typical official documents
3. Missing expected elements (letterhead, signatures, dates)
4. Any other red flags

Return a JSON object:
{
    "authentic": true/false (your assessment),
    "confidence": 0.0-1.0,
    "issues": ["list", "of", "detected", "issues"]
}"""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{content_type};base64,{base64_content}",
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        logger.error(f"Authenticity check failed: {e}")
        return {"authentic": True, "confidence": 0.5, "issues": [str(e)]}
