"""
Scrapers Package

Job board scrapers for aggregating South African jobs.
"""

from app.scrapers.careers24 import Careers24Scraper
from app.scrapers.pnet import PNetScraper
from app.scrapers.indeed import IndeedScraper

__all__ = [
    "Careers24Scraper",
    "PNetScraper",
    "IndeedScraper",
]
