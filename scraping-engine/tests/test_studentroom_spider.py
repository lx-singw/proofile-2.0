"""
Tests for StudentRoom Spider

Tests cover:
- List page parsing (homepage, category pages)
- Detail page parsing with full content extraction
- Closing date extraction with various formats
- Company name extraction from titles
- Location detection for SA provinces and cities
- Opportunity type detection
- External application URL extraction
- Eligibility criteria extraction
- Required documents extraction
- Pagination handling
"""
import pytest
import json
from scrapy.http import HtmlResponse, Request
from spiders.portals.studentroom_spider import StudentRoomSpider


class TestStudentRoomSpiderListParsing:
    """Tests for list page parsing (parse method)"""
    
    def test_parse_homepage_with_opportunities(self):
        """Test parsing homepage with opportunity cards"""
        spider = StudentRoomSpider()
        
        html = """
        <html>
            <body>
                <article class="post">
                    <h2><a href="https://www.studentroom.co.za/bmw-yes4youth-internships-2026/">BMW Yes4Youth Internships 2026</a></h2>
                    <div class="entry-content">
                        <p>BMW Group South Africa invites unemployed youth to apply...</p>
                    </div>
                    <a rel="category tag" href="/category/internships/">Internships SA</a>
                </article>
                <article class="post">
                    <h2><a href="https://www.studentroom.co.za/eskom-bursaries-2026/">Eskom Bursaries 2026</a></h2>
                    <div class="entry-content">
                        <p>Eskom is offering bursaries to deserving students...</p>
                    </div>
                    <a rel="category tag" href="/category/bursaries/">SA Bursaries</a>
                </article>
                <a rel="next" href="https://www.studentroom.co.za/page/2/">Next</a>
            </body>
        </html>
        """
        
        response = HtmlResponse(
            url="https://www.studentroom.co.za/",
            body=html.encode('utf-8'),
            encoding='utf-8'
        )
        
        results = list(spider.parse(response))
        
        # Should have 3 results: 2 detail page requests + 1 pagination request
        assert len(results) == 3
        
        # Check first opportunity request
        bmw_request = results[0]
        assert "bmw-yes4youth-internships-2026" in bmw_request.url
        assert bmw_request.meta['item']['title'] == "BMW Yes4Youth Internships 2026"
        assert bmw_request.meta['item']['type'] == 'internship'
        
        # Check second opportunity request
        eskom_request = results[1]
        assert "eskom-bursaries-2026" in eskom_request.url
        assert eskom_request.meta['item']['title'] == "Eskom Bursaries 2026"
        assert eskom_request.meta['item']['type'] == 'bursary'
        
        # Check pagination request
        pagination_request = results[2]
        assert "page/2" in pagination_request.url

    def test_parse_skips_non_opportunity_urls(self):
        """Test that author, tag, and category pages are skipped"""
        spider = StudentRoomSpider()
        
        html = """
        <html>
            <body>
                <article class="post">
                    <h2><a href="https://www.studentroom.co.za/author/nokoz/">Author Profile</a></h2>
                </article>
                <article class="post">
                    <h2><a href="https://www.studentroom.co.za/tag/graduates24/">Tag Page</a></h2>
                </article>
                <article class="post">
                    <h2><a href="https://www.studentroom.co.za/real-opportunity-2026/">Real Opportunity</a></h2>
                </article>
            </body>
        </html>
        """
        
        response = HtmlResponse(
            url="https://www.studentroom.co.za/",
            body=html.encode('utf-8'),
            encoding='utf-8'
        )
        
        results = list(spider.parse(response))
        
        # Should only have 1 result (the real opportunity)
        assert len(results) == 1
        assert "real-opportunity-2026" in results[0].url

    def test_parse_max_pages_limit(self):
        """Test that pagination respects max_pages limit"""
        spider = StudentRoomSpider(max_pages=1)
        spider.pages_crawled = 1  # Simulate already at limit
        
        html = """
        <html>
            <body>
                <article class="post">
                    <h2><a href="https://www.studentroom.co.za/opportunity/">Opportunity</a></h2>
                </article>
                <a rel="next" href="https://www.studentroom.co.za/page/2/">Next</a>
            </body>
        </html>
        """
        
        response = HtmlResponse(
            url="https://www.studentroom.co.za/",
            body=html.encode('utf-8'),
            encoding='utf-8'
        )
        
        results = list(spider.parse(response))
        
        # Should have 1 result (opportunity) but NO pagination (at limit)
        assert len(results) == 1
        assert all("page/2" not in str(r.url) for r in results)


