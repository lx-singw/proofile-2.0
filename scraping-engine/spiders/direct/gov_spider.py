from spiders.base_spider import BaseOpportunitySpider
import scrapy

class DpsaSpider(BaseOpportunitySpider):
    """
    Scraper for Department of Public Service and Administration (DPSA) - Government Vacancies.
    Layer 3: The Source
    """
    name = "dpsa"
    allowed_domains = ["dpsa.gov.za"]
    start_urls = ["https://www.dpsa.gov.za/dpsa2g/vacancies.asp"]

    def parse(self, response):
        """
        Parses the circulars and vacancy lists.
        Note: DPSA often uses PDFs, so we'll need to follow circles to find PDF links.
        """
        # Select links to latest circulars
        circular_links = response.css('a[href*="circular"]::attr(href)').getall()
        for link in circular_links:
            yield response.follow(link, self.parse_circular)

    def parse_circular(self, response):
        # Government vacancies are often grouped by department in circulars
        # This is a complex parse involving following to PDF attachments or tables
        # For MVP, we extract department titles and circular IDs
        item = {
            'title': self.clean_text(response.css('h1::text').get()),
            'source': 'DPSA (Government)',
            'original_url': response.url,
            'description_short': 'Official Government Circular'
        }
        yield item
