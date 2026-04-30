"""
Extraction Metrics Pipeline

Quick Win Day 2: Log extraction metrics for monitoring and analysis.
Tracks link quality, extraction success, and spider performance.
"""
import json
import logging
import os
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)


class ExtractionMetricsPipeline:
    """
    Pipeline to log extraction metrics to a JSONL file.
    
    Metrics logged:
    - Spider name
    - Timestamp
    - Link quality
    - Extraction completeness
    - Key fields presence
    """
    
    def __init__(self):
        self.metrics_file = None
        self.metrics_path = os.getenv(
            "EXTRACTION_METRICS_PATH", 
            "/tmp/extraction_metrics.jsonl"
        )
        
    def open_spider(self, spider):
        """Initialize metrics file when spider starts."""
        try:
            # Ensure directory exists
            Path(self.metrics_path).parent.mkdir(parents=True, exist_ok=True)
            self.metrics_file = open(self.metrics_path, 'a', encoding='utf-8')
            logger.info(f"Metrics logging enabled: {self.metrics_path}")
        except Exception as e:
            logger.warning(f"Could not open metrics file: {e}")
            self.metrics_file = None
    
    def close_spider(self, spider):
        """Close metrics file when spider finishes."""
        if self.metrics_file:
            self.metrics_file.close()
    
    def process_item(self, item, spider):
        """Log metrics for each extracted item."""
        try:
            metrics = self._calculate_metrics(item, spider)
            self._write_metrics(metrics)
        except Exception as e:
            logger.warning(f"Error logging metrics: {e}")
        
        return item
    
    def _calculate_metrics(self, item, spider) -> dict:
        """Calculate extraction quality metrics."""
        # Field completeness checks
        has_title = bool(item.get('title'))
        has_company = bool(item.get('company') and item.get('company') != 'Unknown')
        has_location = bool(item.get('location') and item.get('location') != 'South Africa')
        has_description = bool(item.get('description_full') and len(item.get('description_full', '')) > 100)
        has_closing_date = bool(item.get('closing_date') or item.get('application_deadline'))
        has_salary = bool(item.get('salary'))
        has_application_method = bool(item.get('application_method'))
        
        # Calculate completeness score (0-100)
        weights = {
            'title': 20,
            'company': 20,
            'description': 20,
            'location': 10,
            'closing_date': 15,
            'salary': 5,
            'application_method': 10,
        }
        
        completeness = 0
        if has_title: completeness += weights['title']
        if has_company: completeness += weights['company']
        if has_description: completeness += weights['description']
        if has_location: completeness += weights['location']
        if has_closing_date: completeness += weights['closing_date']
        if has_salary: completeness += weights['salary']
        if has_application_method: completeness += weights['application_method']
        
        # Link quality
        link_quality = item.get('link_quality', 'unknown')
        is_direct_company_link = item.get('is_direct_company_link', False)
        
        # Link quality score
        link_scores = {
            'direct_apply': 100,
            'context_aware_link': 90,
            'specific_job_link': 80,
            'career_page_link': 70,
            'description_link': 60,
            'indeed_apply_button': 60,
            'aggregator_fallback': 20,
            'unknown': 0,
        }
        link_score = link_scores.get(link_quality, 0)
        
        # Combined confidence score (link quality 40%, completeness 60%)
        confidence_score = int(link_score * 0.4 + completeness * 0.6)
        
        return {
            'timestamp': datetime.utcnow().isoformat(),
            'spider': spider.name,
            'url': item.get('original_url', '')[:200],
            'title': (item.get('title') or '')[:100],
            'company': (item.get('company') or '')[:50],
            'opportunity_type': item.get('type', 'unknown'),
            
            # Link metrics
            'link_quality': link_quality,
            'link_score': link_score,
            'is_company_link': is_direct_company_link,
            
            # Completeness metrics
            'has_title': has_title,
            'has_company': has_company,
            'has_location': has_location,
            'has_description': has_description,
            'has_closing_date': has_closing_date,
            'has_salary': has_salary,
            'has_application_method': has_application_method,
            'completeness_score': completeness,
            
            # Overall confidence
            'confidence_score': confidence_score,
            
            # Meta
            'description_length': len(item.get('description_full', '')),
        }
    
    def _write_metrics(self, metrics: dict):
        """Write metrics to JSONL file."""
        if self.metrics_file:
            self.metrics_file.write(json.dumps(metrics) + '\n')
            self.metrics_file.flush()


class ConfidenceScoringPipeline:
    """
    Pipeline to calculate and add confidence scores to items.
    
    Quick Win Day 2 / Phase 1: Confidence Scoring System
    
    Adds a 0-100 confidence score based on:
    - Link quality (40 points max)
    - Data completeness (60 points max)
    """
    
    LINK_QUALITY_SCORES = {
        'direct_apply': 40,
        'context_aware_link': 35,
        'specific_job_link': 30,
        'career_page_link': 25,
        'description_link': 20,
        'indeed_apply_button': 25,
        'aggregator_fallback': 5,
        'unknown': 0,
    }
    
    def process_item(self, item, spider):
        """Calculate and add confidence score to item."""
        score = 0
        
        # Link quality (max 40 points)
        link_quality = item.get('link_quality', 'unknown')
        score += self.LINK_QUALITY_SCORES.get(link_quality, 0)
        
        # Data completeness (max 60 points)
        if item.get('company') and item.get('company') != 'Unknown':
            score += 15
        if item.get('closing_date') or item.get('application_deadline'):
            score += 10
        if item.get('description_full') and len(item.get('description_full', '')) > 200:
            score += 10
        if item.get('location') and item.get('location') != 'South Africa':
            score += 10
        if item.get('salary'):
            score += 5
        if item.get('contact_email') or item.get('contact_phone'):
            score += 5
        if item.get('application_method'):
            score += 5
        
        # Cap at 100
        item['confidence_score'] = min(score, 100)
        
        # Add quality tier for easy filtering
        if score >= 80:
            item['quality_tier'] = 'high'
        elif score >= 50:
            item['quality_tier'] = 'medium'
        else:
            item['quality_tier'] = 'low'
        
        logger.debug(f"Confidence score: {score} ({item.get('quality_tier')}) for {item.get('title', 'Unknown')[:50]}")
        
        return item
