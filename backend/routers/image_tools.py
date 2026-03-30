from fastapi import APIRouter, HTTPException, Query, Body
from typing import Dict, Any, Optional, List
from modules.media import media_processor
from models import (
    BaseResponse, ImageConvertRequest, 
    ImageResizeRequest, ImageCompressRequest
)

router = APIRouter(prefix="/api/image", tags=["Image Tools"])

@router.post("/convert", response_model=BaseResponse)
async def convert_image(data: ImageConvertRequest):
    """Convert image format"""
    output_path = data.output_path or data.image_path.rsplit('.', 1)[0] + f".{data.target_format.lower()}"
    return await media_processor.convert_image(data.image_path, output_path, data.target_format, data.language)

@router.post("/resize", response_model=BaseResponse)
async def resize_image(data: ImageResizeRequest):
    """Resize image"""
    output_path = data.output_path or data.image_path
    return await media_processor.resize_image(data.image_path, output_path, data.width, data.height, data.language)

@router.post("/compress", response_model=BaseResponse)
async def compress_image(data: ImageCompressRequest):
    """Compress image file size"""
    return await media_processor.compress_image(data.image_path, data.output_path, data.quality, data.language)
