import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, Optional

from config import CONFIRMATION_TIMEOUT, DANGEROUS_COMMANDS
from utils.logger_structured import log_command, log_system_event, logger


class SecurityManager:
    """Manage command confirmations and security checks"""

    def __init__(self):
        self.pending_confirmations: Dict[str, dict] = {}
        self.confirmation_callbacks: Dict[str, Callable] = {}

    def is_dangerous(self, command_key: str, command_text: str) -> bool:
        """Check if command requires confirmation"""
        command_lower = command_text.lower()

        # Check against dangerous command keywords
        for dangerous in DANGEROUS_COMMANDS:
            if dangerous in command_key.lower() or dangerous in command_lower:
                return True

        return False

    def request_confirmation(self, command_key: str, command_text: str, language: str, details: dict) -> str:
        """
        Request user confirmation for dangerous command
        Returns confirmation_id
        """
        confirmation_id = str(uuid.uuid4())
        expires_at = datetime.now() + timedelta(seconds=CONFIRMATION_TIMEOUT)

        self.pending_confirmations[confirmation_id] = {
            "command_key": command_key,
            "command_text": command_text,
            "language": language,
            "details": details,
            "expires_at": expires_at,
            "confirmed": None,  # None=pending, True=confirmed, False=rejected
        }

        log_system_event(
            "CONFIRMATION_REQUESTED",
            {"confirmation_id": confirmation_id, "command": command_key, "timeout": CONFIRMATION_TIMEOUT},
        )

        # Start timeout timer
        asyncio.create_task(self._handle_timeout(confirmation_id))

        return confirmation_id

    async def _handle_timeout(self, confirmation_id: str):
        """Handle confirmation timeout"""
        await asyncio.sleep(CONFIRMATION_TIMEOUT)
        from modules.memory import memory_manager

        if confirmation_id in self.pending_confirmations:
            confirmation = self.pending_confirmations[confirmation_id]
            if confirmation["confirmed"] is None:
                confirmation["confirmed"] = False

                log_system_event(
                    "CONFIRMATION_TIMEOUT", {"confirmation_id": confirmation_id, "command": confirmation["command_key"]}
                )

                # Log to neural memory as undesirable (timed out)
                await memory_manager.neural.log_decision(
                    command=confirmation["command_text"],
                    action=confirmation["command_key"],
                    result="REJECTED",
                    reason="Handshake timeout - user did not respond.",
                )

                # Notify via callback if registered
                if confirmation_id in self.confirmation_callbacks:
                    callback = self.confirmation_callbacks[confirmation_id]
                    await callback(confirmation_id, False, "timeout")

    async def confirm_command(self, confirmation_id: str, approved: bool) -> Optional[Dict[str, Any]]:
        """User confirms or rejects a dangerous command.

        Returns None when the confirmation does not exist, was already decided,
        or has expired. On a successful decision returns
        ``{"confirmed": bool, "result": dict | None}`` where ``result`` is the
        outcome of re-executing the command (set on approval only).
        """
        if confirmation_id not in self.pending_confirmations:
            return None

        confirmation = self.pending_confirmations[confirmation_id]

        # Check if already decided
        if confirmation["confirmed"] is not None:
            return None

        # Check if expired
        if datetime.now() > confirmation["expires_at"]:
            confirmation["confirmed"] = False
            return None

        confirmation["confirmed"] = approved

        log_command(
            confirmation["command_text"],
            confirmation["command_key"],
            success=approved,
            details={"confirmed": approved, "confirmation_id": confirmation_id},
        )

        # Log to neural memory for long-term learning
        from modules.memory import memory_manager

        await memory_manager.neural.log_decision(
            command=confirmation["command_text"],
            action=confirmation["command_key"],
            result="APPROVED" if approved else "REJECTED",
            reason="Explicit user interaction.",
        )

        execution: Optional[Dict[str, Any]] = None
        if approved:
            execution = await self._execute_confirmed(confirmation)

        return {"confirmed": approved, "result": execution}

    async def _execute_confirmed(self, confirmation: dict) -> Dict[str, Any]:
        """Re-dispatch the original command with the confirmed flag set."""
        from modules.command_handler import dispatch_command

        details = confirmation.get("details") or {}
        try:
            return await dispatch_command(
                confirmation["command_key"],
                details.get("params"),
                confirmation.get("language") or "en",
                confirmed=True,
            )
        except Exception as e:
            logger.error(f"Confirmed command '{confirmation['command_key']}' failed: {e}")
            return {"success": False, "response": f"Confirmed action failed: {e}"}

    def get_pending_actions(self) -> list:
        """List confirmations still awaiting a decision (for GET /pending)."""
        now = datetime.now()
        return [
            {
                "confirmation_id": cid,
                "command_key": conf["command_key"],
                "command_text": conf["command_text"],
                "language": conf["language"],
                "expires_at": conf["expires_at"].isoformat(),
                "is_expired": now > conf["expires_at"],
            }
            for cid, conf in self.pending_confirmations.items()
            if conf["confirmed"] is None
        ]

    def get_confirmation_status(self, confirmation_id: str) -> Optional[bool]:
        """Get status of confirmation: None=pending, True=confirmed, False=rejected/timeout"""
        if confirmation_id not in self.pending_confirmations:
            return None
        return self.pending_confirmations[confirmation_id]["confirmed"]

    def register_callback(self, confirmation_id: str, callback: Callable):
        """Register async callback for confirmation result"""
        self.confirmation_callbacks[confirmation_id] = callback

    def get_confirmation_details(self, confirmation_id: str) -> Optional[dict]:
        """Get confirmation request details"""
        return self.pending_confirmations.get(confirmation_id)

    def cleanup_old_confirmations(self):
        """Remove expired confirmations"""
        now = datetime.now()
        expired = [
            cid for cid, conf in self.pending_confirmations.items() if now > conf["expires_at"] + timedelta(minutes=5)
        ]
        for cid in expired:
            del self.pending_confirmations[cid]
            if cid in self.confirmation_callbacks:
                del self.confirmation_callbacks[cid]


# Singleton instance
security = SecurityManager()