class TestStudentRoomSpiderDetailParsing:
    """Tests for detail page parsing (parse_detail method)"""
    
    def test_parse_detail_full_content(self):
        """Test parsing a complete detail page"""
        spider = StudentRoomSpider()
        
        item = {
            'title': 'BMW Yes4Youth Internships 2026',
            'source_platform': 'studentroom',
            'type': 'internship',
        }
        
        html = """
        <html>
            <head>
                <title>BMW Yes4Youth Internships 2026 - StudentRoom.co.za</title>
            </head>
            <body>
                <article>
                    <h1 class="entry-title">BMW Yes4Youth Internships 2026</h1>
                    <div class="entry-content">
                        <p>BMW Group South Africa invites unemployed South African youth aged 18 to 34 years to apply for the Yes4Youth Student Programme 2026.</p>
                        <p>Location: Midrand Campus, Johannesburg, Gauteng</p>
                        <h2>Closing Date</h2>
                        <p>Application Closing Date: 31 December 2025</p>
                        <h2>How to Apply</h2>
                        <p>Apply via the BMW Career Portal: <a href="https://www.bmwgroup.jobs/us/en/jobfinder/job-description.175018.html">Click here to apply</a></p>
                        <h2>Documents Required</h2>
                        <ul>
                            <li>CV</li>
                            <li>Certified copy of ID</li>
                            <li>Matric certificate</li>
                            <li>Academic transcript</li>
                        </ul>
                    </div>
                </article>
            </body>
        </html>
        """
        
        request = Request(
            url="https://www.studentroom.co.za/bmw-yes4youth-internships-2026/",
            meta={'item': item, 'studentroom_url': 'https://www.studentroom.co.za/bmw-yes4youth-internships-2026/'}
        )
        response = HtmlResponse(
            url="https://www.studentroom.co.za/bmw-yes4youth-internships-2026/",
            body=html.encode('utf-8'),
            encoding='utf-8',
            request=request
        )
        
        results = list(spider.parse_detail(response))
        
        assert len(results) == 1
        final_item = results[0]
        
        # Check basic fields
        assert final_item['title'] == "BMW Yes4Youth Internships 2026"
        # Company extraction gets "BMW Yes4Youth" (everything before "Internships")
        assert 'BMW' in final_item['company']
        assert final_item['type'] == 'internship'
        assert final_item['source_platform'] == 'studentroom'
        
        # Check location extraction
        assert 'Gauteng' in final_item['location'] or 'Johannesburg' in final_item['location']
        
        # Check external URL extraction
        assert 'bmwgroup.jobs' in final_item['original_url']
        
        # Check description
        assert 'BMW Group South Africa' in final_item['description_full']
        
        # Check raw_data contains expected fields
        raw_data = json.loads(final_item['raw_data'])
        assert raw_data['closing_date_parsed'] == '2025-12-31'
        assert 'cv' in raw_data['required_documents']
        assert 'id_document' in raw_data['required_documents']
        assert raw_data['eligibility']['age_min'] == 18
        assert raw_data['eligibility']['age_max'] == 34

    def test_parse_detail_missing_external_url(self):
        """Test handling of pages without external application URL"""
        spider = StudentRoomSpider()
        
        item = {'title': 'Test Opportunity', 'source_platform': 'studentroom'}
        
        html = """
        <html>
            <body>
                <article>
                    <div class="entry-content">
                        <p>Apply by email to hr@company.co.za</p>
                    </div>
                </article>
            </body>
        </html>
        """
        
        request = Request(
            url="https://www.studentroom.co.za/test-opportunity/",
            meta={'item': item, 'studentroom_url': 'https://www.studentroom.co.za/test-opportunity/'}
        )
        response = HtmlResponse(
            url="https://www.studentroom.co.za/test-opportunity/",
            body=html.encode('utf-8'),
            encoding='utf-8',
            request=request
        )
        
        results = list(spider.parse_detail(response))
        
        assert len(results) == 1
        # Should fall back to StudentRoom URL
        assert results[0]['original_url'] == 'https://www.studentroom.co.za/test-opportunity/'


