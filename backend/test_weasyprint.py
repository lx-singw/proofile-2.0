from weasyprint import HTML
print("WeasyPrint imported successfully")
try:
    HTML(string="<h1>Hello</h1>").write_pdf()
    print("PDF generation successful")
except Exception as e:
    print(f"PDF generation failed: {e}")
