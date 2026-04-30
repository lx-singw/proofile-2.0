import pytest
from scrapy.http import HtmlResponse
from spiders.portals.pnet_spider import PnetSpider

def test_pnet_parse_list():
    spider = PnetSpider()
    
    # Mock HTML
    html = """
    <html>
        <body>
            <article class="job-item">
                <h2>Software Engineer</h2>
                <span class="company-name">Tech Corp</span>
                <span class="location">Cape Town</span>
                <span class="salary">R500k - R700k</span>
                <a class="job-link" href="/job-123">View Job</a>
                <div class="job-description">Developing cool stuff.</div>
            </article>
            <a class="next-page" href="/jobs/it?page=2">Next</a>
        </body>
    </html>
    """
    
    response = HtmlResponse(
        url="https://www.pnet.co.za/jobs/it",
        body=html.encode('utf-8'),
        encoding='utf-8'
    )
    
    results = list(spider.parse(response))
    
    # We expect 2 items: 1 Request for the job detail, 1 Request for next page
    assert len(results) == 2
    
    # Check job detail request
    job_request = results[0]
    assert job_request.url == "https://www.pnet.co.za/job-123"
    assert job_request.callback == spider.parse_detail
    assert job_request.meta['item']['title'] == "Software Engineer"
    assert job_request.meta['item']['company'] == "Tech Corp"
    
    # Check pagination request
    pagination_request = results[1]
    assert "page=2" in pagination_request.url

def test_pnet_parse_detail():
    spider = PnetSpider()
    
    item = {
        'title': 'Eng',
        'company': 'Tech',
        'original_url': 'some_url'
    }
    
    html = """
    <html>
        <body>
            <div class="job-details-content">
                <p>Full job description here.</p>
                <ul>
                    <li>React</li>
                    <li>Python</li>
                </ul>
            </div>
        </body>
    </html>
    """
    
    import scrapy
    request = scrapy.Request(url="https://www.pnet.co.za/job-123", meta={'item': item})
    response = HtmlResponse(
        url="https://www.pnet.co.za/job-123",
        body=html.encode('utf-8'),
        encoding='utf-8',
        request=request
    )
    
    results = list(spider.parse_detail(response))
    
    assert len(results) == 1
    final_item = results[0]
    # clean_text joins with " " and splits.
    # "Full job description here. React Python"
    assert "Full job description here." in final_item['description_full']
    assert "React" in final_item['description_full']
    assert "Python" in final_item['description_full']
