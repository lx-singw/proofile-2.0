"""
Scrapers Package

Job board and opportunity scrapers for aggregating South African jobs.
Includes support for opportunity categories and types.
"""

from app.scrapers.base import BaseScraper
from app.scrapers.careers24 import Careers24Scraper
from app.scrapers.pnet import PNetScraper
from app.scrapers.indeed import IndeedScraper
from app.scrapers.careerjunction import CareerJunctionScraper
from app.scrapers.recentjobs import RecentJobsScraper
from app.scrapers.studentroom import StudentRoomScraper
from app.scrapers.yes4youth import YES4YouthScraper

__all__ = [
    "BaseScraper",
    "Careers24Scraper",
    "PNetScraper",
    "IndeedScraper",
    "CareerJunctionScraper",
    "RecentJobsScraper",
    "StudentRoomScraper",
    "YES4YouthScraper",
]
