"""
Tests for enhanced link extraction in recentjobs spider.
Tests context-aware extraction of application links from "How to Apply" sections.
"""
import pytest
from scrapy.http import HtmlResponse, Request
from spiders.portals.recentjobs_spider import RecentJobsSpider


class TestRecentJobsApplicationExtraction:
    """Test suite for application link and method extraction."""
    
    @pytest.fixture
    def spider(self):
        """Create a spider instance for testing."""
        return RecentJobsSpider()
    
    def test_extract_application_url_with_how_to_apply_section(self, spider):
        """Test that links in 'How to Apply' sections are correctly extracted."""
        html = '''
        <html>
        <body>
            <article class="entry-content">
                <h2>How to Apply</h2>
                <p>
                    <a href="https://jobs.smartrecruiters.com/oneclick-ui/company/OUTsurance/publication/7af33944">
                        Click here to apply for OUTsurance OSS Hastings Learnership Programme 2026
                    </a>
                </p>
                <p>Applications must be submitted online via the OUTsurance recruitment platform.</p>
            </article>
        </body>
        </html>
        '''
        
        request = Request(url='https://recentjobs.co.za/outsurance-oss-hastings-learnerships-2026/')
        response = HtmlResponse(
            url='https://recentjobs.co.za/outsurance-oss-hastings-learnerships-2026/',
            request=request,
            body=html.encode('utf-8'),
            encoding='utf-8'
        )
        
        # Test using the spider's extraction method
        app_url = spider._extract_application_url(response)
        
        # Should extract the SmartRecruiters link
        assert app_url is not None
        assert 'smartrecruiters.com' in app_url
        assert 'OUTsurance' in app_url
    
    def test_extract_application_method_online_portal(self, spider):
        """Test that online portal application method is correctly detected."""
        text = '''
        How to Apply:
        Click here to apply for OUTsurance OSS Hastings Learnership Programme 2026
        Applications must be submitted online via the OUTsurance recruitment platform.
        '''
        
        result = spider._extract_application_method(text, has_url=True)
        
        assert result is not None
        assert result['method'] == 'online'
        assert result['instructions'] is not None
        # Instructions should contain the extracted "How to Apply" text
        assert len(result['instructions']) > 0
    
    def test_extract_application_method_with_smartrecruiters(self, spider):
        """Test that mentions of ATS platforms trigger online detection."""
        text = '''
        To apply, visit our SmartRecruiters portal and complete the application form.
        '''
        
        result = spider._extract_application_method(text, has_url=False)
        
        assert result is not None
        assert result['method'] == 'online'
    
    def test_extract_application_method_email(self, spider):
        """Test email application method detection."""
        text = '''
        How to Apply:
        Send your CV and cover letter to recruitment@example.com
        '''
        
        result = spider._extract_application_method(text, has_url=False)
        
        assert result is not None
        assert result['method'] == 'email'
    
    def test_extract_application_method_prioritizes_online_over_email(self, spider):
        """Test that online method is prioritized when both are mentioned."""
        text = '''
        How to Apply:
        Apply online at our career portal or email your CV to hr@company.com
        '''
        
        result = spider._extract_application_method(text, has_url=True)
        
        assert result is not None
        assert result['method'] == 'online'
    
    def test_context_aware_link_extraction_integration(self, spider):
        """Integration test for full extraction with context-aware logic."""
        html = '''
        <html>
        <body>
            <article class="entry-content">
                <h1>OUTsurance OSS Hastings Learnerships 2026</h1>
                <p>Great opportunity for unemployed youth aged 18-35.</p>
                
                <h2>Requirements</h2>
                <ul>
                    <li>Grade 12 / Matric</li>
                    <li>South African citizen</li>
                </ul>
                
                <h2>How to Apply</h2>
                <p>
                    <a href="https://jobs.smartrecruiters.com/OUTsurance/job-12345">
                        Click here to apply
                    </a>
                </p>
                <p>Applications must be submitted online via the OUTsurance recruitment platform.</p>
                
                <p>For more information, visit <a href="https://www.outsurance.co.za">OUTsurance</a></p>
            </article>
        </body>
        </html>
        '''
        
        request = Request(url='https://recentjobs.co.za/test-listing/')
        response = HtmlResponse(
            url='https://recentjobs.co.za/test-listing/',
            request=request,
            body=html.encode('utf-8'),
            encoding='utf-8'
        )
        
        app_url = spider._extract_application_url(response)
        
        # Should extract the SmartRecruiters job link, NOT the OUTsurance homepage
        assert app_url is not None
        assert 'smartrecruiters.com' in app_url
        assert 'job-12345' in app_url
        assert 'www.outsurance.co.za' not in app_url  # Should not pick the generic homepage link


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
