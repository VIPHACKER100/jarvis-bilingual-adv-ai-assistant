import asyncio
import subprocess
import time
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
import pyautogui
from utils.logger import logger

class SafeAutomation:
    """Wrapper for GUI and system automation to ensure safety and reliability"""
    
    def __init__(self, default_timeout: float = 10.0):
        self.default_timeout = default_timeout
        # Configure pyautogui safety
        pyautogui.FAILSAFE = True
        pyautogui.PAUSE = 0.5

    async def run_gui_action(self, action: Callable, *args, **kwargs) -> Dict[str, Any]:
        """Run a GUI action (pyautogui) in a thread pool with safety checks"""
        try:
            result = await asyncio.to_thread(action, *args, **kwargs)
            return {"success": True, "result": result}
        except pyautogui.FailSafeException:
            logger.error("PyAutoGUI FailSafe triggered! User moved mouse to corner.")
            return {"success": False, "error": "FailSafe triggered by user"}
        except Exception as e:
            logger.error(f"GUI action failed: {e}")
            return {"success": False, "error": str(e)}

    async def run_command(self, command: Union[str, List[str]], shell: bool = False, timeout: Optional[float] = None) -> Dict[str, Any]:
        """Run a system command asynchronously with timeout and safety"""
        try:
            # Use asyncio.create_subprocess_exec/shell for true async
            if shell:
                process = await asyncio.create_subprocess_shell(
                    command if isinstance(command, str) else " ".join(command),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
            else:
                process = await asyncio.create_subprocess_exec(
                    *command if isinstance(command, list) else command.split(),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )

            try:
                stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout or self.default_timeout)
                return {
                    "success": process.returncode == 0,
                    "stdout": stdout.decode().strip(),
                    "stderr": stderr.decode().strip(),
                    "returncode": process.returncode
                }
            except asyncio.TimeoutError:
                process.kill()
                logger.error(f"Command timed out after {timeout or self.default_timeout}s: {command}")
                return {"success": False, "error": "Command timed out"}

        except Exception as e:
            logger.error(f"System command failed: {e}")
            return {"success": False, "error": str(e)}
    async def moveTo(self, x: int, y: int, duration: float = 0.0):
        return await self.run_gui_action(pyautogui.moveTo, x, y, duration=duration)

    async def click(self, x: Optional[int] = None, y: Optional[int] = None, button: str = 'left', clicks: int = 1):
        return await self.run_gui_action(pyautogui.click, x=x, y=y, button=button, clicks=clicks)

    async def doubleClick(self, x: Optional[int] = None, y: Optional[int] = None):
        return await self.run_gui_action(pyautogui.doubleClick, x=x, y=y)

    async def rightClick(self, x: Optional[int] = None, y: Optional[int] = None):
        return await self.run_gui_action(pyautogui.rightClick, x=x, y=y)

    async def scroll(self, amount: int):
        return await self.run_gui_action(pyautogui.scroll, amount)

    async def dragTo(self, x: int, y: int, duration: float = 0.0):
        return await self.run_gui_action(pyautogui.dragTo, x, y, duration=duration)

    async def typewrite(self, text: str, interval: float = 0.1):
        return await self.run_gui_action(pyautogui.typewrite, text, interval=interval)

    async def press(self, key: str):
        return await self.run_gui_action(pyautogui.press, key)

    async def hotkey(self, *args):
        return await self.run_gui_action(pyautogui.hotkey, *args)

    async def screenshot(self, region: Optional[Tuple[int, int, int, int]] = None):
        return await self.run_gui_action(pyautogui.screenshot, region=region)

    async def capture_screenshot(self, region: Optional[Tuple[int, int, int, int]] = None):
        """Return a PIL Image from pyautogui.screenshot, or raise on failure."""
        if region:
            result = await self.run_gui_action(pyautogui.screenshot, region=region)
        else:
            result = await self.run_gui_action(pyautogui.screenshot)
        if not result.get("success"):
            raise RuntimeError(result.get("error", "Screenshot failed"))
        return result["result"]

# Singleton instance
safe_automation = SafeAutomation()