class TestClosingDateExtraction:
    """Tests for closing date extraction"""
    
    @pytest.mark.parametrize("date_text,expected_parsed", [
        ("Closing Date: 31 December 2025", "2025-12-31"),
        ("Application Deadline: 02 January 2026", "2026-01-02"),
        ("Applications close on 30 December 2025", "2025-12-30"),
        ("Deadline: 15 Jan 2026", "2026-01-15"),
        ("The closing date is 28 February 2026", "2026-02-28"),
    ])
    def test_closing_date_patterns(self, date_text, expected_parsed):
        """Test various closing date format patterns"""
        spider = StudentRoomSpider()
        
        html = f"""
        <html>
            <body>
                <article>
                    <div class="entry-content">
                        <p>{date_text}</p>
                    </div>
                </article>
            </body>
        </html>
        """
        
        request = Request(
            url="https://www.studentroom.co.za/test/",
            meta={'item': {'title': 'Test'}, 'studentroom_url': 'https://www.studentroom.co.za/test/'}
        )
        response = HtmlResponse(
            url="https://www.studentroom.co.za/test/",
            body=html.encode('utf-8'),
            encoding='utf-8',
            request=request
        )
        
        result = spider._extract_closing_date(response, "")
        
        assert result is not None
        assert result['parsed'] == expected_parsed

    def test_closing_date_not_found(self):
        """Test handling when no closing date is found"""
        spider = StudentRoomSpider()
        
        html = """
        <html>
            <body>
                <article>
                    <div class="entry-content">
                        <p>No date mentioned here.</p>
                    </div>
                </article>
            </body>
        </html>
        """
        
        request = Request(
            url="https://www.studentroom.co.za/test/",
            meta={'item': {'title': 'Test'}, 'studentroom_url': 'https://www.studentroom.co.za/test/'}
        )
        response = HtmlResponse(
            url="https://www.studentroom.co.za/test/",
            body=html.encode('utf-8'),
            encoding='utf-8',
            request=request
        )
        
        result = spider._extract_closing_date(response, "")
        
        assert result is None


class TestTypeDetection:
    """Tests for opportunity type detection"""
    
    @pytest.mark.parametrize("text,expected_type", [
        ("BMW Yes4Youth Internships 2026", "internship"),
        ("Eskom Bursaries 2026", "bursary"),
        ("Momentum Learnerships Programme", "learnership"),
        ("Artisan Apprenticeship Programme", "apprenticeship"),
        ("Graduate Development Programme 2026", "graduate_program"),
        ("Contact Centre Trainee Programme", "training_program"),
        ("Job Vacancy: Software Developer", "job"),
        ("Royal Bafokeng Holdings Y4Y Programme", "internship"),
        ("Some Random Opportunity", "opportunity"),
    ])
    def test_type_detection(self, text, expected_type):
        """Test type detection for various opportunity titles"""
        spider = StudentRoomSpider()
        
        result = spider._detect_type(text)
        
        assert result == expected_type


class TestCompanyExtraction:
    """Tests for company name extraction from titles"""
    
    def test_extract_company_from_title(self):
        """Test extracting company from opportunity title"""
        spider = StudentRoomSpider()
        
        # Create a minimal response
        html = "<html><body><article></article></body></html>"
        response = HtmlResponse(
            url="https://www.studentroom.co.za/test/",
            body=html.encode('utf-8'),
            encoding='utf-8'
        )
        
        test_cases = [
            ("BMW Yes4Youth Internships 2026", "BMW"),
            ("Eskom Engineering Bursaries 2026", "Eskom Engineering"),
            ("Royal Bafokeng Holdings Bursary Programme", "Royal Bafokeng Holdings"),
            ("Mercedes-Benz SA Internships 2026", "Mercedes-Benz"),
            ("National Treasury Graduate Programme", "National Treasury"),
        ]
        
        for title, expected_company in test_cases:
            result = spider._extract_company(title, response)
            assert expected_company in result, f"Expected '{expected_company}' in '{result}' for title '{title}'"


class TestLocationExtraction:
    """Tests for location extraction"""
    
    @pytest.mark.parametrize("content,expected_location", [
        ("Location: Gauteng Province", "Gauteng"),
        ("Based in Cape Town", "Cape Town"),
        ("Opportunities in Johannesburg", "Johannesburg"),
        ("KwaZulu-Natal region", "Kwazulu-Natal"),
        ("Pretoria office", "Pretoria"),
    ])
    def test_location_extraction(self, content, expected_location):
        """Test location extraction from various content patterns"""
        spider = StudentRoomSpider()
        
        html = f"""
        <html>
            <body>
                <article>
                    <div class="entry-content">
                        <p>{content}</p>
                    </div>
                </article>
            </body>
        </html>
        """
        
        response = HtmlResponse(
            url="https://www.studentroom.co.za/test/",
            body=html.encode('utf-8'),
            encoding='utf-8'
        )
        
        result = spider._extract_location(response)
        
        assert result is not None
        assert expected_location.lower() in result.lower()


class TestEligibilityExtraction:
    """Tests for eligibility criteria extraction"""
    
    def test_extract_age_range(self):
        """Test extracting age requirements"""
        spider = StudentRoomSpider()
        
        description = "South African youth aged 18 to 34 years who are unemployed"
        
        result = spider._extract_eligibility(description)
        
        assert result['age_min'] == 18
        assert result['age_max'] == 34
        assert result['citizenship'] == 'South African'
        assert result['employment_status'] == 'unemployed'

    def test_extract_citizenship_only(self):
        """Test extracting citizenship requirement only"""
        spider = StudentRoomSpider()
        
        description = "Must be a South African citizen"
        
        result = spider._extract_eligibility(description)
        
        assert result['citizenship'] == 'South African'
        assert 'age_min' not in result


