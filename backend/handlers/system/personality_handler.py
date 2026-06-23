from typing import Any, Dict, Optional

from config import CONFIG, save_config


class PersonalityHandler:
    async def handle(self, command_key: str, params: Any, current_lang: str) -> Optional[Dict[str, Any]]:
        if command_key == "set_personality":
            from modules.personalities import personality_manager

            p_id = str(params).lower().strip() if params else "stark"
            if personality_manager.set_personality(p_id):
                CONFIG["personality"] = p_id
                save_config(CONFIG)
                name = personality_manager.get_config()["name"]
                return {
                    "success": True,
                    "action_type": "PERSONALITY_SET",
                    "response": f"Switching to {name} protocol, Sir."
                    if current_lang == "en"
                    else f"{name} प्रोटोकॉल सक्रिय।",
                }
            return {
                "success": False,
                "action_type": "PERSONALITY_SET",
                "response": f"Unknown personality '{p_id}'. Available: stark, midnight, avenue, linear.",
            }
        return None
