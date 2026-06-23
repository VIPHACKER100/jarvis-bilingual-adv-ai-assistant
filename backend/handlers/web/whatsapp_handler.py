from typing import Any, Dict, Optional

from modules.whatsapp import whatsapp_manager


class WhatsAppHandler:

    async def handle(self, command_key: str, params: Any, current_lang: str) -> Optional[Dict[str, Any]]:
        if command_key == 'whatsapp_message':
            if params:
                if isinstance(params, dict):
                    contact, msg = params.get('contact', ''), params.get('message', '')
                    return await whatsapp_manager.send_message(contact, msg, current_lang)
                parts = [p.strip() for p in str(params).split(',')]
                if len(parts) >= 2:
                    return await whatsapp_manager.send_message(parts[0], ' '.join(parts[1:]), current_lang)
                return await whatsapp_manager.send_message(parts[0], "", current_lang)
            return await whatsapp_manager.open_whatsapp(current_lang)

        if command_key == 'whatsapp_call':
            contact = params.get('contact', str(params)) if isinstance(params, dict) else str(params)
            is_video = 'video' in str(params).lower()
            return await whatsapp_manager.call_contact(contact, is_video, current_lang)

        if command_key == 'whatsapp_draft_reply':
            return await whatsapp_manager.draft_smart_reply(current_lang)

        return None