class TestRequiredDocumentsExtraction:
    """Tests for required documents extraction"""
    
    def test_extract_all_documents(self):
        """Test extracting multiple document requirements"""
        spider = StudentRoomSpider()
        
        description = """
        Please submit the following:
        - CV (Curriculum Vitae)
        - Certified copy of ID
        - Matric certificate
        - Academic transcript
        - Proof of residence
        """
        
        result = spider._extract_required_documents(description)
        
        assert 'cv' in result
        assert 'id_document' in result
        assert 'matric_certificate' in result
        assert 'academic_transcript' in result
        assert 'proof_of_residence' in result

    def test_extract_no_documents(self):
        """Test handling when no documents are mentioned"""
        spider = StudentRoomSpider()
        
        description = "Apply online through our portal"
        
        result = spider._extract_required_documents(description)
        
        assert result == []


class TestApplicationUrlExtraction:
    """Tests for external application URL extraction"""
    
    def test_extract_priority_domain_url(self):
        """Test that priority career portal URLs are preferred"""
        spider = StudentRoomSpider()
        
        html = """
        <html>
            <body>
                <article>
                    <a href="https://random-site.com/apply">Random Link</a>
                    <a href="https://www.bmwgroup.jobs/za/en/job-123.html">Apply at BMW</a>
                    <a href="https://www.studentroom.co.za/other/">StudentRoom Link</a>
                </article>
            </body>
        </html>
        """
        
        response = HtmlResponse(
            url="https://www.studentroom.co.za/test/",
            body=html.encode('utf-8'),
            encoding='utf-8'
        )
        
        result = spider._extract_application_url(response)
        
        assert 'bmwgroup.jobs' in result

    def test_filter_out_studentroom_urls(self):
        """Test that StudentRoom URLs are filtered out"""
        spider = StudentRoomSpider()
        
        html = """
        <html>
            <body>
                <article>
                    <a href="https://www.studentroom.co.za/category/bursaries/">Bursaries</a>
                    <a href="https://external-careers.com/apply">Apply Here</a>
                </article>
            </body>
        </html>
        """
        
        response = HtmlResponse(
            url="https://www.studentroom.co.za/test/",
            body=html.encode('utf-8'),
            encoding='utf-8'
        )
        
        result = spider._extract_application_url(response)
        
        assert 'studentroom' not in result.lower()
        assert 'external-careers' in result


class TestIntegration:
    """Integration tests for the complete spider flow"""
    
    def test_full_scraping_flow(self):
        """Test complete flow from list page to detail page"""
        spider = StudentRoomSpider()
        
        # Simulate list page
        list_html = """
        <html>
            <body>
                <article class="post">
                    <h2><a href="https://www.studentroom.co.za/test-bursary-2026/">Test Bursary 2026</a></h2>
                    <p>Short description here...</p>
                </article>
            </body>
        </html>
        """
        
        list_response = HtmlResponse(
            url="https://www.studentroom.co.za/",
            body=list_html.encode('utf-8'),
            encoding='utf-8'
        )
        
        list_results = list(spider.parse(list_response))
        
        assert len(list_results) == 1
        assert list_results[0].callback == spider.parse_detail
        
        # Simulate detail page
        detail_html = """
        <html>
            <body>
                <article>
                    <h1 class="entry-title">Test Company Bursary 2026</h1>
                    <div class="entry-content">
                        <p>Test Company invites South African students to apply for bursaries.</p>
                        <p>Closing Date: 31 January 2026</p>
                        <p>Location: Johannesburg, Gauteng</p>
                        <a href="https://careers.testcompany.co.za/apply">Apply Here</a>
                    </div>
                </article>
            </body>
        </html>
        """
        
        detail_request = Request(
            url="https://www.studentroom.co.za/test-bursary-2026/",
            meta={
                'item': list_results[0].meta['item'],
                'studentroom_url': 'https://www.studentroom.co.za/test-bursary-2026/'
            }
        )
        detail_response = HtmlResponse(
            url="https://www.studentroom.co.za/test-bursary-2026/",
            body=detail_html.encode('utf-8'),
            encoding='utf-8',
            request=detail_request
        )
        
        detail_results = list(spider.parse_detail(detail_response))
        
        assert len(detail_results) == 1
        final_item = detail_results[0]
        
        # Verify all critical fields are extracted
        # Note: title comes from list page meta, gets updated if detail page has different h1
        assert 'Bursary 2026' in final_item['title']
        assert 'Test' in final_item['company']  # Company extracted from title
        assert final_item['type'] == 'bursary'
        assert 'Johannesburg' in final_item['location'] or 'Gauteng' in final_item['location']
        assert 'careers.testcompany.co.za' in final_item['original_url']
        
        raw_data = json.loads(final_item['raw_data'])
        assert raw_data['closing_date_parsed'] == '2026-01-31'
