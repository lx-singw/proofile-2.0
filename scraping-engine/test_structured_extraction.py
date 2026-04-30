"""
Quick test script to verify structured requirements extraction
"""
import json
import subprocess
import sys

def test_capitec_extraction():
    """Test extraction of Capitec job with structured requirements"""
    
    url = "https://www.studentroom.co.za/capitec-bank-is-hiring-service-consultant-3/"
    
    print(f"Testing: {url}")
    print("-" * 80)
    
    # Run Scrapy with proper URL
    cmd = [
        "scrapy", "crawl", "studentroom",
        "-a", f"start_urls={url}",
        "-a", "max_pages=1",
        "-o", "/tmp/test_capitec.json",
        "--loglevel=INFO"
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"❌ Scraping failed:")
        print(result.stderr)
        return False
    
    # Load results
    try:
        with open('/tmp/test_capitec.json', 'r') as f:
            data = json.load(f)
            
        if not data:
            print("❌ No items scraped")
            return False
            
        item = data[0]
        raw_data = json.loads(item.get('raw_data', '{}'))
        structured_req = raw_data.get('structured_requirements', {})
        
        # Verify key fields
        print("\n✅ Item scraped successfully")
        print(f"   Title: {item.get('title')}")
        print(f"   Company: {item.get('company')}")
        print(f"   Canonical Link: {item.get('canonical_link')}")
        
        # Check structured requirements
        print("\n📋 Structured Requirements:")
        
        if structured_req.get('qualifications'):
            quals = structured_req['qualifications']
            print(f"   ✓ Qualifications (min): {quals.get('minimum', {}).get('degree_level')}")
            print(f"   ✓ Qualifications (ideal): {quals.get('ideal', {}).get('degree_level')}")
        
        if structured_req.get('experience'):
            exp = structured_req['experience']
            print(f"   ✓ Experience (min): {exp.get('minimum', {}).get('years_min')}-{exp.get('minimum', {}).get('years_max')} years")
            print(f"   ✓ Experience (ideal): {exp.get('ideal', {}).get('years_min')}+ years")
        
        if structured_req.get('skills'):
            print(f"   ✓ Skills: {len(structured_req['skills'])} found")
            for skill in structured_req['skills'][:3]:
                print(f"       - {skill.get('name')} ({skill.get('level')})")
        
        if structured_req.get('application_url'):
            app_url = structured_req['application_url']
            print(f"\n🔗 Application URL: {app_url}")
            if 'capitecbank.co.za' in app_url:
                print("   ✅ Direct Capitec link found!")
            else:
                print("   ⚠️  Not a direct Capitec link")
        
        if structured_req.get('conditions_of_employment'):
            print(f"\n📝 Conditions: {len(structured_req['conditions_of_employment'])} found")
        
        return True
        
    except Exception as e:
        print(f"❌ Error parsing results: {e}")
        return False

if __name__ == "__main__":
    success = test_capitec_extraction()
    sys.exit(0 if success else 1)
