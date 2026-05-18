"""
Health Check Server for Scraping Engine
========================================
Provides HTTP health endpoint for Docker health checks and monitoring.

Run: python health.py (runs on port 9090)
"""
import asyncio
import json
import logging
import os
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from threading import Thread

import redis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

HEALTH_PORT = int(os.getenv("HEALTH_PORT", "9090"))
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/1")


class HealthState:
    """Shared state for health checks."""
    
    def __init__(self):
        self.last_scrape_time: datetime | None = None
        self.spiders_running: int = 0
        self.items_scraped: int = 0
        self.errors: int = 0
        self.redis_connected: bool = False
    
    def update_scrape(self, items: int = 0, errors: int = 0):
        self.last_scrape_time = datetime.utcnow()
        self.items_scraped += items
        self.errors += errors
    
    def to_dict(self) -> dict:
        return {
            "status": "healthy" if self.redis_connected else "degraded",
            "last_scrape_time": self.last_scrape_time.isoformat() if self.last_scrape_time else None,
            "spiders_running": self.spiders_running,
            "total_items_scraped": self.items_scraped,
            "total_errors": self.errors,
            "redis_connected": self.redis_connected,
            "timestamp": datetime.utcnow().isoformat(),
        }


# Global health state
health_state = HealthState()


def check_redis_connection() -> bool:
    """Check if Redis is reachable."""
    try:
        client = redis.from_url(REDIS_URL)
        client.ping()
        return True
    except Exception:
        return False


class HealthHandler(BaseHTTPRequestHandler):
    """HTTP handler for health checks."""
    
    def log_message(self, format, *args):
        # Suppress default logging
        pass
    
    def do_GET(self):
        if self.path == "/health" or self.path == "/":
            health_state.redis_connected = check_redis_connection()
            
            status_code = 200 if health_state.redis_connected else 503
            response = health_state.to_dict()
            
            self.send_response(status_code)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path == "/ready":
            # Readiness check - always ready if we're running
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"ready": True}).encode())
            
        elif self.path == "/metrics":
            # Prometheus-style metrics
            health_state.redis_connected = check_redis_connection()
            
            metrics = [
                f'scraping_engine_items_total {health_state.items_scraped}',
                f'scraping_engine_errors_total {health_state.errors}',
                f'scraping_engine_spiders_running {health_state.spiders_running}',
                f'scraping_engine_redis_connected {1 if health_state.redis_connected else 0}',
            ]
            
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write("\n".join(metrics).encode())
            
        else:
            self.send_response(404)
            self.end_headers()


def start_health_server():
    """Start the health check server in a background thread."""
    server = HTTPServer(("0.0.0.0", HEALTH_PORT), HealthHandler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    logger.info(f"Health server started on port {HEALTH_PORT}")
    return server


if __name__ == "__main__":
    # Run standalone for testing
    server = HTTPServer(("0.0.0.0", HEALTH_PORT), HealthHandler)
    logger.info(f"Health server running on port {HEALTH_PORT}")
    server.serve_forever()
