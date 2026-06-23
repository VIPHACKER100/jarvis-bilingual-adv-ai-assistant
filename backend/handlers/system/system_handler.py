import re
from typing import Any, Dict, Optional

from modules.system import system_module


class SystemHandler:
    async def handle(self, command_key: str, params: Any, current_lang: str) -> Optional[Dict[str, Any]]:
        if command_key == "system_status":
            return await system_module.get_system_status(current_lang)
        if command_key == "time":
            return await system_module.get_time(current_lang)
        if command_key == "date":
            return await system_module.get_date(current_lang)
        if command_key == "battery":
            return await system_module.get_battery_status(current_lang)
        if command_key == "shutdown":
            return await system_module.shutdown(current_lang)
        if command_key == "restart":
            return await system_module.restart(current_lang)
        if command_key == "sleep":
            return await system_module.sleep(current_lang)

        if command_key in ("volume_up", "volume_down"):
            amount = None
            if params:
                nums = re.findall(r"\d+", str(params))
                if nums:
                    amount = int(nums[0])
            if command_key == "volume_up":
                return await system_module.volume_up(amount, current_lang)
            return await system_module.volume_down(amount, current_lang)

        if command_key == "mute":
            return await system_module.toggle_mute(current_lang)
        if command_key == "brightness_up":
            return await system_module.brightness_up(current_lang)
        if command_key == "brightness_down":
            return await system_module.brightness_down(current_lang)

        if command_key == "google_search":
            query = (
                params.get("query", str(params))
                if isinstance(params, dict)
                else (params if params != command_key else None)
            )
            return await system_module.google_search(query, current_lang)
        if command_key == "open_browser":
            return await system_module.google_search(None, current_lang)

        if command_key == "ip_address":
            return await system_module.get_network_info(current_lang)
        if command_key == "uptime":
            return await system_module.get_uptime(current_lang)
        if command_key == "weather":
            city = (
                params.get("city", str(params))
                if isinstance(params, dict)
                else (params if params != command_key else None)
            )
            return await system_module.get_weather(city, current_lang)

        return None
