import socket
from zeroconf import IPVersion, ServiceInfo, Zeroconf
from utils.logger import logger
import os

class mDNSBroadcaster:
    """
    Broadcasts the JARVIS service on the local network using mDNS (ZeroConf).
    Allows mobile apps to discover the server automatically.
    """
    def __init__(self, port: int = 8000, service_name: str = "JARVIS-CORE"):
        self.port = port
        self.service_name = service_name
        self.zeroconf = None
        self.service_info = None

    def start(self):
        """Start the mDNS broadcast"""
        try:
            # Get local IP address
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            try:
                # Doesn't even have to be reachable
                s.connect(('8.8.8.8', 1))
                ip_address = s.getsockname()[0]
            except Exception:
                ip_address = '127.0.0.1'
            finally:
                s.close()

            desc = {'version': '3.9.0', 'platform': os.name}
            
            self.service_info = ServiceInfo(
                "_jarvis._tcp.local.",
                f"{self.service_name}._jarvis._tcp.local.",
                addresses=[socket.inet_aton(ip_address)],
                port=self.port,
                properties=desc,
                server=f"{self.service_name.lower()}.local.",
            )

            self.zeroconf = Zeroconf(ip_version=IPVersion.V4Only)
            self.zeroconf.register_service(self.service_info)
            
            logger.info(f"mDNS Broadcaster started: {self.service_name} at {ip_address}:{self.port}")
        except Exception as e:
            logger.error(f"Failed to start mDNS Broadcaster: {e}")

    def stop(self):
        """Stop the mDNS broadcast"""
        if self.zeroconf:
            try:
                self.zeroconf.unregister_service(self.service_info)
                self.zeroconf.close()
                logger.info("mDNS Broadcaster stopped.")
            except Exception as e:
                logger.error(f"Error stopping mDNS Broadcaster: {e}")

mdns_broadcaster = mDNSBroadcaster()
