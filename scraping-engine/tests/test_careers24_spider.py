import pytest
from scrapy.http import HtmlResponse
import scrapy
from spiders.portals.careers24_spider import Careers24Spider
from items import OpportunityItem

def test_careers24_parse_list():
    spider = Careers24Spider()
    
    html = """
    <html>
        <body>
            <div class="job-card">
                <h2><a href="/job/backend-dev">Backend Developer</a></h2>
                <div class="job-card-info">
                    <ul>
                        <li>Johannesburg</li>
                        <li>R45 000 pm</li>
                    </ul>
                </div>
            </div>
            <ul class="pagination">
                <li class="next"><a href="/jobs?page=2">Next</a></li>
            </ul>
        </body>
    </html>
    """
    
    response = HtmlResponse(
        url="https://www.careers24.com/jobs/lc-south-africa/m-true/",
        body=html.encode('utf-8'),
        encoding='utf-8'
    )
    
    results = list(spider.parse(response))
    
    assert len(results) == 2
    
    # Detail request
    detail_req = results[0]
    assert detail_req.url == "https://www.careers24.com/job/backend-dev"
    assert detail_req.callback == spider.parse_details
    assert detail_req.meta['item']['title'] == "Backend Developer"
    assert detail_req.meta['item']['location'] == "Johannesburg"
    assert detail_req.meta['item']['salary'] == "R45 000 pm"
    
    # Pagination
    next_req = results[1]
    assert "page=2" in next_req.url

def test_careers24_parse_details():
    spider = Careers24Spider()
    item = OpportunityItem()
    item['title'] = 'Backend Developer'
    
    html = """
    <html>
        <body>
            <div class="job-detail-content">
                <p>We are looking for a Python expert.</p>
                <p>Must know FastAPI.</p>
            </div>
        </body>
    </html>
    """
    
    request = scrapy.Request(url="https://www.careers24.com/job/backend-dev", meta={'item': item})
    response = HtmlResponse(
        url="https://www.careers24.com/job/backend-dev",
        body=html.encode('utf-8'),
        encoding='utf-8',
        request=request
    )
    
    results = list(spider.parse_details(response))
    
    assert len(results) == 1
    final_item = results[0]
    assert "We are looking for a Python expert." in final_item['description_full']
    assert "Must know FastAPI." in final_item['description_full']
    assert final_item['type'] == 'job'
