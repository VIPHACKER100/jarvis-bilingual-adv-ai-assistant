import asyncio
import time
from typing import Optional, Dict, Any, List
from datetime import datetime
from modules.window_manager import window_manager
from modules.media import media_manager
from modules.llm import llm_client
from utils.logger import logger, log_system_event
from utils.websocket_manager import manager

class ProactiveManager:
    """Intelligent background engine for proactive suggestions"""
    
    def __init__(self):
        self.last_suggestion: Optional[str] = None
        self.last_context: Optional[str] = None
        self.is_running = False
        self.analysis_interval = 15  # Seconds between heavy analysis
        self._lock = asyncio.Lock()

    async def start(self):
        """Start the proactive analysis loop"""
        if self.is_running:
            return
        
        self.is_running = True
        logger.info("Neural Proactive Engine started")
        asyncio.create_task(self._analysis_loop())

    async def stop(self):
        """Stop the proactive analysis loop"""
        self.is_running = False
        logger.info("Neural Proactive Engine stopped")

    async def _analysis_loop(self):
        """Background loop for situational awareness"""
        while self.is_running:
            try:
                await asyncio.sleep(self.analysis_interval)
                
                # 1. Get current window context
                window_info = await window_manager.get_active_window()
                if not window_info or not window_info.get('title'):
                    continue
                
                window_title = window_info.get('title', "")
                
                # Skip if it's just the desktop or JARVIS itself
                if any(x in window_title.lower() for x in ["jarvis", "taskbar", "program manager"]):
                    continue
 
                # 2. Check if context has changed significantly
                current_context_fingerprint = f"{window_title}"
                if current_context_fingerprint == self.last_context:
                    continue
                
                self.last_context = current_context_fingerprint
 
                # 3. Perform lightweight analysis (OCR snippet + Title)
                suggestion = await self._analyze_situation(window_title)

                
                if suggestion and suggestion != self.last_suggestion:
                    self.last_suggestion = suggestion
                    await self._broadcast_suggestion(suggestion)
                    
            except Exception as e:
                logger.error(f"Error in proactive analysis loop: {e}")
                await asyncio.sleep(self.analysis_interval)

    async def _analyze_situation(self, title: str) -> Optional[str]:
        """Use LLM to determine if a proactive suggestion is helpful"""
        
        # Heuristics to avoid calling LLM for everything
        interests = ["github", "stackoverflow", "youtube", "whatsapp", "mail", "outlook", "excel", "vscode", "terminal", "error", "issue"]
        if not any(x in title.lower() for x in interests):
            return None

        prompt = f"""
        You are JARVIS, an advanced AI assistant. 
        The user is currently focused on a window titled: "{title}"
        
        Based on this title, suggest a helpful proactive action I can take.
        Keep it extremely brief (max 15 words) and highly technical.
        Examples:
        - "User focused on GitHub. Shall I summarize the recent commits?"
        - "Detected Terminal error. Would you like me to suggest a fix?"
        - "You're writing an email. I can help draft a professional reply."
        
        If no obvious helpful action exists, respond with "NONE".
        """
        
        try:
            async with self._lock:
                # Use a very small token limit for speed
                response = await llm_client.generate_response(prompt, max_tokens=30)
                
                if "NONE" in response.upper() or len(response) < 5:
                    return None
                    
                return response.strip().strip('"')
        except Exception as e:
            logger.debug(f"LLM analysis failed for proactive engine: {e}")
            return None

    async def _broadcast_suggestion(self, suggestion: str):
        """Send the suggestion to all connected clients"""
        message = {
            "type": "proactive_suggestion",
            "data": {
                "text": suggestion,
                "timestamp": datetime.now().isoformat()
            }
        }
        await manager.broadcast(message)
        log_system_event("PROACTIVE_SUGGESTION", {"text": suggestion})

proactive_manager = ProactiveManager()
