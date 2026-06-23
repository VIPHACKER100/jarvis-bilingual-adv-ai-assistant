import asyncio
from datetime import datetime
from typing import List, Optional

from modules.llm_wrapper import llm_client
from modules.media import media_manager
from modules.window_manager import window_manager
from utils.logger_structured import log_system_event, logger
from utils.websocket_manager import manager


class ProactiveManager:
    """Intelligent background engine for proactive suggestions"""

    def __init__(self):
        self.last_suggestion: Optional[str] = None
        self.last_context: Optional[str] = None
        self.is_running = False
        self.analysis_interval = 15  # Seconds between heavy analysis
        self._lock = asyncio.Lock()
        # Track rejected patterns so we don't keep suggesting them
        self._rejected_keywords: List[str] = []
        self._decision_refresh_counter = 0

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
                # For high-interest apps, get deep screen context (v3.9.0)
                screen_context = ""
                if any(x in window_title.lower() for x in ["vscode", "terminal", "browser", "chrome", "edge"]):
                    summary_res = await media_manager.get_screen_summary()
                    if summary_res.get('success'):
                        screen_context = summary_res.get('summary', "")

                suggestion = await self._analyze_situation(window_title, screen_context)


                if suggestion and suggestion != self.last_suggestion:
                    self.last_suggestion = suggestion
                    await self._broadcast_suggestion(suggestion)

            except Exception as e:
                logger.error(f"Error in proactive analysis loop: {e}")
                await asyncio.sleep(self.analysis_interval)

    async def _refresh_rejected_keywords(self) -> None:
        """Re-index what the user has historically rejected so we stop repeating them"""
        try:
            from modules.memory import memory_manager
            node = await memory_manager.get_memory_node("decisions")
            if not node:
                return

            rejected: List[str] = []
            for line in node.splitlines():
                if "REJECTED" in line.upper() or "TIMEOUT" in line.upper():
                    # Extract the command key (usually the first quoted word)
                    match = __import__('re').search(r"'([\w_]+)'", line)
                    if match:
                        rejected.append(match.group(1).lower())

            self._rejected_keywords = list(set(rejected))
            logger.debug(f"Proactive engine refreshed reject list: {self._rejected_keywords}")
        except Exception as e:
            logger.debug(f"Could not refresh reject list: {e}")

    async def _analyze_situation(self, title: str, screen_context: str = "") -> Optional[str]:
        """Use LLM to determine if a proactive suggestion is helpful"""

        # 0. Check for urgent mobile alerts — highest priority, no LLM needed
        try:
            from modules.context import context_manager
            mobile_alert = context_manager.get_context_variable('urgent_mobile_alert')
            if mobile_alert:
                context_manager.set_context_variable('urgent_mobile_alert', None)
                return mobile_alert
        except Exception:
            pass

        # Heuristics to avoid calling LLM for everything
        interests = ["github", "stackoverflow", "youtube", "whatsapp", "mail", "outlook", "excel", "vscode", "terminal", "error", "issue", "plan"]
        if not any(x in title.lower() for x in interests) and not screen_context:
            return None

        # Refresh rejected keywords every 5 cycles
        self._decision_refresh_counter += 1
        if self._decision_refresh_counter % 5 == 0:
            await self._refresh_rejected_keywords()

        # Build rejection context string for the prompt
        reject_context = ""
        if self._rejected_keywords:
            reject_context = f"\nDo NOT suggest actions related to: {', '.join(self._rejected_keywords)}. The user has previously rejected these."

        prompt = f"""
        You are JARVIS, an advanced AI assistant. 
        The user is currently focused on a window titled: "{title}"
        """

        if screen_context:
            prompt += f"\nDeep Context (from Screen OCR): {screen_context}\n"

        if reject_context:
            prompt += reject_context + "\n"

        prompt += """
        Based on this situational awareness, suggest a helpful proactive action I can take.
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
                response = await llm_client.get_response(prompt, max_tokens=30)

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
