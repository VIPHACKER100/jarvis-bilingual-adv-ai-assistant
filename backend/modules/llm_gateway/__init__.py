"""
LLM Gateway package — re-exports for backward compatibility.
"""

from modules.llm_gateway.cost import cost_tracker
from modules.llm_gateway.gateway import LLMGateway

llm_gateway = LLMGateway()

__all__ = ["llm_gateway", "LLMGateway", "cost_tracker"]
