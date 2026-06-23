from typing import Any, Dict, Optional

from modules.window_manager import window_manager


class WindowHandler:
    async def handle(self, command_key: str, params: Any, current_lang: str) -> Optional[Dict[str, Any]]:
        if command_key == "open_app":
            app_name = params.get("app", str(params)) if isinstance(params, dict) else str(params)
            return await window_manager.open_app(app_name, current_lang)
        if command_key == "close_app":
            app_name = params.get("app", str(params)) if isinstance(params, dict) else str(params)
            return await window_manager.close_app(app_name, current_lang)
        if command_key == "minimize":
            return await window_manager.minimize_window(params, current_lang)
        if command_key == "maximize":
            return await window_manager.maximize_window(params, current_lang)
        if command_key == "snap_left":
            return await window_manager.snap_window("left", current_lang)
        if command_key == "snap_right":
            return await window_manager.snap_window("right", current_lang)
        if command_key == "close_window":
            return await window_manager.close_window_by_title(params, current_lang)
        if command_key == "show_desktop":
            return await window_manager.show_desktop(current_lang)
        return None
