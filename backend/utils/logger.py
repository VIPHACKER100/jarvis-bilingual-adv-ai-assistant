"""
JARVIS v4.0 — Logger Backward Compat Wrapper
Thin re-export of the structured logger for existing code.
"""

from utils.logger_structured import (
    configure_logging,
    get_logger,
    log_event,
    logger,
    log_command,
    log_system_event,
)

__all__ = [
    "configure_logging", "get_logger", "log_event",
    "logger", "log_command", "log_system_event",
]
