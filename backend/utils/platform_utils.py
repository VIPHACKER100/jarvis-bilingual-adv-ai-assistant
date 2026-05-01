import platform
import os
import subprocess
from pathlib import Path
from config import PLATFORM
from utils.logger import logger

def get_platform():
    """Get current platform"""
    return PLATFORM

def is_windows():
    return PLATFORM == 'windows'

def is_macos():
    return PLATFORM == 'darwin'

def is_linux():
    return PLATFORM == 'linux'

from utils.automation_utils import safe_automation
import asyncio

async def run_command(command, shell=True):
    """Run system command safely (async wrapper)"""
    result = await safe_automation.run_command(command, shell=shell)
    return result.get("success", False), result.get("stdout", ""), result.get("stderr", "")

def get_whatsapp_desktop_path():
    """Auto-detect WhatsApp Desktop installation"""
    possible_paths = []
    
    if is_windows():
        possible_paths = [
            os.path.expandvars(r"%LOCALAPPDATA%\WhatsApp\WhatsApp.exe"),
            os.path.expandvars(r"%PROGRAMFILES%\WhatsApp\WhatsApp.exe"),
            os.path.expandvars(r"%PROGRAMFILES(X86)%\WhatsApp\WhatsApp.exe"),
        ]
    elif is_macos():
        possible_paths = [
            "/Applications/WhatsApp.app",
            os.path.expanduser("~/Applications/WhatsApp.app"),
        ]
    elif is_linux():
        possible_paths = [
            "/usr/bin/whatsapp",
            "/usr/share/whatsapp/whatsapp",
            "/snap/bin/whatsapp",
            "/var/lib/flatpak/app/com.whatsapp.WhatsApp",
        ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    return None

async def shutdown_system():
    """Shutdown computer"""
    if is_windows():
        return await run_command("shutdown /s /t 0")
    elif is_macos():
        return await run_command("osascript -e 'tell app \"System Events\" to shut down'")
    elif is_linux():
        return await run_command("systemctl poweroff")
    return False, "", "Unsupported platform"

async def restart_system():
    """Restart computer"""
    if is_windows():
        return await run_command("shutdown /r /t 0")
    elif is_macos():
        return await run_command("osascript -e 'tell app \"System Events\" to restart'")
    elif is_linux():
        return await run_command("systemctl reboot")
    return False, "", "Unsupported platform"

async def sleep_system():
    """Sleep computer"""
    if is_windows():
        return await run_command("rundll32.exe powrprof.dll,SetSuspendState 0,1,0")
    elif is_macos():
        return await run_command("osascript -e 'tell app \"System Events\" to sleep'")
    elif is_linux():
        return await run_command("systemctl suspend")
    return False, "", "Unsupported platform"

def _set_volume_windows(percent):
    try:
        import pythoncom
        from comtypes import CLSCTX_ALL
        from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
        
        pythoncom.CoInitialize()
        devices = AudioUtilities.GetSpeakers()
        interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
        volume = interface.QueryInterface(IAudioEndpointVolume)
        
        volume.SetMasterVolumeLevelScalar(percent / 100.0, None)
        return True
    except Exception as e:
        logger.error(f"Error setting volume on Windows: {e}")
        return False
    finally:
        try:
            import pythoncom
            pythoncom.CoUninitialize()
        except:
            pass



async def set_volume(percent):
    """Set system volume (0-100)"""
    if is_windows():
        return await asyncio.to_thread(_set_volume_windows, percent)
    elif is_macos():
        success, stdout, stderr = await run_command(f"osascript -e 'set volume output volume {percent}'")
        return success
    elif is_linux():
        success, stdout, stderr = await run_command(f"amixer set Master {percent}%")
        return success
    return False

def _get_volume_windows():
    try:
        import pythoncom
        from comtypes import CLSCTX_ALL
        from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
        
        pythoncom.CoInitialize()
        devices = AudioUtilities.GetSpeakers()
        interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
        volume = interface.QueryInterface(IAudioEndpointVolume)
        
        vol_scalar = volume.GetMasterVolumeLevelScalar()
        return int(vol_scalar * 100)
    except Exception as e:
        logger.error(f"Error getting volume on Windows: {e}")
        return 50
    finally:
        try:
            import pythoncom
            pythoncom.CoUninitialize()
        except:
            pass

async def get_volume():

    """Get current system volume"""
    if is_windows():
        return await asyncio.to_thread(_get_volume_windows)
    elif is_macos():
        success, output, _ = await run_command("osascript -e 'output volume of (get volume settings)'")
        return int(output.strip()) if success else 50
    elif is_linux():
        success, output, _ = await run_command("amixer get Master | grep -oP '\\[\\K[0-9]+(?=%\\])'")
        return int(output.strip()) if success and output.strip() else 50
    return 50

def _set_mute_windows(mute_state):
    try:
        import pythoncom
        from comtypes import CLSCTX_ALL
        from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
        
        pythoncom.CoInitialize()
        devices = AudioUtilities.GetSpeakers()
        interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
        volume = interface.QueryInterface(IAudioEndpointVolume)
        
        volume.SetMute(1 if mute_state else 0, None)
        return True
    except Exception as e:
        logger.error(f"Error setting mute on Windows: {e}")
        return False
    finally:
        try:
            import pythoncom
            pythoncom.CoUninitialize()
        except:
            pass



async def set_mute(mute_state):
    """Set system mute state (True/False)"""
    if is_windows():
        return await asyncio.to_thread(_set_mute_windows, mute_state)
    elif is_macos():
        state = 'true' if mute_state else 'false'
        success, stdout, stderr = await run_command(f"osascript -e 'set volume output muted {state}'")
        return success
    elif is_linux():
        action = 'mute' if mute_state else 'unmute'
        success, stdout, stderr = await run_command(f"amixer set Master {action}")
        return success
    return False

def _is_muted_windows():
    try:
        import pythoncom
        from comtypes import CLSCTX_ALL
        from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
        
        pythoncom.CoInitialize()
        devices = AudioUtilities.GetSpeakers()
        interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
        volume = interface.QueryInterface(IAudioEndpointVolume)
        
        return volume.GetMute() == 1
    except Exception as e:
        logger.error(f"Error checking mute on Windows: {e}")
        return False
    finally:
        try:
            import pythoncom
            pythoncom.CoUninitialize()
        except:
            pass



async def is_muted():
    """Check if system is muted"""
    if is_windows():
        return await asyncio.to_thread(_is_muted_windows)
    elif is_macos():
        success, output, _ = await run_command("osascript -e 'output muted of (get volume settings)'")
        return output.strip().lower() == 'true' if success else False
    elif is_linux():
        success, output, _ = await run_command("amixer get Master")
        return '[off]' in output if success else False
    return False
