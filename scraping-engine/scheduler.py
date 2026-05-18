from __future__ import annotations

import argparse
import asyncio
import logging
import os
import signal
from datetime import datetime, timezone
from typing import Optional

from scripts.parallel_runner import ParallelSpiderRunner

logger = logging.getLogger(__name__)

# Graceful shutdown state
_shutdown_event: Optional[asyncio.Event] = None
_current_cycle_task: Optional[asyncio.Task] = None

DEFAULT_SPIDERS = [
    # Primary sources (comprehensive extraction)
    "puffandpass",
    "recentjobs",
    "studentroom",
    "zabursaries",
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


def _handle_shutdown(signum, frame):
    """Handle shutdown signals gracefully."""
    sig_name = signal.Signals(signum).name
    logger.info(f"Received {sig_name}, initiating graceful shutdown...")
    if _shutdown_event:
        _shutdown_event.set()


async def main() -> None:
    global _shutdown_event, _current_cycle_task
    
    args = _parse_args()
    logging.basicConfig(
        level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    
    # Start health server
    try:
        from health import start_health_server
        start_health_server()
    except ImportError:
        logger.warning("Health server not available")
    
    # Setup graceful shutdown
    _shutdown_event = asyncio.Event()
    
    # Register signal handlers
    for sig in (signal.SIGTERM, signal.SIGINT):
        signal.signal(sig, _handle_shutdown)

    interval_seconds = max(int(args.interval_hours * 3600), 60)
    runner = ParallelSpiderRunner(
        max_concurrent=max(1, args.max_concurrent),
        timeout=int(os.getenv("SCRAPE_TIMEOUT_SECONDS", "3600")),
    )

    while not _shutdown_event.is_set():
        # Run scrape cycle
        _current_cycle_task = asyncio.create_task(_run_cycle(runner, DEFAULT_SPIDERS))
        try:
            await _current_cycle_task
        except asyncio.CancelledError:
            logger.info("Scrape cycle cancelled")
            break
        
        if args.once:
            return
        
        # Wait for next cycle or shutdown
        logger.info("Sleeping for %s seconds before next scrape cycle", interval_seconds)
        try:
            await asyncio.wait_for(
                _shutdown_event.wait(),
                timeout=interval_seconds
            )
            # If we get here, shutdown was requested
            break
        except asyncio.TimeoutError:
            # Normal timeout, continue to next cycle
            pass
    
    logger.info("Scheduler shutdown complete")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Scrape scheduler stopped by keyboard interrupt")