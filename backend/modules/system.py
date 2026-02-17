import psutil
import time
from datetime import datetime
from typing import Dict, Any
from modules.bilingual_parser import parser
from utils.platform_utils import (
    shutdown_system, restart_system, sleep_system,
    set_volume, get_volume, is_windows, is_macos, is_linux
)
from utils.logger import log_command, logger

class SystemModule:
    """Handle system-related commands"""
    
    def __init__(self):
        pass
    
    async def get_system_status(self, language: str = 'en') -> Dict[str, Any]:
        """Get complete system status"""
        try:
            # Battery
            battery = psutil.sensors_battery()
            battery_info = {
                'percent': int(battery.percent) if battery else None,
                'is_charging': battery.power_plugged if battery else None,
                'secs_left': battery.secsleft if battery else None
            }
            
            # CPU
            cpu_percent = psutil.cpu_percent(interval=0.1)
            cpu_count = psutil.cpu_count()
            
            # Memory
            memory = psutil.virtual_memory()
            memory_info = {
                'total': memory.total,
                'used': memory.used,
                'percent': memory.percent,
                'available': memory.available
            }
            
            # Disk
            disk = psutil.disk_usage('/')
            disk_info = {
                'total': disk.total,
                'used': disk.used,
                'free': disk.free,
                'percent': (disk.used / disk.total) * 100
            }
            
            # Network
            net_io = psutil.net_io_counters()
            network_info = {
                'bytes_sent': net_io.bytes_sent,
                'bytes_recv': net_io.bytes_recv,
                'packets_sent': net_io.packets_sent,
                'packets_recv': net_io.packets_recv
            }
            
            # Uptime
            boot_time = psutil.boot_time()
            uptime_seconds = time.time() - boot_time
            
            # Current volume
            current_volume = get_volume()
            
            return {
                'success': True,
                'battery': battery_info,
                'cpu': {
                    'percent': cpu_percent,
                    'count': cpu_count
                },
                'memory': memory_info,
                'disk': disk_info,
                'network': network_info,
                'uptime': uptime_seconds,
                'volume': current_volume,
                'platform': 'Windows' if is_windows() else 'macOS' if is_macos() else 'Linux',
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting system status: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def get_battery_status(self, language: str = 'en') -> Dict[str, Any]:
        """Get battery information"""
        try:
            battery = psutil.sensors_battery()
            if battery:
                response_text = parser.get_response(
                    'battery_status', 
                    language, 
                    int(battery.percent)
                )
                return {
                    'success': True,
                    'percent': int(battery.percent),
                    'is_charging': battery.power_plugged,
                    'response': response_text
                }
            else:
                return {
                    'success': False,
                    'error': 'No battery found',
                    'response': parser.get_response('battery_status', language, 'unknown')
                }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def get_time(self, language: str = 'en') -> Dict[str, Any]:
        """Get current time"""
        now = datetime.now()
        time_str = now.strftime('%I:%M %p')  # 12-hour format
        response_text = parser.get_response('time_is', language, time_str)
        
        return {
            'success': True,
            'time': now.isoformat(),
            'formatted': time_str,
            'response': response_text
        }
    
    async def get_date(self, language: str = 'en') -> Dict[str, Any]:
        """Get current date"""
        now = datetime.now()
        date_str = now.strftime('%A, %B %d, %Y')  # Full format
        response_text = parser.get_response('date_is', language, date_str)
        
        return {
            'success': True,
            'date': now.isoformat(),
            'formatted': date_str,
            'response': response_text
        }
    
    async def shutdown(self, language: str = 'en', confirmed: bool = False) -> Dict[str, Any]:
        """Shutdown computer"""
        if not confirmed:
            return {
                'success': False,
                'requires_confirmation': True,
                'confirmation_id': None,
                'response': parser.get_response('confirm_shutdown', language)
            }
        
        log_command('shutdown', 'shutdown', True)
        success, stdout, stderr = shutdown_system()
        
        return {
            'success': success,
            'response': parser.get_response('shutdown_initiated', language),
            'error': stderr if not success else None
        }
    
    async def restart(self, language: str = 'en', confirmed: bool = False) -> Dict[str, Any]:
        """Restart computer"""
        if not confirmed:
            return {
                'success': False,
                'requires_confirmation': True,
                'confirmation_id': None,
                'response': parser.get_response('confirm_restart', language)
            }
        
        log_command('restart', 'restart', True)
        success, stdout, stderr = restart_system()
        
        return {
            'success': success,
            'response': parser.get_response('restart_initiated', language),
            'error': stderr if not success else None
        }
    
    async def sleep(self, language: str = 'en', confirmed: bool = False) -> Dict[str, Any]:
        """Sleep/suspend computer"""
        if not confirmed:
            return {
                'success': False,
                'requires_confirmation': True,
                'confirmation_id': None,
                'response': parser.get_response('confirm_shutdown', language)  # Reuse
            }
        
        log_command('sleep', 'sleep', True)
        success, stdout, stderr = sleep_system()
        
        return {
            'success': success,
            'response': parser.get_response('shutdown_initiated', language),
            'error': stderr if not success else None
        }
    
    async def volume_up(self, language: str = 'en') -> Dict[str, Any]:
        """Increase volume"""
        try:
            current = get_volume()
            new_volume = min(current + 10, 100)
            success = set_volume(new_volume)
            
            log_command('volume_up', 'volume_up', success, {'from': current, 'to': new_volume})
            
            return {
                'success': success,
                'volume': new_volume,
                'response': parser.get_response('volume_increased', language)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': parser.get_response('command_not_understood', language)
            }
    
    async def volume_down(self, language: str = 'en') -> Dict[str, Any]:
        """Decrease volume"""
        try:
            current = get_volume()
            new_volume = max(current - 10, 0)
            success = set_volume(new_volume)
            
            log_command('volume_down', 'volume_down', success, {'from': current, 'to': new_volume})
            
            return {
                'success': success,
                'volume': new_volume,
                'response': parser.get_response('volume_decreased', language)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': parser.get_response('command_not_understood', language)
            }

# Singleton instance
system_module = SystemModule()
