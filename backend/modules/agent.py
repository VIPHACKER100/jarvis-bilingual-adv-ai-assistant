"""
JARVIS v3.9.0 — Autonomous Agent Controller
Implements the ReAct (Reasoning and Acting) loop.
"""

import asyncio
import json
import re
from typing import Any, Callable, Coroutine, Dict, List, Optional

from modules.memory import memory_manager
from modules.tools import get_tools_prompt
from utils.logger_structured import logger


class AgentController:
    """
    Manages the autonomous reasoning loop for JARVIS.
    """

    MAX_ITERATIONS = 5

    def __init__(self):
        self.tools_context = get_tools_prompt()

    async def run_loop(
        self,
        query: str,
        language: str = "en",
        session_id: str = "default",
        on_thought: Optional[Callable[[str], Coroutine]] = None,
    ) -> str:
        """
        Execute the Thought-Action-Observation loop to resolve a complex query.
        """
        # Get relevant context from memory (Neural Context)
        memory_context = await memory_manager.get_neural_context(query)

        from modules.llm_wrapper import llm_client

        logger.info(f"Starting autonomous agent loop for: '{query}'")

        history = []
        iteration = 0
        backoff = 1  # seconds — doubles on each LLM failure

        while iteration < self.MAX_ITERATIONS:
            iteration += 1

            # 1. Ask LLM for the next step (with back-off retry)
            try:
                response = await llm_client.get_agent_response(
                    query=query,
                    tools_context=self.tools_context,
                    neural_context=memory_context,
                    history=history,
                    language=language,
                )
                backoff = 1  # reset on success
            except Exception as llm_err:
                logger.warning(f"LLM call failed (iteration {iteration}), retrying in {backoff}s: {llm_err}")
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 30)  # cap at 30s
                continue

            logger.debug(f"Agent Iteration {iteration} Response: {response}")

            # 2. Parse Thought and Action
            thought = self._extract_field(response, "Thought")
            action_json = self._extract_field(response, "Action")
            final_answer = self._extract_field(response, "Final Answer")

            if thought and on_thought:
                await on_thought(thought)

            if final_answer and not action_json:
                logger.info("Agent reached Final Answer.")
                await self._log_trace_to_memory(query, history, final_answer)
                return final_answer

            if not action_json:
                logger.warning("Agent failed to provide an Action. Stopping loop.")
                return response  # Return whatever it said as fallback

            try:
                action_data = json.loads(action_json)
                action_name = action_data.get("name")
                action_params = action_data.get("parameters", {})

                logger.info(f"Agent Action: {action_name}({action_params})")

                # 3. Execute Action
                observation = await self._execute_action(action_name, action_params, language, session_id)

                # 4. Add to history
                history.append({"thought": thought, "action": action_json, "observation": str(observation)})

            except Exception as e:
                error_msg = f"Error executing agent action: {str(e)}"
                logger.error(error_msg)
                history.append({"thought": thought, "action": action_json, "observation": f"ERROR: {error_msg}"})

        logger.warning("Agent reached maximum iterations.")
        final_answer = (
            "I've tried multiple steps but couldn't reach a final conclusion. Here is what I found so far: "
            + str(history[-1].get("observation", ""))
        )

        # Persist the full trace to neural memory for future debugging
        await self._log_trace_to_memory(query, history, final_answer)
        return final_answer

    async def _log_trace_to_memory(self, query: str, history: List[Dict], final_answer: str) -> None:
        """Write the complete ReAct trace to memory/agent_traces.md for auditability."""
        try:
            from datetime import datetime

            import aiofiles

            trace_path = "memory/agent_traces.md"

            lines = [f"\n## [{datetime.now().isoformat()}] Query: {query[:80]}\n"]
            for i, step in enumerate(history, 1):
                lines.append(f"**Step {i}**")
                lines.append(f"- Thought: {step.get('thought', '')}")
                lines.append(f"- Action: {step.get('action', '')}")
                lines.append(f"- Observation: {step.get('observation', '')}")
            lines.append(f"\n**Final Answer**: {final_answer}\n")
            lines.append("---")

            async with aiofiles.open(trace_path, "a", encoding="utf-8") as f:
                await f.write("\n".join(lines))
        except Exception as e:
            logger.debug(f"Could not write agent trace: {e}")

    async def _execute_action(self, name: str, params: Dict[str, Any], language: str, session_id: str) -> Any:
        """Invoke the system tools via the direct dispatcher with safety checks."""
        from config.commands import DANGEROUS_COMMANDS
        from handlers.command_handler import dispatch_command

        if name in DANGEROUS_COMMANDS:
            logger.warning(f"Agent attempted to execute dangerous command: {name}")
            return f"Action blocked: The command '{name}' is categorized as dangerous and requires manual confirmation by the user. I cannot execute it autonomously."

        try:
            # Call direct dispatcher
            result = await dispatch_command(
                command_key=name, params=params, current_lang=language, session_id=session_id
            )

            # Simplify observation for the LLM
            if result.get("success"):
                return result.get("response") or result.get("data") or "Action successful."
            else:
                return f"Action failed: {result.get('response', 'Unknown error')}"

        except Exception as e:
            return f"System Error: {str(e)}"

    def _extract_field(self, text: str, field_name: str) -> Optional[str]:
        """Extract content of a field like 'Thought: ...' or 'Action: ...'"""
        pattern = rf"{field_name}:\s*(.*?)(?=\n[A-Z][a-z]+:|$)"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()

        # Fallback for JSON blocks
        if field_name == "Action" and "```json" in text:
            json_match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
            if json_match:
                return json_match.group(1).strip()

        return None


# Singleton instance
agent_controller = AgentController()
