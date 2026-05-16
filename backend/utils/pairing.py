import secrets
import string
import time
from typing import Optional, Dict

class PairingManager:
    """Manages temporary pairing codes for mobile device linking"""
    def __init__(self):
        self.active_codes: Dict[str, float] = {}  # code -> expiry_timestamp
        self.code_length = 6
        self.expiry_duration = 300  # 5 minutes
    
    def generate_code(self) -> str:
        """Generate a new pairing code"""
        # Clear expired codes first
        self.clear_expired()
        
        # Generate 6-digit numeric code
        code = ''.join(secrets.choice(string.digits) for _ in range(self.code_length))
        
        # In case of collision (unlikely), regenerate
        while code in self.active_codes:
            code = ''.join(secrets.choice(string.digits) for _ in range(self.code_length))
            
        self.active_codes[code] = time.time() + self.expiry_duration
        return code
    
    def validate_code(self, code: str) -> bool:
        """Check if a code is valid and not expired"""
        self.clear_expired()
        
        if code in self.active_codes:
            # Code is used once or just valid? 
            # Usually one-time use is better
            del self.active_codes[code]
            return True
        return False
    
    def clear_expired(self):
        """Remove expired codes from the active list"""
        now = time.time()
        expired = [c for c, t in self.active_codes.items() if t < now]
        for c in expired:
            del self.active_codes[c]

# Global instance
pairing_manager = PairingManager()
