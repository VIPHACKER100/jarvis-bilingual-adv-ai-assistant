import asyncio
import random
from typing import Dict, List, Optional

import pyautogui
from utils.automation_utils import safe_automation
from utils.logger_structured import log_command, logger
from utils.platform_utils import is_macos


class InputController:
    """Cross-platform mouse and keyboard controller with human-like delays"""

    def __init__(self):
        # Configure screen size
        self.screen_width, self.screen_height = pyautogui.size()

    async def _human_delay(self, min_ms: int = 50, max_ms: int = 150):
        """Add random human-like delay (async)"""
        delay = random.randint(min_ms, max_ms) / 1000.0
        await asyncio.sleep(delay)

    async def _typing_delay(self):
        """Delay between keystrokes (typing speed) (async)"""
        delay = random.randint(30, 80) / 1000.0  # 30-80ms between keys
        await asyncio.sleep(delay)

    async def get_cursor_position(self) -> Dict:
        """Get current cursor position"""
        try:
            # position() is non-blocking IO call usually, but we can wrap it if needed
            x, y = pyautogui.position()
            return {
                'success': True, 'action_type': 'GET_CURSOR', 'position': {
                    'x': x, 'y': y}, 'screen': {
                    'width': self.screen_width, 'height': self.screen_height}}
        except Exception as e:
            logger.error(f"Error getting cursor position: {e}")
            return {
                'success': False,
                'action_type': 'GET_CURSOR',
                'error': str(e)
            }

    async def move_cursor(self, x: int, y: int, duration: float = 0.5) -> Dict:
        """Move cursor to absolute position"""
        try:
            # Validate coordinates
            if x < 0 or x > self.screen_width or y < 0 or y > self.screen_height:
                return {
                    'success': False,
                    'action_type': 'MOVE_CURSOR',
                    'error': f'Coordinates out of bounds. Screen size: {self.screen_width}x{self.screen_height}'}

            # Add human-like movement via SafeAutomation
            await safe_automation.moveTo(x, y, duration=duration)
            await self._human_delay()

            log_command(f"move cursor to {x},{y}", "move_cursor", True)

            return {
                'success': True,
                'action_type': 'MOVE_CURSOR',
                'position': {'x': x, 'y': y}
            }

        except Exception as e:
            logger.error(f"Error moving cursor: {e}")
            return {
                'success': False,
                'action_type': 'MOVE_CURSOR',
                'error': str(e)
            }

    async def move_cursor_relative(self, dx: int, dy: int) -> Dict:
        """Move cursor relative to current position"""
        try:
            current_x, current_y = pyautogui.position()
            new_x = current_x + dx
            new_y = current_y + dy

            # Check bounds
            if new_x < 0 or new_x > self.screen_width or new_y < 0 or new_y > self.screen_height:
                return {
                    'success': False,
                    'action_type': 'MOVE_CURSOR_RELATIVE',
                    'error': 'Movement would go off screen'
                }

            await safe_automation.run_gui_action(pyautogui.moveRel, dx, dy, duration=0.3)
            await self._human_delay()

            return {
                'success': True,
                'action_type': 'MOVE_CURSOR_RELATIVE',
                'delta': {'dx': dx, 'dy': dy},
                'position': {'x': new_x, 'y': new_y}
            }

        except Exception as e:
            logger.error(f"Error moving cursor relatively: {e}")
            return {
                'success': False,
                'action_type': 'MOVE_CURSOR_RELATIVE',
                'error': str(e)
            }

    async def click(self, button: str = 'left', clicks: int = 1) -> Dict:
        """Click mouse button"""
        try:
            valid_buttons = ['left', 'right', 'middle']
            if button not in valid_buttons:
                return {
                    'success': False,
                    'action_type': 'MOUSE_CLICK',
                    'error': f'Invalid button. Use: {valid_buttons}'
                }

            await self._human_delay(80, 120)  # Slight delay before click
            await safe_automation.click(button=button, clicks=clicks)
            await self._human_delay(50, 100)

            log_command(f"{button} click", "mouse_click", True)

            return {
                'success': True,
                'action_type': 'MOUSE_CLICK',
                'button': button,
                'clicks': clicks
            }

        except Exception as e:
            logger.error(f"Error clicking: {e}")
            return {
                'success': False,
                'action_type': 'MOUSE_CLICK',
                'error': str(e)
            }

    async def double_click(self) -> Dict:
        """Double click"""
        try:
            await self._human_delay(80, 120)
            await safe_automation.doubleClick()
            await self._human_delay(50, 100)

            return {
                'success': True,
                'action_type': 'DOUBLE_CLICK'
            }

        except Exception as e:
            logger.error(f"Error double clicking: {e}")
            return {
                'success': False,
                'action_type': 'DOUBLE_CLICK',
                'error': str(e)
            }

    async def right_click(self) -> Dict:
        """Right click"""
        return await self.click(button='right')

    async def scroll(self, amount: int, direction: str = 'vertical') -> Dict:
        """Scroll mouse wheel"""
        try:
            await self._human_delay(50, 100)

            if direction == 'horizontal':
                await safe_automation.run_gui_action(pyautogui.hscroll, amount)
            else:
                await safe_automation.scroll(amount)

            await self._human_delay(50, 100)

            return {
                'success': True,
                'action_type': 'SCROLL',
                'amount': amount,
                'direction': direction
            }

        except Exception as e:
            logger.error(f"Error scrolling: {e}")
            return {
                'success': False,
                'action_type': 'SCROLL',
                'error': str(e)
            }

    async def drag(
            self,
            start_x: int,
            start_y: int,
            end_x: int,
            end_y: int,
            duration: float = 1.0) -> Dict:
        """Drag from start to end position"""
        try:
            # Move to start position
            await safe_automation.moveTo(start_x, start_y, duration=0.2)
            await self._human_delay(100, 200)

            # Drag to end position
            await safe_automation.dragTo(end_x, end_y, duration=duration)
            await self._human_delay(50, 100)

            return {
                'success': True,
                'action_type': 'DRAG',
                'start': {'x': start_x, 'y': start_y},
                'end': {'x': end_x, 'y': end_y}
            }

        except Exception as e:
            logger.error(f"Error dragging: {e}")
            return {
                'success': False,
                'action_type': 'DRAG',
                'error': str(e)
            }

    async def type_text(
            self,
            text: str,
            interval: Optional[float] = None) -> Dict:
        """Type text with human-like speed"""
        try:
            if interval is None:
                interval = random.uniform(
                    0.03, 0.08)  # 30-80ms between characters

            await self._human_delay(200, 300)  # Delay before typing
            await safe_automation.typewrite(text, interval=interval)
            await self._human_delay(100, 200)

            preview = text[:20] if len(text) > 20 else text
            log_command(f"type text: {preview}...", "type_text", True)

            return {
                'success': True,
                'action_type': 'TYPE_TEXT',
                'text_length': len(text)
            }

        except Exception as e:
            logger.error(f"Error typing text: {e}")
            return {
                'success': False,
                'action_type': 'TYPE_TEXT',
                'error': str(e)
            }

    async def press_key(self, key: str) -> Dict:
        """Press a single key"""
        try:
            valid_keys = [
                'enter', 'return', 'tab', 'escape', 'esc', 'backspace', 'delete',
                'del', 'insert', 'ins', 'home', 'end', 'pageup', 'pagedown',
                'pgup', 'pgdn', 'up', 'down', 'left', 'right', 'f1', 'f2', 'f3',
                'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'space',
                'shift', 'ctrl', 'alt', 'win', 'command', 'option'
            ]

            # Normalize key name
            key_lower = key.lower()
            if key_lower not in valid_keys and len(key_lower) > 1:
                # Try to map common variations
                key_map = {
                    'enter': 'enter',
                    'return': 'enter',
                    'esc': 'escape',
                    'del': 'delete',
                    'ins': 'insert',
                    'pgup': 'pageup',
                    'pgdn': 'pagedown',
                    'windows': 'win',
                    'command': 'command' if is_macos() else 'win',
                    'option': 'alt'
                }
                key_lower = key_map.get(key_lower, key_lower)

            await self._typing_delay()
            await safe_automation.press(key_lower)
            await self._typing_delay()

            return {
                'success': True,
                'action_type': 'PRESS_KEY',
                'key': key_lower
            }

        except Exception as e:
            logger.error(f"Error pressing key: {e}")
            return {
                'success': False,
                'action_type': 'PRESS_KEY',
                'error': str(e)
            }

    async def press_hotkey(self, keys: List[str]) -> Dict:
        """Press multiple keys simultaneously (hotkey)"""
        try:
            if len(keys) < 2:
                return {
                    'success': False,
                    'action_type': 'PRESS_HOTKEY',
                    'error': 'Hotkey requires at least 2 keys'
                }

            await self._human_delay(100, 200)

            # Normalize keys
            normalized_keys = []
            for key in keys:
                key_lower = key.lower()
                if key_lower in ['windows', 'win']:
                    key_lower = 'win'
                elif key_lower == 'command' and is_macos():
                    key_lower = 'command'
                elif key_lower == 'ctrl' and is_macos():
                    key_lower = 'ctrl'
                normalized_keys.append(key_lower)

            await safe_automation.hotkey(*normalized_keys)
            await self._human_delay(100, 200)

            log_command(f"hotkey: {'+'.join(keys)}", "press_hotkey", True)

            return {
                'success': True,
                'action_type': 'PRESS_HOTKEY',
                'keys': normalized_keys
            }

        except Exception as e:
            logger.error(f"Error pressing hotkey: {e}")
            return {
                'success': False,
                'action_type': 'PRESS_HOTKEY',
                'error': str(e)
            }

    async def copy_selection(self) -> Dict:
        """Copy selected text (Ctrl+C / Cmd+C)"""
        if is_macos():
            return await self.press_hotkey(['command', 'c'])
        else:
            return await self.press_hotkey(['ctrl', 'c'])

    async def paste_clipboard(self) -> Dict:
        """Paste clipboard (Ctrl+V / Cmd+V)"""
        if is_macos():
            return await self.press_hotkey(['command', 'v'])
        else:
            return await self.press_hotkey(['ctrl', 'v'])

    async def select_all(self) -> Dict:
        """Select all (Ctrl+A / Cmd+A)"""
        if is_macos():
            return await self.press_hotkey(['command', 'a'])
        else:
            return await self.press_hotkey(['ctrl', 'a'])

    async def undo(self) -> Dict:
        """Undo (Ctrl+Z / Cmd+Z)"""
        if is_macos():
            return await self.press_hotkey(['command', 'z'])
        else:
            return await self.press_hotkey(['ctrl', 'z'])

    async def save(self) -> Dict:
        """Save (Ctrl+S / Cmd+S)"""
        if is_macos():
            return await self.press_hotkey(['command', 's'])
        else:
            return await self.press_hotkey(['ctrl', 's'])

    async def close_tab(self) -> Dict:
        """Close tab (Ctrl+W / Cmd+W)"""
        if is_macos():
            return await self.press_hotkey(['command', 'w'])
        else:
            return await self.press_hotkey(['ctrl', 'w'])

    async def new_tab(self) -> Dict:
        """New tab (Ctrl+T / Cmd+T)"""
        if is_macos():
            return await self.press_hotkey(['command', 't'])
        else:
            return await self.press_hotkey(['ctrl', 't'])

    async def new_window(self) -> Dict:
        """New window (Ctrl+N / Cmd+N)"""
        if is_macos():
            return await self.press_hotkey(['command', 'n'])
        else:
            return await self.press_hotkey(['ctrl', 'n'])

    async def find(self) -> Dict:
        """Find (Ctrl+F / Cmd+F)"""
        if is_macos():
            return await self.press_hotkey(['command', 'f'])
        else:
            return await self.press_hotkey(['ctrl', 'f'])

    async def take_screenshot_region(
            self,
            x: int,
            y: int,
            width: int,
            height: int) -> Dict:
        """Take screenshot of specific region"""
        try:
            import base64
            import io

            result = await safe_automation.screenshot(region=(x, y, width, height))
            if not result.get("success"):
                return result

            screenshot = result["result"]

            # Convert to base64 for sending to frontend
            buffered = io.BytesIO()
            screenshot.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()

            return {
                'success': True,
                'action_type': 'SCREENSHOT_REGION',
                'region': {'x': x, 'y': y, 'width': width, 'height': height},
                'image': f'data:image/png;base64,{img_str}'
            }

        except Exception as e:
            logger.error(f"Error taking screenshot: {e}")
            return {
                'success': False,
                'action_type': 'SCREENSHOT_REGION',
                'error': str(e)
            }


# Singleton instance
input_controller = InputController()
