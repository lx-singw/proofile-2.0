"""
Base Agent Class

Abstract base for all AI agents (Hunter, Tailor, Negotiator, etc.)
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Abstract base class for all Proofile AI agents."""
    
    def __init__(self, user_id: int, config: Optional[Dict[str, Any]] = None):
        self.user_id = user_id
        self.config = config or {}
        self.status = "idle"
        self.last_run = None
        self.stats: Dict[str, Any] = {}
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Return the agent's display name."""
        pass
    
    @property
    @abstractmethod
    def agent_type(self) -> str:
        """Return the agent type identifier."""
        pass
    
    @abstractmethod
    async def run(self) -> Dict[str, Any]:
        """Execute the agent's main task. Returns result dict."""
        pass
    
    async def execute(self) -> Dict[str, Any]:
        """Wrapper that handles logging and status updates."""
        self.status = "running"
        self.last_run = datetime.utcnow()
        
        try:
            logger.info(f"[{self.name}] Starting execution for user {self.user_id}")
            result = await self.run()
            self.status = "idle"
            logger.info(f"[{self.name}] Completed successfully")
            return {"success": True, "result": result}
        except Exception as e:
            self.status = "error"
            logger.error(f"[{self.name}] Failed: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def pause(self):
        """Pause the agent."""
        self.status = "paused"
        logger.info(f"[{self.name}] Paused")
    
    def resume(self):
        """Resume the agent."""
        self.status = "idle"
        logger.info(f"[{self.name}] Resumed")
    
    def get_status(self) -> Dict[str, Any]:
        """Return current agent status."""
        return {
            "name": self.name,
            "type": self.agent_type,
            "status": self.status,
            "last_run": self.last_run.isoformat() if self.last_run else None,
            "stats": self.stats
        }
