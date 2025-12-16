from typing import List, Dict

TEMPLATES = [
    {
        "id": "modern",
        "name": "Modern Professional",
        "description": "Clean, minimalist design suitable for tech and creative roles.",
        "thumbnail": "/templates/modern.png",
        "styles": {
            "font": "Inter",
            "primaryColor": "#2563eb",
            "layout": "single-column"
        }
    },
    {
        "id": "classic",
        "name": "Classic Executive",
        "description": "Traditional layout perfect for corporate and management positions.",
        "thumbnail": "/templates/classic.png",
        "styles": {
            "font": "Times New Roman",
            "primaryColor": "#1f2937",
            "layout": "two-column"
        }
    },
    {
        "id": "creative",
        "name": "Creative Portfolio",
        "description": "Bold design that highlights skills and projects.",
        "thumbnail": "/templates/creative.png",
        "styles": {
            "font": "Poppins",
            "primaryColor": "#7c3aed",
            "layout": "creative-grid"
        }
    }
]

def get_all_templates() -> List[Dict]:
    return TEMPLATES

def get_template_by_id(template_id: str) -> Dict:
    return next((t for t in TEMPLATES if t["id"] == template_id), None)
