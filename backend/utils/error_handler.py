import functools
import traceback
from typing import Callable, Any, Dict
from fastapi import HTTPException
from utils.logger import logger

def handle_errors(module_name: str = "Unknown"):
    """
    Decorator to handle errors in backend modules consistently.
    Logs the error with traceback and returns a success=False JSON-compatible dict.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            try:
                if asyncio.iscoroutinefunction(func):
                    return await func(*args, **kwargs)
                else:
                    return func(*args, **kwargs)
            except Exception as e:
                error_msg = f"Error in {module_name}.{func.__name__}: {str(e)}"
                logger.error(error_msg)
                logger.error(traceback.format_exc())
                return {
                    "success": False,
                    "error": str(e),
                    "module": module_name,
                    "function": func.__name__
                }
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                error_msg = f"Error in {module_name}.{func.__name__}: {str(e)}"
                logger.error(error_msg)
                logger.error(traceback.format_exc())
                return {
                    "success": False,
                    "error": str(e),
                    "module": module_name,
                    "function": func.__name__
                }
        
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    return decorator

class JarvisException(Exception):
    """Base exception class for JARVIS specific errors"""
    def __init__(self, message: str, code: int = 500, details: Dict[str, Any] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}

def format_exception_response(e: Exception) -> Dict[str, Any]:
    """Formats an exception into a consistent response structure"""
    if isinstance(e, JarvisException):
        return {
            "success": False,
            "error": e.message,
            "code": e.code,
            "details": e.details
        }
    return {
        "success": False,
        "error": str(e),
        "type": type(e).__name__
    }
