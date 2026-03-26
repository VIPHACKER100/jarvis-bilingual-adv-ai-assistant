from fastapi import APIRouter, HTTPException, Query, Body
from typing import Dict, Any, Optional, List
from modules.media import media_processor

router = APIRouter(prefix="/api/pdf", tags=["PDF Tools"])

@router.post("/merge")
async def merge_pdfs(files: List[str], output: str, language: str = "en"):
    """Merge multiple PDF files"""
    # Assuming media_processor has merge_pdfs method or we delegate
    # Let's check media_processor capabilities later, but for now we define the API
    return await media_processor.merge_pdfs(files, output, language)

@router.post("/split")
async def split_pdf(pdf_path: str, pages: List[int], output: str, language: str = "en"):
    """Split specific PDF pages"""
    return await media_processor.split_pdf(pdf_path, pages, output, language)

@router.post("/to-images")
async def pdf_to_images(pdf_path: str, output_folder: str, dpi: int = 200, language: str = "en"):
    """Convert PDF pages to images"""
    return await media_processor.pdf_to_images(pdf_path, output_folder, dpi, language)

@router.post("/from-images")
async def images_to_pdf(images: List[str], output: str, language: str = "en"):
    """Create PDF from image list"""
    return await media_processor.images_to_pdf(images, output, language)
