from __future__ import annotations

import argparse
import asyncio
import logging
import os
from datetime import datetime, timezone

from scripts.parallel_runner import ParallelSpiderRunner

logger = logging.getLogger(__name__)

DEFAULT_SPIDERS = [
    "careers24",
    "recentjobs",
    "studentroom",
    "zabursaries",
    "puffandpass",
    "dpsa",
]


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the scraping schedule")
    parser.add_argument("--once", action="store_true", help="Run one scraping cycle and exit")
    parser.add_argument(
        "--interval-hours",
        type=float,
        default=float(os.getenv("SCRAPE_INTERVAL_HOURS", "12")),
        help="Hours to wait between scrape cycles",
    )
    parser.add_argument(
        "--max-concurrent",
        type=int,
        default=int(os.getenv("SCRAPE_MAX_CONCURRENT", str(len(DEFAULT_SPIDERS)))),
        help="Maximum spiders to run concurrently",
    )
    return parser.parse_args()


async def _run_cycle(runner: ParallelSpiderRunner, spiders: list[str]) -> None:
    started_at = datetime.now(timezone.utc)
    logger.info("Starting scrape cycle for %s spiders at %s", len(spiders), started_at.isoformat())
    results = await runner.run_spiders(spiders)
    succeeded = sum(1 for result in results if result.status == "success")
    failed = len(results) - succeeded
    logger.info("Finished scrape cycle: %s success, %s failed", succeeded, failed)


async def main() -> None:
    args = _parse_args()
    logging.basicConfig(
        level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )

    interval_seconds = max(int(args.interval_hours * 3600), 60)
    runner = ParallelSpiderRunner(
        max_concurrent=max(1, args.max_concurrent),
        timeout=int(os.getenv("SCRAPE_TIMEOUT_SECONDS", "3600")),
    )

    while True:
        await _run_cycle(runner, DEFAULT_SPIDERS)
        if args.once:
            return
        logger.info("Sleeping for %s seconds before next scrape cycle", interval_seconds)
        await asyncio.sleep(interval_seconds)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Scrape scheduler stopped")