import asyncio
import json
import os
import webbrowser
from typing import Dict, Optional

import aiofiles
import pyperclip
from config import DATA_DIR
from utils.automation_utils import safe_automation
from utils.logger_structured import log_command, logger
from utils.platform_utils import get_whatsapp_desktop_path, is_macos, is_windows, run_command


class WhatsAppManager:
    """WhatsApp automation via Web and Desktop"""

    def __init__(self):
        self.desktop_path = None
        self.recent_contacts = {}  # Cache recent contacts
        self.contacts_file = DATA_DIR / 'contacts.json'
        self.contacts_map = {} # Initialized in load_contacts

    async def initialize(self):
        """Initialize the manager async"""
        self.contacts_map = await self._load_contacts()

    async def _load_contacts(self) -> Dict[str, str]:
        """Load contact mapping from JSON (async)"""
        try:
            if os.path.exists(self.contacts_file):
                async with aiofiles.open(self.contacts_file, 'r', encoding='utf-8') as f:
                    content = await f.read()
                    return json.loads(content)
        except Exception as e:
            logger.error(f"Error loading contacts: {e}")
        return {}

    def _resolve_contact(self, contact: str) -> str:
        """Resolve contact alias (e.g. 'mom' -> actual name)"""
        if not contact:
            return contact

        info = self._get_contact_info(contact)
        if info:
            return info.get('name', contact)

        return contact

    def _get_contact_info(self, contact: str) -> Optional[Dict[str, str]]:
        """Get full contact info (name, phone) for an alias or name"""
        if not contact:
            return None

        contact_lower = contact.lower()

        # Check direct match in map
        if contact_lower in self.contacts_map:
            val = self.contacts_map[contact_lower]
            if isinstance(val, dict):
                return val
            return {"name": val, "phone": ""}

        # Check partial alias matches
        for alias, info in self.contacts_map.items():
            if alias in contact_lower:
                if isinstance(info, dict):
                    return info
                return {"name": info, "phone": ""}

        # If no alias match, return as-is
        return {"name": contact, "phone": ""}

    def _find_whatsapp_desktop(self) -> Optional[str]:
        """Find WhatsApp Desktop installation"""
        if self.desktop_path and os.path.exists(self.desktop_path):
            return self.desktop_path

        path = get_whatsapp_desktop_path()
        if path:
            self.desktop_path = path
        return path

    async def _is_whatsapp_running(self) -> bool:
        """Check if WhatsApp Desktop is running (async)"""
        def check():
            import psutil
            for proc in psutil.process_iter(['name']):
                try:
                    if 'whatsapp' in proc.info['name'].lower():
                        return True
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
            return False

        return await asyncio.to_thread(check)

    async def _focus_whatsapp_window(self) -> bool:
        """Focus WhatsApp Desktop window (async)"""
        try:
            if is_windows():
                def focus_win():
                    import win32con
                    import win32gui
                    found = False

                    def callback(hwnd, extra):
                        nonlocal found
                        if win32gui.IsWindowVisible(hwnd):
                            title = win32gui.GetWindowText(hwnd)
                            if 'whatsapp' in title.lower():
                                if win32gui.IsIconic(hwnd):
                                    win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
                                win32gui.SetForegroundWindow(hwnd)
                                found = True
                                return False # Stop enumeration
                        return True

                    win32gui.EnumWindows(callback, None)
                    return found

                return await asyncio.to_thread(focus_win)

            elif is_macos():
                await run_command('osascript -e "tell application \"WhatsApp\" to activate"')
                return True

            else:
                await run_command('xdotool search --name "WhatsApp" windowactivate')
                return True

        except Exception as e:
            logger.error(f"Error focusing WhatsApp: {e}")
            return False

    async def _search_contact_desktop(self, contact_name: str) -> bool:
        """Search for contact in WhatsApp Desktop (async)"""
        try:
            # Press Ctrl+K to open search
            if is_macos():
                await safe_automation.hotkey('command', 'k')
            else:
                await safe_automation.hotkey('ctrl', 'k')

            await asyncio.sleep(0.5)

            # Type contact name
            await safe_automation.typewrite(contact_name, interval=0.05)
            await asyncio.sleep(1)

            # Press Enter to select first result
            await safe_automation.press('enter')
            await asyncio.sleep(0.5)

            return True

        except Exception as e:
            logger.error(f"Error searching contact: {e}")
            return False

    async def open_whatsapp_web(self, language: str = 'en') -> Dict:
        """Open WhatsApp Web in browser"""
        try:
            # webbrowser.open is usually non-blocking but we can thread it if it's slow
            await asyncio.to_thread(webbrowser.open, 'https://web.whatsapp.com')

            response = "Opening WhatsApp Web. Please scan the QR code if not already logged in."
            if language == 'hi':
                response = "WhatsApp Web खोल रहा हूँ। कृपया QR कोड स्कैन करें यदि पहले से लॉग इन नहीं हैं।"

            return {
                'success': True,
                'action_type': 'WHATSAPP_WEB',
                'method': 'web',
                'response': response
            }

        except Exception as e:
            logger.error(f"Error opening WhatsApp Web: {e}")
            return {
                'success': False,
                'action_type': 'WHATSAPP_WEB',
                'error': str(e)
            }

    async def open_whatsapp(self, language: str = 'en') -> Dict:
        """Open WhatsApp (prefers desktop)"""
        return await self.open_whatsapp_desktop(language)

    async def open_whatsapp_desktop(self, language: str = 'en') -> Dict:
        """Open WhatsApp Desktop application"""
        try:
            desktop_path = self._find_whatsapp_desktop()

            if not desktop_path:
                return await self.open_whatsapp_web(language)

            if not await self._is_whatsapp_running():
                if is_windows():
                    await asyncio.to_thread(os.startfile, desktop_path)
                elif is_macos():
                    await run_command(f'open "{desktop_path}"')
                else:
                    await run_command(desktop_path)

                await asyncio.sleep(3)
            else:
                await self._focus_whatsapp_window()

            response = "Opening WhatsApp Desktop."
            if language == 'hi':
                response = "WhatsApp Desktop खोल रहा हूँ।"

            return {
                'success': True,
                'action_type': 'WHATSAPP_DESKTOP',
                'method': 'desktop',
                'response': response
            }

        except Exception as e:
            logger.error(f"Error opening WhatsApp Desktop: {e}")
            return await self.open_whatsapp_web(language)

    async def send_message(self, contact: str, message: str, language: str = 'en') -> Dict:
        """Send message (prefers desktop if running, else web)"""
        if await self._is_whatsapp_running():
            return await self.send_message_desktop(contact, message, language)
        return await self.send_message_web(contact, message, language)

    async def send_message_web(
            self,
            contact: str,
            message: str,
            language: str = 'en') -> Dict:
        """Send message via WhatsApp Web"""
        try:
            import urllib.parse

            info = self._get_contact_info(contact)
            contact_name = info.get('name', contact)
            phone = info.get('phone', '').replace(' ', '').replace('-', '')

            if not phone:
                potential_phone = contact.replace(' ', '').replace('-', '')
                if potential_phone.isdigit() or (potential_phone.startswith('+') and potential_phone[1:].isdigit()):
                    phone = potential_phone

            if not phone:
                await asyncio.to_thread(webbrowser.open, 'https://web.whatsapp.com')

                response = f"Opening WhatsApp Web. Please search for {contact_name} and send your message."
                if language == 'hi':
                    response = f"WhatsApp Web खोल रहा हूँ। कृपया {contact_name} को खोजें और अपना संदेश भेजें।"

                return {
                    'success': True,
                    'action_type': 'WHATSAPP_MESSAGE',
                    'method': 'web',
                    'contact': contact_name,
                    'response': response
                }
            else:
                encoded_message = urllib.parse.quote(message)
                url = f"https://wa.me/{phone}?text={encoded_message}"
                await asyncio.to_thread(webbrowser.open, url)

                response = f"Opening WhatsApp chat with {contact_name}. Click send to deliver message."
                if language == 'hi':
                    response = f"{contact_name} के साथ WhatsApp चैट खोल रहा हूँ। संदेश भेजने के लिए सेंड पर क्लिक करें।"

                return {
                    'success': True,
                    'action_type': 'WHATSAPP_MESSAGE',
                    'method': 'web',
                    'contact': contact_name,
                    'phone': phone,
                    'message': message,
                    'response': response
                }

        except Exception as e:
            logger.error(f"Error sending WhatsApp message (web): {e}")
            return {
                'success': False,
                'action_type': 'WHATSAPP_MESSAGE',
                'error': str(e)
            }

    async def send_message_desktop(
            self,
            contact: str,
            message: str,
            language: str = 'en',
            confirmed: bool = False) -> Dict:
        """Send message via WhatsApp Desktop automation"""
        contact = self._resolve_contact(contact)

        if not confirmed:
            return {
                'success': False,
                'requires_confirmation': True,
                'action_type': 'WHATSAPP_MESSAGE',
                'method': 'desktop',
                'contact': contact,
                'message': message,
                'response': f"Send message to {contact}: '{message[:30]}...'?" if len(message) > 30 else f"Send message to {contact}: '{message}'?",
                'confirmation_context': {
                    'command': 'whatsapp_send_desktop',
                    'contact': contact,
                    'message': message
                }
            }

        try:
            desktop_path = self._find_whatsapp_desktop()
            if not desktop_path:
                return await self.send_message_web(contact, message, language)

            await self.open_whatsapp_desktop(language)
            await asyncio.sleep(2)

            if not await self._search_contact_desktop(contact):
                return {
                    'success': False,
                    'action_type': 'WHATSAPP_MESSAGE',
                    'error': f"Could not find contact: {contact}"
                }

            await asyncio.sleep(1)

            # Type message
            await safe_automation.typewrite(message, interval=0.03)
            await asyncio.sleep(0.5)

            # Press Enter to send
            await safe_automation.press('enter')

            log_command(
                f"WhatsApp message to {contact}",
                "whatsapp_message",
                True)

            response = f"Message sent to {contact}"
            if language == 'hi':
                response = f"{contact} को संदेश भेज दिया गया है"

            return {
                'success': True,
                'action_type': 'WHATSAPP_MESSAGE',
                'method': 'desktop',
                'contact': contact,
                'message': message,
                'response': response
            }

        except Exception as e:
            logger.error(f"Error sending WhatsApp message (desktop): {e}")
            return await self.send_message_web(contact, message, language)

    async def call_contact(
            self,
            contact: str,
            video: bool = False,
            language: str = 'en') -> Dict:
        """Make WhatsApp call (voice or video)"""
        call_type = 'video' if video else 'voice'
        try:
            contact = self._resolve_contact(contact)
            desktop_path = self._find_whatsapp_desktop()

            if desktop_path and await self._is_whatsapp_running():
                await self.open_whatsapp_desktop(language)
                await asyncio.sleep(2)

                if not await self._search_contact_desktop(contact):
                    return {
                        'success': False,
                        'action_type': 'WHATSAPP_CALL',
                        'error': f"Could not find contact: {contact}"
                    }

                await asyncio.sleep(1)

                response = f"WhatsApp {call_type} call started with {contact}"
                if language == 'hi':
                    response = f"{contact} के साथ WhatsApp {call_type} कॉल शुरू हो गई है"

                return {
                    'success': True,
                    'action_type': 'WHATSAPP_CALL',
                    'contact': contact,
                    'call_type': call_type,
                    'response': response
                }
            else:
                response = f"Please open WhatsApp and call {contact} manually. Desktop automation requires WhatsApp Desktop to be installed."
                if language == 'hi':
                    response = f"कृपया {contact} को कॉल करने के लिए WhatsApp खोलें। Desktop automation के लिए WhatsApp Desktop इंस्टॉल होना चाहिए।"

                return {
                    'success': True,
                    'action_type': 'WHATSAPP_CALL',
                    'method': 'manual',
                    'contact': contact,
                    'response': response
                }

        except Exception as e:
            logger.error(f"Error making WhatsApp call: {e}")
            return {
                'success': False,
                'action_type': 'WHATSAPP_CALL',
                'error': str(e)
            }

    async def get_known_contacts(self, language: str = 'en') -> Dict:
        """Get list of known contacts and aliases"""
        contacts = []
        for alias, info in self.contacts_map.items():
            if isinstance(info, dict):
                contacts.append({
                    "alias": alias,
                    "name": info.get("name", ""),
                    "phone": info.get("phone", "")
                })
            else:
                contacts.append({
                    "alias": alias,
                    "name": info,
                    "phone": ""
                })

        return {
            "success": True,
            "contacts": contacts,
            "count": len(contacts)
        }

    async def get_status(self, language: str = 'en') -> Dict:
        """Check WhatsApp status and availability"""
        desktop_available = self._find_whatsapp_desktop() is not None
        is_running = await self._is_whatsapp_running()

        status_text = "WhatsApp Desktop is available" if desktop_available else "WhatsApp Desktop is not installed (using Web fallback)"
        if is_running:
            status_text += " and currently running."
        else:
            status_text += " but not currently running."

        return {
            "success": True,
            "desktop_installed": desktop_available,
            "is_running": is_running,
            "response": status_text
        }

    async def draft_smart_reply(self, language: str = 'en') -> Dict:
        """Draft a reply based on the current WhatsApp screen context using OCR"""
        try:
            from modules.context import context_manager
            from modules.llm_wrapper import llm_module

            visual_context = await context_manager.get_visual_context()

            if not visual_context or "[Visual Context:" not in visual_context:
                return {
                    "success": False,
                    "response": "I cannot see any active chat, sir. Please ensure WhatsApp is open and focused.",
                    "error": "No visual context available"
                }

            prompt = (
                "Based on the following screen text from a WhatsApp conversation, "
                "draft a concise, natural, and helpful reply. "
                f"The reply should be in {language}. "
                "Output ONLY the reply text, no quotes or explanations."
            )

            draft = await llm_module.get_response(
                text=visual_context,
                language=language,
                context=prompt
            )

            if draft:
                await asyncio.to_thread(pyperclip.copy, draft)

                response = f"I've drafted a reply based on the conversation: '{draft[:50]}...'. It's been copied to your clipboard, sir."
                if language == 'hi':
                    response = f"मैंने बातचीत के आधार पर एक उत्तर तैयार किया है: '{draft[:50]}...'। इसे आपके क्लिपबोर्ड पर कॉपी कर दिया गया है।"

                return {
                    "success": True,
                    "draft": draft,
                    "response": response
                }

            return {
                "success": False,
                "response": "I was unable to draft a reply at this time.",
                "error": "LLM failed to generate draft"
            }

        except Exception as e:
            logger.error(f"Error drafting smart reply: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# Singleton instance
whatsapp_manager = WhatsAppManager()
# Note: Should be initialized via await whatsapp_manager.initialize() in main startup
