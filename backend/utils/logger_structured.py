"""Logging — stdlib logging facade."""
import logging
import os
from typing import Any

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

def configure_logging(service_name: str = "jarvis-backend") -> None:
    logging.basicConfig(
        level=LOG_LEVEL,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )

def get_logger(name: str | None = None) -> logging.Logger:
    return logging.getLogger(name or __name__)

def log_event(event: str, **kwargs: Any) -> None:
    logger = get_logger("jarvis.event")
    extra = " | ".join(f"{k}={v}" for k, v in kwargs.items())
    logger.info("%s %s", event, extra)

logger = get_logger("jarvis")

def log_command(cmd: str, cmd_type: str, success: bool) -> None:
    log_event("command", command=cmd, command_type=cmd_type, success=success)

def log_system_event(event: str, data: dict) -> None:
    log_event(event, **data)

OTEL_ENABLED = False
