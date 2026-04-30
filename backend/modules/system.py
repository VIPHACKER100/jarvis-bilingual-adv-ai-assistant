import psutil
import time
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional, cast
from modules.bilingual_parser import parser
from utils.platform_utils import (
    shutdown_system, restart_system, sleep_system,
    set_volume, get_volume, set_mute, is_muted,
    is_windows, is_macos, is_linux
)
from utils.logger import log_command, logger
from models import (
    SystemStatusResponse, BatteryInfo, CPUInfo, MemoryInfo, 
    DiskInfo, NetworkIOInfo, BatteryResponse, TimeResponse, 
    DateResponse, VolumeResponse, UptimeResponse, NetworkInfoResponse
)


class SystemModule:
    """Handle system-related commands"""

    def __init__(self):
        self._last_battery_alert = 0
        self._last_cpu_alert = 0
        self._last_process_alert = 0
        self._last_status_cache = None
        self._last_status_time = 0
        self._status_cache_ttl = 2.0  # seconds
        self._quarantined_pids: List[int] = []

    async def get_system_status(self, language: str = 'en') -> SystemStatusResponse:
        """Get complete system status with intelligent caching"""
        now = time.time()
        if self._last_status_cache and (now - self._last_status_time < self._status_cache_ttl):
            return self._last_status_cache

        start = now
        try:
            # Battery
            battery = await asyncio.to_thread(psutil.sensors_battery)
            battery_info = BatteryInfo(
                percent=int(battery.percent) if battery else None,
                is_charging=battery.power_plugged if battery else None,
                secs_left=battery.secsleft if battery else None
            )

            # CPU
            cpu_percent = await asyncio.to_thread(psutil.cpu_percent, interval=0.1)
            cpu_info = CPUInfo(
                percent=cpu_percent,
                count=await asyncio.to_thread(psutil.cpu_count)
            )

            # Memory
            memory = await asyncio.to_thread(psutil.virtual_memory)
            memory_info = MemoryInfo(
                total=memory.total,
                used=memory.used,
                percent=memory.percent,
                available=memory.available
            )

            # Disk
            disk = await asyncio.to_thread(psutil.disk_usage, '/')
            disk_info = DiskInfo(
                total=disk.total,
                used=disk.used,
                free=disk.free,
                percent=(disk.used / disk.total) * 100
            )

            # Network
            net_io = await asyncio.to_thread(psutil.net_io_counters)
            network_info = NetworkIOInfo(
                bytes_sent=net_io.bytes_sent,
                bytes_recv=net_io.bytes_recv,
                packets_sent=net_io.packets_sent,
                packets_recv=net_io.packets_recv
            )

            # Uptime
            boot_time = await asyncio.to_thread(psutil.boot_time)
            uptime_seconds = time.time() - boot_time

            # Current volume
            current_volume = await get_volume()

            platform_name = 'Windows' if is_windows() else 'macOS' if is_macos() else 'Linux'

            # Contextual info
            active_window = None
            context_suggestion = None
            try:
                from modules.window_manager import window_manager
                from modules.context import context_manager
                
                win = await window_manager.get_active_window()
                if win:
                    active_window = {
                        "title": win.get("title", "Unknown"),
                        "process": win.get("process", "Unknown")
                    }
                
                context_suggestion = await context_manager.suggest_next_action()
            except Exception as context_err:
                logger.debug(f"Could not get context for status: {context_err}")

            # Check system health and push notifications if needed
            await self.check_system_health(battery_info, cpu_percent)
            await self.monitor_processes()

            status = SystemStatusResponse(
                response=f"System status retrieved successfully in {language}",
                battery=battery_info,
                cpu=cpu_info,
                memory=memory_info,
                disk=disk_info,
                network=network_info,
                uptime=uptime_seconds,
                volume=current_volume,
                platform=platform_name,
                active_window=active_window,
                context_suggestion=context_suggestion,
                response_time=round(time.time() - start, 4)
            )
            
            # Cache the result
            self._last_status_cache = status
            self._last_status_time = time.time()
            
            return status

        except Exception as e:
            logger.error(f"Error getting system status: {e}")
            return SystemStatusResponse(
                success=False,
                response="Failed to retrieve system status",
                error=str(e),
                response_time=round(time.time() - start, 4)
            )

    async def get_battery_status(self, language: str = 'en') -> BatteryResponse:
        """Get battery information"""
        start = time.time()
        try:
            battery = await asyncio.to_thread(psutil.sensors_battery)
            if battery:
                response_text = parser.get_response(
                    'battery_status',
                    language,
                    int(battery.percent)
                )
                return BatteryResponse(
                    response=response_text,
                    percent=int(battery.percent),
                    is_charging=battery.power_plugged,
                    response_time=round(time.time() - start, 4)
                )
            else:
                return BatteryResponse(
                    success=False,
                    response=parser.get_response('battery_status', language, 'unknown'),
                    error='No battery found',
                    response_time=round(time.time() - start, 4)
                )
        except Exception as e:
            duration = round(time.time() - start, 4)
            return BatteryResponse(
                success=False,
                response="Failed to get battery status",
                error=str(e),
                response_time=duration
            )

    async def get_time(self, language: str = 'en') -> TimeResponse:
        """Get current time"""
        start = time.time()
        now = datetime.now()
        time_str = now.strftime('%I:%M %p')  # 12-hour format
        response_text = parser.get_response('time_is', language, time_str)
        duration = round(time.time() - start, 4)

        return TimeResponse(
            success=True,
            time=now.isoformat(),
            formatted=time_str,
            response=response_text,
            response_time=duration
        )

    async def get_date(self, language: str = 'en') -> DateResponse:
        """Get current date"""
        start = time.time()
        now = datetime.now()
        date_str = now.strftime('%A, %B %d, %Y')  # Full format
        response_text = parser.get_response('date_is', language, date_str)
        duration = round(time.time() - start, 4)

        return DateResponse(
            success=True,
            date=now.isoformat(),
            formatted=date_str,
            response=response_text,
            response_time=duration
        )

    async def shutdown(self, language: str = 'en',
                       confirmed: bool = False) -> Dict[str, Any]:
        """Shutdown computer"""
        if not confirmed:
            return {
                'success': False,
                'requires_confirmation': True,
                'confirmation_id': None,
                'response': parser.get_response('confirm_shutdown', language)
            }

        log_command('shutdown', 'shutdown', True)
        success, stdout, stderr = await shutdown_system()

        return {
            'success': success,
            'response': parser.get_response('shutdown_initiated', language),
            'error': stderr if not success else None
        }

    async def restart(self, language: str = 'en',
                      confirmed: bool = False) -> Dict[str, Any]:
        """Restart computer"""
        if not confirmed:
            return {
                'success': False,
                'requires_confirmation': True,
                'confirmation_id': None,
                'response': parser.get_response('confirm_restart', language)
            }

        log_command('restart', 'restart', True)
        success, stdout, stderr = await restart_system()

        return {
            'success': success,
            'response': parser.get_response('restart_initiated', language),
            'error': stderr if not success else None
        }

    async def sleep(self, language: str = 'en',
                    confirmed: bool = False) -> Dict[str, Any]:
        """Sleep/suspend computer"""
        if not confirmed:
            return {
                'success': False,
                'requires_confirmation': True,
                'confirmation_id': None,
                # Reuse
                'response': parser.get_response('confirm_shutdown', language)
            }

        log_command('sleep', 'sleep', True)
        success, stdout, stderr = await sleep_system()

        return {
            'success': success,
            'response': parser.get_response('shutdown_initiated', language),
            'error': stderr if not success else None
        }

    async def volume_up(self, amount: Optional[int] = None, language: str = 'en') -> Dict[str, Any]:
        """Increase volume"""
        try:
            current = await get_volume()
            increment = amount if amount is not None else 10
            new_volume = min(current + increment, 100)
            success = await set_volume(new_volume)

            log_command(
                'volume_up', 'volume_up', success, {
                    'from': current, 'to': new_volume, 'amount': increment})

            return {
                'success': success,
                'volume': new_volume,
                'response': parser.get_response('volume_increased', language, new_volume)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': parser.get_response(
                    'command_not_understood',
                    language)}

    async def volume_down(self, amount: Optional[int] = None, language: str = 'en') -> Dict[str, Any]:
        """Decrease volume"""
        try:
            current = await get_volume()
            decrement = amount if amount is not None else 10
            new_volume = max(current - decrement, 0)
            success = await set_volume(new_volume)

            log_command(
                'volume_down', 'volume_down', success, {
                    'from': current, 'to': new_volume, 'amount': decrement})

            return {
                'success': success,
                'volume': new_volume,
                'response': parser.get_response('volume_decreased', language, new_volume)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': parser.get_response(
                    'command_not_understood',
                    language)}

    async def toggle_mute(self, language: str = 'en') -> Dict[str, Any]:
        """Toggle system mute state"""
        try:
            muted = await is_muted()
            new_state = not muted
            success = await set_mute(new_state)

            log_command('mute', 'mute', success, {'state': 'muted' if new_state else 'unmuted'})

            if new_state:
                response = parser.get_response('muted', language)
            else:
                response = parser.get_response('unmuted', language)

            return {
                'success': success,
                'is_muted': new_state,
                'response': response
            }
        except Exception as e:
            logger.error(f"Error toggling mute: {e}")
            return {
                'success': False,
                'error': str(e),
                'response': parser.get_response('command_not_understood', language)
            }

    async def get_brightness(self) -> int:
        """Get current screen brightness"""
        try:
            import screen_brightness_control as sbc
            return (await asyncio.to_thread(sbc.get_brightness))[0]
        except BaseException:
            return 50

    async def set_brightness(self, level: int) -> bool:
        """Set screen brightness (0-100)"""
        try:
            import screen_brightness_control as sbc
            await asyncio.to_thread(sbc.set_brightness, level)
            return True
        except BaseException:
            return False

    async def brightness_up(self, language: str = 'en') -> Dict[str, Any]:
        """Increase brightness"""
        try:
            current = await self.get_brightness()
            new_level = min(current + 10, 100)
            success = await self.set_brightness(new_level)

            log_command(
                'brightness_up', 'brightness_up', success, {
                    'from': current, 'to': new_level})

            return {
                'success': success,
                'brightness': new_level,
                'response': parser.get_response('brightness_increased', language, new_level)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': "Failed to change brightness"}

    async def brightness_down(self, language: str = 'en') -> Dict[str, Any]:
        """Decrease brightness"""
        try:
            current = await self.get_brightness()
            new_level = max(current - 10, 0)
            success = await self.set_brightness(new_level)

            log_command(
                'brightness_down', 'brightness_down', success, {
                    'from': current, 'to': new_level})

            return {
                'success': success,
                'brightness': new_level,
                'response': parser.get_response('brightness_decreased', language, new_level)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': "Failed to change brightness"}

    async def get_network_info(self, language: str = 'en') -> Dict[str, Any]:
        """Get network connection information"""
        try:
            import socket
            hostname = await asyncio.to_thread(socket.gethostname)
            ip_address = await asyncio.to_thread(socket.gethostbyname, hostname)

            # Use psutil for interface details
            addrs = await asyncio.to_thread(psutil.net_if_addrs)
            stats = await asyncio.to_thread(psutil.net_if_stats)

            interfaces = []
            for name, addr_list in addrs.items():
                if name in stats:
                    is_up = stats.get(name).isup
                else:
                    is_up = False
                
                if is_up:
                    for addr in addr_list:
                        if addr.family == socket.AF_INET:  # IPv4
                            interfaces.append(
                                {'name': name, 'ip': addr.address})

            response = f"Network Info: Connected as {hostname} (IP: {ip_address})" if language == 'en' else f"नेटवर्क जानकारी: {hostname} के रूप में जुड़ा हुआ है (IP: {ip_address})"

            return {
                'success': True,
                'hostname': hostname,
                'ip': ip_address,
                'interfaces': interfaces,
                'response': response
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': "Failed to get network info"}

    async def google_search(
            self, query: Optional[str] = None, language: str = 'en') -> Dict[str, Any]:
        """Open web browser for Google search or home page"""
        try:
            import webbrowser
            if not query or query.lower() in ['none', 'null', '']:
                url = "https://www.google.com"
                msg = "Opening Google" if language == 'en' else "गूगल खोल रहा हूँ"
            else:
                url = f"https://www.google.com/search?q={query}"
                msg = f"Searching for '{query}' on Google" if language == 'en' else f"गूगल पर '{query}' के लिए खोज रहा हूँ"
            
            await asyncio.to_thread(webbrowser.open, url)
            log_command(f"search {query}" if query else "open browser", "google_search", True)

            return {
                'success': True,
                'query': query,
                'response': msg
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': "Failed to open search"}

    async def get_weather(self,
                          city: Optional[str] = None,
                          language: str = 'en') -> Dict[str,
                                                        Any]:
        """Get weather info (simplified browser-based or API if key available)"""
        # For a production app, we'd use an API. For this, we can open a browser or use a simple scraper.
        # Let's open the browser for now as a more reliable "feature" for the
        # user.
        try:
            import webbrowser
            query = f"weather in {city}" if city else "weather today"
            url = f"https://www.google.com/search?q={query}"
            await asyncio.to_thread(webbrowser.open, url)

            weather_target = city or ('current location' if language == 'en' else 'वर्तमान स्थान')
            response_text = f"Checking weather for {weather_target}" if language == 'en' else f"{weather_target} के लिए मौसम की जानकारी देख रहा हूँ"
            
            return {
                'success': True, 
                'city': city, 
                'response': response_text
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': "Failed to get weather"}

    async def get_uptime(self, language: str = 'en') -> Dict[str, Any]:
        """Get system uptime"""
        try:
            boot_time = await asyncio.to_thread(psutil.boot_time)
            uptime_seconds = time.time() - boot_time

            # Format uptime
            days = int(uptime_seconds // (24 * 3600))
            hours = int((uptime_seconds % (24 * 3600)) // 3600)
            minutes = int((uptime_seconds % 3600) // 60)

            uptime_str = f"{days}d {hours}h {minutes}m"
            response = f"System Uptime: {uptime_str}" if language == 'en' else f"सिस्टम अपटाइम: {uptime_str}"

            return {
                'success': True,
                'uptime_seconds': uptime_seconds,
                'formatted': uptime_str,
                'response': response
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': "Failed to get uptime"}


    async def check_system_health(self, battery: BatteryInfo, cpu_percent: float):
        """Check system health and broadcast notifications for critical events"""
        try:
            from routers.websocket import broadcast_notification
            
            # Low Battery Alert
            if battery.percent is not None and battery.percent < 20 and not battery.is_charging:
                # Use a flag to avoid spamming
                if not hasattr(self, '_last_battery_alert') or time.time() - self._last_battery_alert > 300:
                    await broadcast_notification(
                        title="Critical Battery Level",
                        message=f"Battery is at {battery.percent}%. Please connect your charger, sir.",
                        type="warning",
                        duration=10000
                    )
                    self._last_battery_alert = time.time()
            
            # High CPU Alert
            if cpu_percent > 90:
                if not hasattr(self, '_last_cpu_alert') or time.time() - self._last_cpu_alert > 600:
                    await broadcast_notification(
                        title="High System Load",
                        message=f"CPU usage is at {cpu_percent}%. Performance may be impacted.",
                        type="error",
                        duration=8000
                    )
                    self._last_cpu_alert = time.time()
                    
        except Exception as e:
            logger.debug(f"Notification broadcast skipped: {e}")

    async def monitor_processes(self):
        """Scan for suspicious processes based on Neural Security Node and resource usage"""
        try:
            from modules.memory import memory_manager
            from routers.websocket import broadcast_notification
            
            # Throttling Process Guardian
            if hasattr(self, '_last_process_scan') and time.time() - self._last_process_scan < 10:
                return
            self._last_process_scan = time.time()

            # Load security node for context
            security_content = await memory_manager.neural.get_node("security.md")
            # Simple check for blacklist titles in memory (this can be made more robust)
            blacklist = ["regedit.exe", "remote_desktop.exe"]
            
            suspicious = []
            
            def scan_processes():
                res = []
                for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
                    try:
                        pinfo = proc.info
                        # Skip System Idle Process (PID 0) and System process
                        if pinfo['pid'] == 0 or pinfo['name'] == 'System Idle Process':
                            continue
                            
                        # High Resource Spike Check
                        if pinfo['cpu_percent'] > 95:
                            res.append(f"{pinfo['name']} (PID: {pinfo['pid']}) - Critical CPU Spike")
                        
                        # Blacklist Check
                        if pinfo['name'] in blacklist:
                            res.append(f"{pinfo['name']} (PID: {pinfo['pid']}) - Blacklisted Process Detected")
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        continue
                return res

            suspicious = await asyncio.to_thread(scan_processes)
            
            if suspicious and (time.time() - self._last_process_alert > 300):
                await broadcast_notification(
                    title="Process Guardian Alert",
                    message=f"Suspicious activity detected: {suspicious[0]}",
                    type="error",
                    duration=10000
                )
                self._last_process_alert = time.time()
                logger.warning(f"Process Guardian flagged: {suspicious}")
                
        except Exception as e:
            logger.error(f"Error in Process Guardian: {e}")

    async def quarantine_process(self, pid: int, action: str = "suspend") -> bool:
        """Proactively isolate or terminate a suspicious process"""
        try:
            proc = await asyncio.to_thread(psutil.Process, pid)
            if action == "suspend":
                await asyncio.to_thread(proc.suspend)
                self._quarantined_pids.append(pid)
                logger.info(f"Process {pid} suspended by Guardian.")
            elif action == "resume":
                await asyncio.to_thread(proc.resume)
                if pid in self._quarantined_pids:
                    self._quarantined_pids.remove(pid)
                logger.info(f"Process {pid} resumed.")
            elif action == "terminate":
                await asyncio.to_thread(proc.terminate)
                logger.warning(f"Process {pid} terminated by Guardian.")
            return True
        except Exception as e:
            logger.error(f"Failed to quarantine process {pid}: {e}")
            return False

    async def get_network_connections(self) -> List[Dict[str, Any]]:
        """Retrieve active network connections for Deep Scan analysis"""
        connections = []
        try:
            def scan_net():
                res = []
                for conn in psutil.net_connections(kind='inet'):
                    if conn.status == 'ESTABLISHED':
                        try:
                            proc = psutil.Process(conn.pid) if conn.pid else None
                            proc_name = proc.name() if proc else "Unknown"
                        except (psutil.NoSuchProcess, psutil.AccessDenied):
                            proc_name = "System/Protected"
                            
                        res.append({
                            "pid": conn.pid,
                            "process": proc_name,
                            "local_addr": f"{conn.laddr.ip}:{conn.laddr.port}",
                            "remote_addr": f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else "N/A",
                            "status": conn.status
                        })
                return res

            connections = await asyncio.to_thread(scan_net)
            return connections
        except Exception as e:
            logger.error(f"Error in Network Deep Scan: {e}")
            return []

# Singleton instance
system_module = SystemModule()
