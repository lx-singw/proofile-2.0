# Quick Test - Structured Requirements Extraction

This test verifies that the structured extraction works with the Capitec job posting.

## Test: Scrape one StudentRoom URL

```bash
cd scraping-engine
scrapy crawl studentroom -a max_pages=1 -a start_urls="https://www.studentroom.co.za/capitec-bank-is-hiring-service-consultant-3/" -o test_capitec_structured.json
```

## Expected Output in JSON:

The `raw_data.structured_requirements` field should contain:

```json
{
  "qualifications": {
    "minimum": {
      "degree_level": "Matric"
    },
    "ideal": {
      "degree_level": "Bachelors",
      "field_of_study": "Commerce",
      "certifications": ["Finance", "Banking"]
    }
  },
  "experience": {
    "minimum": {
      "years_min": 0.25,
      "years_max": 0.5,
      "description": "3 to 6 months client service..."
    },
    "ideal": {
      "years_min": 1,
      "description": "More than 1 year client service..."
    }
  },
  "skills": [
    {"name": "Communication Skills", "level": "required"},
    {"name": "Interpersonal Skills", "level": "required"},
    {"name": "Computer Literacy", "level": "required"},
    {"name": "MS Word", "level": "required"},
    {"name": "MS Excel", "level": "required"},
    {"name": "MS Outlook", "level": "required"}
  ],
  "knowledge": {
    "minimum": ["Basic calculations", "Understanding of retail/consumer service environment"],
    "ideal": ["Capitec Bank products", "Internal business processes", "Branch Credit Granting Policy"]
  },
  "conditions_of_employment": [
    "Clear criminal record",
    "Clear credit record",
    "Fingerprints must be detectable..."
  ]
}
```

## Verification Checklist

- [ ] Spider extracts minimum qualifications: "Matric"
- [ ] Spider extracts ideal qualifications: "Bachelors in Commerce"
- [ ] Experience minimum: 0.25-0.5 years (3-6 months)
- [ ] Experience ideal: 1+ years
- [ ] Skills list includes MS Word, Excel, Outlook
- [ ] Knowledge requirements separated (minimum vs ideal)
- [ ] Conditions of employment captured
