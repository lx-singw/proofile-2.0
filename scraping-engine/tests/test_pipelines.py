import unittest
from scrapy.spiders import Spider
# Adjust import conceptual based on file structure
# Inside scraper container, app root is /app, so scraping-engine/pipelines is pipelines/
from pipelines.metrics_pipeline import ConfidenceScoringPipeline
from items import OpportunityItem

class MockSpider(Spider):
    name = 'test_spider'

class TestConfidenceScoring(unittest.TestCase):
    def setUp(self):
        self.pipeline = ConfidenceScoringPipeline()
        self.spider = MockSpider()

    def test_high_quality_item(self):
        """Test a complete item gets high score."""
        item = OpportunityItem()
        item['title'] = 'Software Engineer'
        # Description must be > 200 chars for points
        item['description_full'] = 'Detailed description...' * 20 
        item['company'] = 'Tech Co'
        item['location'] = 'Remote' # != South Africa
        item['salary'] = 'R50k'
        item['closing_date'] = '2025-12-31'
        item['link_quality'] = 'direct_apply' # 40 pts
        
        # Scoring:
        # Link: 40
        # Company: 15
        # Closing: 10
        # Desc > 200: 10
        # Location: 10
        # Salary: 5
        # Total: 90
        
        processed_item = self.pipeline.process_item(item, self.spider)
        
        self.assertGreaterEqual(processed_item['confidence_score'], 80)
        self.assertEqual(processed_item['quality_tier'], 'high')

    def test_low_quality_item(self):
        """Test a sparse item gets low score."""
        item = OpportunityItem()
        item['title'] = 'Job'
        # Missing desc, company, location
        item['link_quality'] = 'aggregator_fallback' # 5 pts
        
        processed_item = self.pipeline.process_item(item, self.spider)
        
        # Link(5) + Title(0 points for title in logic?)
        # Logic checks: company, closing, desc, location, salary, contact, method
        # item has none of those.
        # Score = 5
        
        self.assertLess(processed_item['confidence_score'], 50)
        self.assertEqual(processed_item['quality_tier'], 'low')

if __name__ == '__main__':
    unittest.main()
