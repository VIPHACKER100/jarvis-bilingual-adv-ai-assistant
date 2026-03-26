from fastapi import APIRouter, HTTPException, Query, Body
from typing import Dict, Any, Optional, List
from modules.media import media_processor

router = APIRouter(prefix="/api/image", tags=["Image Tools"])

@router.post("/convert")
async def convert_image(input_path: str, output_path: str, format: str = "PNG", language: str = "en"):
    """Convert image format"""
    return await media_processor.convert_image(input_path, output_path, format, language)

@router.post("/resize")
async def resize_image(input_path: str, output_path: str, width: int, height: int, language: str = "en"):
    """Resize image"""
    return await media_processor.resize_image(input_path, output_path, width, height, language)

@router.post("/compress")
async def compress_image(input_path: str, output_path: str, quality: int = 85, language: str = "en"):
    """Compress image file size"""
    return await media_processor.compress_image(input_path, output_path, quality, language)
