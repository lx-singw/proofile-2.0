"""PDF generation service for resumes using WeasyPrint"""
from weasyprint import HTML, CSS
from jinja2 import Environment, FileSystemLoader, select_autoescape
import os
from pathlib import Path

# Get the templates directory
TEMPLATES_DIR = Path(__file__).parent.parent / "templates" / "resume"

# Setup Jinja2 environment
jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(['html', 'xml'])
)

def generate_resume_pdf(template_id: str, resume_data: dict) -> bytes:
    """
    Generate a PDF from resume data using the specified template.
    
    Args:
        template_id: Template identifier ('modern', 'classic', 'minimal')
        resume_data: Resume data dictionary
    
    Returns:
        PDF file as bytes
    """
    # Map template IDs to template files
    template_map = {
        'modern': 'modern.html',
        'classic': 'classic.html',
        'minimal': 'minimal.html',
    }
    
    template_file = template_map.get(template_id, 'modern.html')
    
    try:
        # Load and render the template
        template = jinja_env.get_template(template_file)
        html_content = template.render(data=resume_data)
        
        # Generate PDF from HTML
        pdf = HTML(string=html_content).write_pdf()
        
        return pdf
    except Exception as e:
        # Fallback to a simple error PDF
        error_html = f"""
        <html>
            <body style="font-family: Arial; padding: 40px;">
                <h1>Error Generating Resume</h1>
                <p>Template: {template_id}</p>
                <p>Error: {str(e)}</p>
            </body>
        </html>
        """
        return HTML(string=error_html).write_pdf()
