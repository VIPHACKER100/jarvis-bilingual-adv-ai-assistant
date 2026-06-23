from typing import Any, Dict, Optional

from modules.input_control import input_controller


class InputHandler:
    async def handle(self, command_key: str, params: Any, current_lang: str) -> Optional[Dict[str, Any]]:
        if command_key == "move_cursor":
            if isinstance(params, dict):
                x, y = params.get("x", 0), params.get("y", 0)
                return await input_controller.move_cursor(x, y)
        if command_key == "click":
            button = params.get("button", "left") if isinstance(params, dict) else "left"
            return await input_controller.click(button)
        if command_key == "double_click":
            return await input_controller.double_click()
        if command_key == "right_click":
            return await input_controller.right_click()
        if command_key == "scroll_up":
            return await input_controller.scroll(3)
        if command_key == "scroll_down":
            return await input_controller.scroll(-3)
        if command_key == "type_text":
            text = params.get("text", str(params)) if isinstance(params, dict) else str(params)
            return await input_controller.type_text(text)
        if command_key == "press_key":
            key = params.get("key", str(params)) if isinstance(params, dict) else str(params)
            return await input_controller.press_key(key)
        if command_key == "hotkey":
            keys = params.get("keys", []) if isinstance(params, dict) else [str(params)]
            return await input_controller.press_hotkey(keys)
        if command_key == "new_tab":
            return await input_controller.new_tab()
        if command_key == "close_tab":
            return await input_controller.close_tab()
        if command_key == "copy":
            return await input_controller.copy_selection()
        if command_key == "paste":
            return await input_controller.paste_clipboard()
        if command_key == "select_all":
            return await input_controller.select_all()
        if command_key == "undo":
            return await input_controller.undo()
        if command_key == "save":
            return await input_controller.save()
        if command_key == "new_window":
            return await input_controller.new_window()
        if command_key == "find":
            return await input_controller.find()
        return None
