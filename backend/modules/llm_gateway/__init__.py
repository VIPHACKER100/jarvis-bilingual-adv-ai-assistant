"""
LLM Gateway package — re-exports for backward compatibility.
"""

from modules.llm_gateway.gateway import LLMGateway
from modules.llm_gateway.cost import cost_tracker

llm_gateway = LLMGateway()

__all__ = ["llm_gateway", "LLMGateway", "cost_tracker"]
