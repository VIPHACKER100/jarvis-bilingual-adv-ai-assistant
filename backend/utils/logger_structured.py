"""
JARVIS v4.0 — Structured Logging
Replaces the basic logging with structlog + OpenTelemetry tracing.
"""

import os
import structlog
import logging
from typing import Dict, Any

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
OTEL_ENABLED = os.getenv("OTEL_ENABLED", "false").lower() == "true"

_structlog_configured = False


def configure_logging(service_name: str = "jarvis-backend") -> None:
    global _structlog_configured
    if _structlog_configured:
        return

    timestamper = structlog.processors.TimeStamper(fmt="iso")

    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            timestamper,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.dev.ConsoleRenderer() if os.isatty(1)
            else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    logging.basicConfig(format="%(message)s", level=LOG_LEVEL)
    _structlog_configured = True

    if OTEL_ENABLED:
        _setup_opentelemetry(service_name)


def _setup_opentelemetry(service_name: str) -> None:
    try:
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

        provider = TracerProvider()
        otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318/v1/traces")
        processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=otlp_endpoint))
        provider.add_span_processor(processor)
        trace.set_tracer_provider(provider)

        structlog.get_logger().info("OpenTelemetry initialized", endpoint=otlp_endpoint)
    except ImportError:
        structlog.get_logger().warning(
            "OpenTelemetry packages not installed. Set OTEL_ENABLED=false or pip install opentelemetry-*"
        )


def get_logger(name: str = None) -> structlog.stdlib.BoundLogger:
    if not _structlog_configured:
        configure_logging()
    return structlog.get_logger(name or __name__)


def log_event(event: str, **kwargs: Any) -> None:
    logger = get_logger("jarvis.event")
    logger.info(event, **kwargs)


# Compatibility aliases for existing code
logger = get_logger("jarvis")

log_command = lambda cmd, cmd_type, success: log_event(
    "command", command=cmd, command_type=cmd_type, success=success
)

log_system_event = lambda event, data: log_event(event, **data)
