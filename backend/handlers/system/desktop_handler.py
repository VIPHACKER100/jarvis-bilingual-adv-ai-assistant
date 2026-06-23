from typing import Any, Dict, Optional

from modules.desktop import desktop_manager


class DesktopHandler:

    async def handle(self, command_key: str, params: Any, current_lang: str) -> Optional[Dict[str, Any]]:
        if command_key == 'take_screenshot':
            return await desktop_manager.take_screenshot(True, current_lang)
        if command_key == 'media_play':
            return await desktop_manager.play_pause_media(current_lang)
        if command_key == 'media_next':
            return await desktop_manager.next_track(current_lang)
        if command_key == 'media_previous':
            return await desktop_manager.previous_track(current_lang)
        if command_key == 'stop_media':
            return await desktop_manager.stop_media(current_lang)
        if command_key == 'get_clipboard':
            return await desktop_manager.get_clipboard_text(current_lang)
        if command_key == 'set_clipboard':
            text = params.get('text', str(params)) if isinstance(params, dict) else str(params)
            return await desktop_manager.set_clipboard_text(text, current_lang)
        if command_key == 'change_wallpaper':
            path = params.get('path', str(params)) if isinstance(params, dict) else str(params)
            return await desktop_manager.change_wallpaper(path, current_lang)
        if command_key == 'empty_recycle_bin':
            return await desktop_manager.empty_recycle_bin(current_lang)
        if command_key == 'toggle_taskbar':
            return await desktop_manager.toggle_taskbar(current_lang)
        if command_key == 'zoom_in':
            return await desktop_manager.zoom_screen('in', current_lang)
        if command_key == 'zoom_out':
            return await desktop_manager.zoom_screen('out', current_lang)
        if command_key == 'toggle_desktop_icons':
            return await desktop_manager.toggle_desktop_icons(current_lang)
        if command_key == 'set_theme':
            theme = params.get('theme', str(params)) if isinstance(params, dict) else str(params)
            return await desktop_manager.set_theme(theme, current_lang)
        return None
