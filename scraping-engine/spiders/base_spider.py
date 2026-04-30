import scrapy
from abc import ABC, abstractmethod
import re

class BaseOpportunitySpider(scrapy.Spider, ABC):
    """
    Base spider for all Opportunity Radar scrapers.
    Provides common utility methods for parsing SA-specific data.
    """
    
    def parse_salary(self, salary_str):
        """
        Extract numerical values from SA salary strings (e.g., 'R15 000 - R20 000 pm')
        """
        if not salary_str:
            return None
        # Basic extraction logic - to be expanded in salary_parser.py
        numbers = re.findall(r'\d[\d\s]*', salary_str)
        return [int(n.replace(' ', '')) for n in numbers] if numbers else None

    def clean_text(self, text):
        """
        Basic text cleaning for descriptions
        """
        if not text:
            return ""
        return " ".join(text.split())

    @abstractmethod
    def parse(self, response):
        """Must be implemented by child spiders"""
        pass
