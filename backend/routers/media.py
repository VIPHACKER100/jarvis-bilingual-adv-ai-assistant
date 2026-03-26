from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional
from modules.media import media_processor

router = APIRouter(prefix="/api/media", tags=["Media (OCR)"])

@router.post("/ocr/image")
async def ocr_image(image_path: str, language: str = "en"):
    """Extract text from image"""
    return await media_processor.ocr_image(image_path, language)

@router.post("/ocr/pdf")
async def ocr_pdf(pdf_path: str, page_number: int = 0, language: str = "en"):
    """Extract text from PDF page"""
    return await media_processor.ocr_pdf(pdf_path, page_number, language)

@router.post("/ocr/screen")
async def ocr_screen(language: str = "en"):
    """Extract text from current screen (OCR + Screen Analytics)"""
    return await media_processor.ocr_screenshot(language)
