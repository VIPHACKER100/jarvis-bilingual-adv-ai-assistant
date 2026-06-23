from handlers.media.media_handler import MediaHandler
from handlers.memory.memory_handler import MemoryHandler
from handlers.system.desktop_handler import DesktopHandler
from handlers.system.file_handler import FileHandler
from handlers.system.input_handler import InputHandler
from handlers.system.personality_handler import PersonalityHandler
from handlers.system.system_handler import SystemHandler
from handlers.system.window_handler import WindowHandler
from handlers.web.whatsapp_handler import WhatsAppHandler

system_handler = SystemHandler()
window_handler = WindowHandler()
desktop_handler = DesktopHandler()
input_handler = InputHandler()
file_handler = FileHandler()
media_handler = MediaHandler()
whatsapp_handler = WhatsAppHandler()
personality_handler = PersonalityHandler()
memory_handler = MemoryHandler()

__all__ = [
    "system_handler", "window_handler", "desktop_handler",
    "input_handler", "file_handler", "media_handler",
    "whatsapp_handler", "personality_handler", "memory_handler",
]
