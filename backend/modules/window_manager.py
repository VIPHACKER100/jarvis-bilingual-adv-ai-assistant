import psutil
import subprocess
import time
import platform
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from fuzzywuzzy import fuzz, process
from modules.bilingual_parser import parser
from utils.platform_utils import is_windows, is_macos, is_linux, run_command
from utils.logger import logger, log_command

@dataclass
class WindowInfo:
    title: str
    pid: int
    hwnd: Optional[int]  # Windows handle
    is_minimized: bool
    is_maximized: bool
    position: Tuple[int, int]
    size: Tuple[int, int]

class WindowManager:
    """Cross-platform window and application manager"""
    
    def __init__(self):
        self.platform = platform.system().lower()
        self._init_platform()
        
    def _init_platform(self):
        """Initialize platform-specific components"""
        if is_windows():
            try:
                import win32gui
                import win32con
                self.win32gui = win32gui
                self.win32con = win32con
            except ImportError:
                logger.warning("pywin32 not installed. Some Windows features may not work.")
                self.win32gui = None
                self.win32con = None
        
    def _get_running_processes(self) -> List[Dict]:
        """Get list of running processes"""
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'exe', 'status']):
            try:
                pinfo = proc.info
                if pinfo['exe'] and pinfo['status'] == psutil.STATUS_RUNNING:
                    processes.append({
                        'pid': pinfo['pid'],
                        'name': pinfo['name'],
                        'exe': pinfo['exe']
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        return processes
    
    def _fuzzy_match_app(self, app_name: str, processes: List[Dict]) -> Optional[Dict]:
        """Fuzzy match app name against running processes"""
        app_name_lower = app_name.lower()
        
        # Extract process names for fuzzy matching
        process_names = [p['name'].lower() for p in processes]
        
        # Try exact match first
        for proc in processes:
            if app_name_lower in proc['name'].lower() or proc['name'].lower() in app_name_lower:
                return proc
        
        # Fuzzy match
        best_match = process.extractOne(app_name_lower, process_names, scorer=fuzz.partial_ratio)
        if best_match and best_match[1] >= 70:  # 70% similarity threshold
            idx = process_names.index(best_match[0])
            return processes[idx]
        
        return None
    
    def find_app_executable(self, app_name: str) -> Optional[str]:
        """Find executable path for an application"""
        # Common app mappings
        common_apps = {
            'chrome': ['chrome.exe', 'google chrome.app', 'google-chrome', 'chromium'],
            'firefox': ['firefox.exe', 'firefox.app', 'firefox'],
            'edge': ['msedge.exe', 'microsoft edge.app', 'microsoft-edge'],
            'notepad': ['notepad.exe', 'textedit.app', 'gedit', 'kate'],
            'calculator': ['calc.exe', 'calculator.app', 'gnome-calculator', 'kcalc'],
            'explorer': ['explorer.exe', 'finder.app', 'nautilus', 'dolphin'],
            'vscode': ['code.exe', 'visual studio code.app', 'code'],
            'spotify': ['spotify.exe', 'spotify.app', 'spotify'],
            'whatsapp': ['whatsapp.exe', 'whatsapp.app', 'whatsapp'],
            'word': ['winword.exe', 'microsoft word.app'],
            'excel': ['excel.exe', 'microsoft excel.app'],
            'powerpoint': ['powerpnt.exe', 'microsoft powerpoint.app'],
        }
        
        app_name_lower = app_name.lower()
        
        # Check common mappings
        for key, executables in common_apps.items():
            if key in app_name_lower or app_name_lower in key:
                for exe in executables:
                    if is_windows():
                        # Try to find in Program Files
                        import os
                        program_files = os.environ.get('PROGRAMFILES', 'C:\\Program Files')
                        program_files_x86 = os.environ.get('PROGRAMFILES(X86)', 'C:\\Program Files (x86)')
                        localappdata = os.environ.get('LOCALAPPDATA', '')
                        
                        paths = [
                            os.path.join(program_files, exe.replace('.exe', ''), exe),
                            os.path.join(program_files_x86, exe.replace('.exe', ''), exe),
                            os.path.join(localappdata, exe.replace('.exe', ''), exe),
                        ]
                        for path in paths:
                            if os.path.exists(path):
                                return path
                    else:
                        # For macOS/Linux, check PATH
                        import shutil
                        if shutil.which(exe.replace('.exe', '')):
                            return exe.replace('.exe', '')
        
        return None
    
    async def open_app(self, app_name: str, language: str = 'en') -> Dict:
        """Open an application"""
        try:
            logger.info(f"Opening application: {app_name}")
            
            # Try to find executable
            executable = self.find_app_executable(app_name)
            
            if executable:
                if is_windows():
                    subprocess.Popen(executable, shell=True)
                else:
                    subprocess.Popen([executable])
                
                log_command(f"open {app_name}", "open_app", True)
                
                return {
                    'success': True,
                    'action_type': 'OPEN_APP',
                    'app_name': app_name,
                    'response': parser.get_response('app_opened', language, app_name) if hasattr(parser, 'get_response') else f"Opening {app_name}",
                    'executable': executable
                }
            else:
                # Try system command
                if is_windows():
                    subprocess.Popen(f'start {app_name}', shell=True)
                elif is_macos():
                    subprocess.Popen(['open', '-a', app_name])
                else:
                    subprocess.Popen([app_name.lower()], shell=True)
                
                log_command(f"open {app_name}", "open_app", True)
                
                return {
                    'success': True,
                    'action_type': 'OPEN_APP',
                    'app_name': app_name,
                    'response': parser.get_response('app_opened', language, app_name) if hasattr(parser, 'get_response') else f"Opening {app_name}"
                }
                
        except Exception as e:
            logger.error(f"Error opening app {app_name}: {e}")
            return {
                'success': False,
                'action_type': 'OPEN_APP',
                'app_name': app_name,
                'error': str(e),
                'response': f"Failed to open {app_name}"
            }
    
    async def close_app(self, app_name: str, language: str = 'en', confirmed: bool = False) -> Dict:
        """Close an application"""
        if not confirmed:
            return {
                'success': False,
                'requires_confirmation': True,
                'action_type': 'CLOSE_APP',
                'app_name': app_name,
                'response': f"Are you sure you want to close {app_name}?",
                'confirmation_context': {'command': 'close_app', 'app_name': app_name}
            }
        
        try:
            processes = self._get_running_processes()
            matched_proc = self._fuzzy_match_app(app_name, processes)
            
            if matched_proc:
                pid = matched_proc['pid']
                proc = psutil.Process(pid)
                proc.terminate()
                
                # Wait a bit and force kill if still running
                time.sleep(1)
                if proc.is_running():
                    proc.kill()
                
                log_command(f"close {app_name}", "close_app", True)
                
                return {
                    'success': True,
                    'action_type': 'CLOSE_APP',
                    'app_name': app_name,
                    'response': f"Closed {app_name}"
                }
            else:
                return {
                    'success': False,
                    'action_type': 'CLOSE_APP',
                    'app_name': app_name,
                    'error': f"Could not find running application: {app_name}",
                    'response': f"{app_name} is not running"
                }
                
        except Exception as e:
            logger.error(f"Error closing app {app_name}: {e}")
            return {
                'success': False,
                'action_type': 'CLOSE_APP',
                'app_name': app_name,
                'error': str(e),
                'response': f"Failed to close {app_name}"
            }
    
    async def list_running_apps(self) -> Dict:
        """List all running applications"""
        try:
            processes = self._get_running_processes()
            apps = [{'pid': p['pid'], 'name': p['name'], 'exe': p['exe']} for p in processes[:20]]  # Limit to 20
            
            return {
                'success': True,
                'action_type': 'LIST_APPS',
                'apps': apps,
                'count': len(processes)
            }
        except Exception as e:
            logger.error(f"Error listing apps: {e}")
            return {
                'success': False,
                'action_type': 'LIST_APPS',
                'error': str(e)
            }
    
    def _get_window_list_windows(self) -> List[WindowInfo]:
        """Get list of windows on Windows"""
        windows = []
        
        if not self.win32gui:
            return windows
        
        def callback(hwnd, extra):
            if self.win32gui.IsWindowVisible(hwnd):
                title = self.win32gui.GetWindowText(hwnd)
                if title:
                    rect = self.win32gui.GetWindowPlacement(hwnd)
                    is_minimized = rect[1] == self.win32con.SW_SHOWMINIMIZED
                    is_maximized = rect[1] == self.win32con.SW_SHOWMAXIMIZED
                    
                    # Get window position and size
                    try:
                        left, top, right, bottom = self.win32gui.GetWindowRect(hwnd)
                        position = (left, top)
                        size = (right - left, bottom - top)
                    except:
                        position = (0, 0)
                        size = (0, 0)
                    
                    # Try to get PID
                    try:
                        import win32process
                        _, pid = win32process.GetWindowThreadProcessId(hwnd)
                    except:
                        pid = 0
                    
                    windows.append(WindowInfo(
                        title=title,
                        pid=pid,
                        hwnd=hwnd,
                        is_minimized=is_minimized,
                        is_maximized=is_maximized,
                        position=position,
                        size=size
                    ))
        
        self.win32gui.EnumWindows(callback, None)
        return windows
    
    async def get_window_list(self) -> Dict:
        """Get list of open windows"""
        try:
            if is_windows() and self.win32gui:
                windows = self._get_window_list_windows()
                window_data = [
                    {
                        'title': w.title,
                        'pid': w.pid,
                        'is_minimized': w.is_minimized,
                        'is_maximized': w.is_maximized,
                        'position': w.position,
                        'size': w.size
                    }
                    for w in windows[:15]  # Limit to 15 windows
                ]
                
                return {
                    'success': True,
                    'action_type': 'LIST_WINDOWS',
                    'windows': window_data,
                    'count': len(windows)
                }
            else:
                return {
                    'success': True,
                    'action_type': 'LIST_WINDOWS',
                    'windows': [],
                    'note': 'Window listing not fully supported on this platform'
                }
        except Exception as e:
            logger.error(f"Error listing windows: {e}")
            return {
                'success': False,
                'action_type': 'LIST_WINDOWS',
                'error': str(e)
            }
    
    async def minimize_window(self, window_title: Optional[str] = None, language: str = 'en') -> Dict:
        """Minimize a window"""
        try:
            if is_windows() and self.win32gui:
                if window_title:
                    # Find window by title
                    windows = self._get_window_list_windows()
                    titles = [w.title for w in windows]
                    best_match = process.extractOne(window_title.lower(), [t.lower() for t in titles], scorer=fuzz.partial_ratio)
                    
                    if best_match and best_match[1] >= 60:
                        idx = [t.lower() for t in titles].index(best_match[0])
                        hwnd = windows[idx].hwnd
                        self.win32gui.ShowWindow(hwnd, self.win32con.SW_MINIMIZE)
                        
                        return {
                            'success': True,
                            'action_type': 'MINIMIZE_WINDOW',
                            'window': windows[idx].title,
                            'response': f"Minimized {windows[idx].title}"
                        }
                else:
                    # Minimize active window
                    hwnd = self.win32gui.GetForegroundWindow()
                    self.win32gui.ShowWindow(hwnd, self.win32con.SW_MINIMIZE)
                    
                    return {
                        'success': True,
                        'action_type': 'MINIMIZE_WINDOW',
                        'response': "Minimized active window"
                    }
            
            return {
                'success': False,
                'action_type': 'MINIMIZE_WINDOW',
                'error': 'Could not minimize window'
            }
            
        except Exception as e:
            logger.error(f"Error minimizing window: {e}")
            return {
                'success': False,
                'action_type': 'MINIMIZE_WINDOW',
                'error': str(e)
            }
    
    async def maximize_window(self, window_title: Optional[str] = None, language: str = 'en') -> Dict:
        """Maximize a window"""
        try:
            if is_windows() and self.win32gui:
                if window_title:
                    windows = self._get_window_list_windows()
                    titles = [w.title for w in windows]
                    best_match = process.extractOne(window_title.lower(), [t.lower() for t in titles], scorer=fuzz.partial_ratio)
                    
                    if best_match and best_match[1] >= 60:
                        idx = [t.lower() for t in titles].index(best_match[0])
                        hwnd = windows[idx].hwnd
                        self.win32gui.ShowWindow(hwnd, self.win32con.SW_MAXIMIZE)
                        
                        return {
                            'success': True,
                            'action_type': 'MAXIMIZE_WINDOW',
                            'window': windows[idx].title,
                            'response': f"Maximized {windows[idx].title}"
                        }
                else:
                    hwnd = self.win32gui.GetForegroundWindow()
                    self.win32gui.ShowWindow(hwnd, self.win32con.SW_MAXIMIZE)
                    
                    return {
                        'success': True,
                        'action_type': 'MAXIMIZE_WINDOW',
                        'response': "Maximized active window"
                    }
            
            return {
                'success': False,
                'action_type': 'MAXIMIZE_WINDOW',
                'error': 'Could not maximize window'
            }
            
        except Exception as e:
            logger.error(f"Error maximizing window: {e}")
            return {
                'success': False,
                'action_type': 'MAXIMIZE_WINDOW',
                'error': str(e)
            }
    
    async def show_desktop(self, language: str = 'en') -> Dict:
        """Show desktop (minimize all windows)"""
        try:
            if is_windows():
                # Windows+D hotkey
                import pyautogui
                pyautogui.keyDown('win')
                pyautogui.keyDown('d')
                pyautogui.keyUp('d')
                pyautogui.keyUp('win')
                
                return {
                    'success': True,
                    'action_type': 'SHOW_DESKTOP',
                    'response': 'Showing desktop'
                }
            elif is_macos():
                # F11 or Command+F3
                import pyautogui
                pyautogui.keyDown('command')
                pyautogui.keyDown('f3')
                pyautogui.keyUp('f3')
                pyautogui.keyUp('command')
                
                return {
                    'success': True,
                    'action_type': 'SHOW_DESKTOP',
                    'response': 'Showing desktop'
                }
            else:
                # Linux - try xdotool
                run_command('xdotool key ctrl+alt+d')
                
                return {
                    'success': True,
                    'action_type': 'SHOW_DESKTOP',
                    'response': 'Showing desktop'
                }
                
        except Exception as e:
            logger.error(f"Error showing desktop: {e}")
            return {
                'success': False,
                'action_type': 'SHOW_DESKTOP',
                'error': str(e)
            }
    
    async def snap_window(self, direction: str, language: str = 'en') -> Dict:
        """Snap window to left/right/top/bottom"""
        try:
            direction_map = {
                'left': 'left',
                'right': 'right',
                'up': 'up',
                'down': 'down',
                'top': 'up',
                'bottom': 'down',
                'bayan': 'left',
                'dayan': 'right'
            }
            
            snap_dir = direction_map.get(direction.lower(), direction.lower())
            
            if is_windows():
                import pyautogui
                
                # Windows + Arrow keys for snapping
                key_map = {
                    'left': 'left',
                    'right': 'right',
                    'up': 'up',
                    'down': 'down'
                }
                
                if snap_dir in key_map:
                    pyautogui.keyDown('win')
                    pyautogui.keyDown(key_map[snap_dir])
                    pyautogui.keyUp(key_map[snap_dir])
                    pyautogui.keyUp('win')
                    
                    return {
                        'success': True,
                        'action_type': 'SNAP_WINDOW',
                        'direction': snap_dir,
                        'response': f"Snapped window to {snap_dir}"
                    }
            
            return {
                'success': False,
                'action_type': 'SNAP_WINDOW',
                'error': 'Window snapping not supported on this platform'
            }
            
        except Exception as e:
            logger.error(f"Error snapping window: {e}")
            return {
                'success': False,
                'action_type': 'SNAP_WINDOW',
                'error': str(e)
            }

# Singleton instance
window_manager = WindowManager()
