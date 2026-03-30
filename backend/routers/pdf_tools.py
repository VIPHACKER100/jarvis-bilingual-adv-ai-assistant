from fastapi import APIRouter, HTTPException, Query, Body
from typing import Dict, Any, Optional, List
from modules.media import media_processor
from models import (
    BaseResponse, PDFMergeRequest, PDFSplitRequest, 
    PDFToImageRequest, ImageToPDFRequest
)

router = APIRouter(prefix="/api/pdf", tags=["PDF Tools"])

@router.post("/merge", response_model=BaseResponse)
async def merge_pdfs(data: PDFMergeRequest):
    """Merge multiple PDF files"""
    return await media_processor.merge_pdfs(data.files, data.output, data.language)

@router.post("/split", response_model=BaseResponse)
async def split_pdf(data: PDFSplitRequest):
    """Split specific PDF pages"""
    return await media_processor.split_pdf(data.pdf_path, data.pages, data.output, data.language)

@router.post("/to-images", response_model=BaseResponse)
async def pdf_to_images(data: PDFToImageRequest):
    """Convert PDF pages to images"""
    return await media_processor.pdf_to_images(data.pdf_path, data.output_folder, data.dpi, data.language)

@router.post("/from-images", response_model=BaseResponse)
async def images_to_pdf(data: ImageToPDFRequest):
    """Create PDF from image list"""
    return await media_processor.images_to_pdf(data.images, data.output, data.language)
