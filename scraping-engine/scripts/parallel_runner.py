#!/usr/bin/env python
"""
Parallel Spider Runner
======================
Phase 4: Run multiple spiders in parallel for faster full-site scraping.
"""
import asyncio
import subprocess
import sys
import os
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class SpiderResult:
    """Result from a spider run."""
    spider: str
    status: str  # 'success', 'failed', 'timeout'
    items_scraped: int
    duration_seconds: float
    error: Optional[str] = None


class ParallelSpiderRunner:
    """
    Run multiple spiders concurrently with resource management.
    
    Usage:
        runner = ParallelSpiderRunner(max_concurrent=3)
        results = await runner.run_spiders(['studentroom', 'pnet', 'recentjobs'])
    """
    
    def __init__(
        self,
        max_concurrent: int = 3,
        timeout: int = 3600,  # 1 hour default
        item_limit: Optional[int] = None,
    ):
        self.max_concurrent = max_concurrent
        self.timeout = timeout
        self.item_limit = item_limit
        self.semaphore = asyncio.Semaphore(max_concurrent)
    
    async def run_spiders(
        self,
        spiders: List[str],
        extra_args: Optional[Dict[str, str]] = None
    ) -> List[SpiderResult]:
        """
        Run multiple spiders in parallel.
        
        Args:
            spiders: List of spider names
            extra_args: Additional scrapy arguments
            
        Returns:
            List of SpiderResult for each spider
        """
        logger.info(f"Starting parallel run of {len(spiders)} spiders (max concurrent: {self.max_concurrent})")
        
        tasks = [
            self._run_spider(spider, extra_args or {})
            for spider in spiders
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Convert exceptions to results
        final_results = []
        for spider, result in zip(spiders, results):
            if isinstance(result, Exception):
                final_results.append(SpiderResult(
                    spider=spider,
                    status='failed',
                    items_scraped=0,
                    duration_seconds=0,
                    error=str(result)
                ))
            else:
                final_results.append(result)
        
        self._log_summary(final_results)
        return final_results
    
    async def _run_spider(
        self,
        spider: str,
        extra_args: Dict[str, str]
    ) -> SpiderResult:
        """Run a single spider with semaphore protection."""
        async with self.semaphore:
            start_time = datetime.now()
            
            # Build command
            cmd = ['scrapy', 'crawl', spider, '-s', 'LOG_LEVEL=INFO']
            
            if self.item_limit:
                cmd.extend(['-s', f'CLOSESPIDER_ITEMCOUNT={self.item_limit}'])
            
            for key, value in extra_args.items():
                cmd.extend(['-s', f'{key}={value}'])
            
            logger.info(f"Starting spider: {spider}")
            
            try:
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=self.timeout
                )
                
                duration = (datetime.now() - start_time).total_seconds()
                
                # Scrapy writes stats to stderr; merge both streams for item counting
                items = self._parse_items_from_output(
                    stdout.decode() + stderr.decode()
                )
                
                if process.returncode == 0:
                    logger.info(f"Spider {spider} completed: {items} items in {duration:.1f}s")
                    return SpiderResult(
                        spider=spider,
                        status='success',
                        items_scraped=items,
                        duration_seconds=duration
                    )
                else:
                    error = stderr.decode()[:500]
                    logger.warning(f"Spider {spider} failed: {error}")
                    return SpiderResult(
                        spider=spider,
                        status='failed',
                        items_scraped=items,
                        duration_seconds=duration,
                        error=error
                    )
                    
            except asyncio.TimeoutError:
                logger.error(f"Spider {spider} timed out after {self.timeout}s")
                return SpiderResult(
                    spider=spider,
                    status='timeout',
                    items_scraped=0,
                    duration_seconds=self.timeout,
                    error=f'Timeout after {self.timeout}s'
                )
    
    def _parse_items_from_output(self, output: str) -> int:
        """Extract item count from scrapy output."""
        import re
        match = re.search(r"'item_scraped_count':\s*(\d+)", output)
        if match:
            return int(match.group(1))
        return 0
    
    def _log_summary(self, results: List[SpiderResult]):
        """Log summary of all spider runs."""
        total_items = sum(r.items_scraped for r in results)
        total_time = sum(r.duration_seconds for r in results)
        success = sum(1 for r in results if r.status == 'success')
        
        logger.info(f"""
=== Parallel Run Summary ===
Spiders: {len(results)} ({success} success, {len(results) - success} failed)
Total items: {total_items}
Total time: {total_time:.1f}s
Average time: {total_time / len(results):.1f}s per spider
""")


async def main():
    """CLI entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Run spiders in parallel')
    parser.add_argument('spiders', nargs='+', help='Spider names to run')
    parser.add_argument('--max-concurrent', type=int, default=3)
    parser.add_argument('--timeout', type=int, default=3600)
    parser.add_argument('--item-limit', type=int)
    
    args = parser.parse_args()
    
    runner = ParallelSpiderRunner(
        max_concurrent=args.max_concurrent,
        timeout=args.timeout,
        item_limit=args.item_limit,
    )
    
    results = await runner.run_spiders(args.spiders)
    
    # Output as JSON
    print(json.dumps([
        {
            'spider': r.spider,
            'status': r.status,
            'items': r.items_scraped,
            'duration': r.duration_seconds,
            'error': r.error
        }
        for r in results
    ], indent=2))


if __name__ == '__main__':
    asyncio.run(main())
