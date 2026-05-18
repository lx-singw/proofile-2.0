"""
Health Check Server for AI Pipeline
====================================
Provides HTTP health endpoint for Docker health checks and monitoring.

Run: python health.py (runs on port 9091)
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

HEALTH_PORT = int(os.getenv("HEALTH_PORT", "9091"))
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/1")


class HealthState:
    """Shared state for health checks."""
    
    def __init__(self):
        self.last_process_time: datetime | None = None
        self.items_processed: int = 0
        self.items_saved: int = 0
        self.items_failed: int = 0
        self.redis_connected: bool = False
        self.backend_reachable: bool = False
    
    def update_process(self, saved: bool = False, failed: bool = False):
        self.last_process_time = datetime.utcnow()
        self.items_processed += 1
        if saved:
            self.items_saved += 1
        if failed:
            self.items_failed += 1
    
    def to_dict(self) -> dict:
        is_healthy = self.redis_connected
        return {
            "status": "healthy" if is_healthy else "degraded",
            "last_process_time": self.last_process_time.isoformat() if self.last_process_time else None,
            "total_processed": self.items_processed,
            "total_saved": self.items_saved,
            "total_failed": self.items_failed,
            "redis_connected": self.redis_connected,
            "backend_reachable": self.backend_reachable,
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


def get_queue_stats() -> dict:
    """Get Redis queue statistics."""
    try:
        client = redis.from_url(REDIS_URL)
        main_queue = client.llen("raw_opportunities")
        dlq = client.llen("raw_opportunities:dlq")
        permanent_failed = client.llen("raw_opportunities:permanent_failed")
        return {
            "main_queue_size": main_queue,
            "dlq_size": dlq,
            "permanent_failed_size": permanent_failed,
        }
    except Exception:
        return {"error": "Redis unavailable"}


class HealthHandler(BaseHTTPRequestHandler):
    """HTTP handler for health checks."""
    
    def log_message(self, format, *args):
        pass
    
    def do_GET(self):
        if self.path == "/health" or self.path == "/":
            health_state.redis_connected = check_redis_connection()
            
            status_code = 200 if health_state.redis_connected else 503
            response = health_state.to_dict()
            response["queue_stats"] = get_queue_stats()
            
            self.send_response(status_code)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path == "/ready":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"ready": True}).encode())
            
        elif self.path == "/metrics":
            health_state.redis_connected = check_redis_connection()
            queue_stats = get_queue_stats()
            
            metrics = [
                f'ai_pipeline_processed_total {health_state.items_processed}',
                f'ai_pipeline_saved_total {health_state.items_saved}',
                f'ai_pipeline_failed_total {health_state.items_failed}',
                f'ai_pipeline_redis_connected {1 if health_state.redis_connected else 0}',
                f'ai_pipeline_queue_size {queue_stats.get("main_queue_size", 0)}',
                f'ai_pipeline_dlq_size {queue_stats.get("dlq_size", 0)}',
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
    server = HTTPServer(("0.0.0.0", HEALTH_PORT), HealthHandler)
    logger.info(f"Health server running on port {HEALTH_PORT}")
    server.serve_forever()
