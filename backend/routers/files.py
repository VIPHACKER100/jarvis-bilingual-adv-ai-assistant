from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional, List
from modules.file_manager import file_manager
from models import BaseResponse, FileListResponse, FileInfoResponse

router = APIRouter(prefix="/api/files", tags=["Files"])

@router.post("/open", response_model=BaseResponse)
async def open_folder(folder: str, language: str = "en"):
    """Open folder in explorer"""
    return await file_manager.open_folder(folder, language)

@router.get("/list", response_model=FileListResponse)
async def list_files(folder: str, pattern: str = "*", language: str = "en"):
    """List files in folder"""
    return await file_manager.list_files(folder, pattern, language)

@router.post("/search", response_model=FileListResponse)
async def search_files(search: str, folder: Optional[str] = "root", language: str = "en"):
    """Search for files in folder (recursive)"""
    return await file_manager.search_files(search, folder, language)

@router.post("/create", response_model=BaseResponse)
async def create_folder(name: str, parent: str = "root", language: str = "en"):
    """Create new folder"""
    return await file_manager.create_folder(name, parent, language)

@router.post("/delete", response_model=BaseResponse)
async def delete_file(path: str, confirmed: bool = False, language: str = "en"):
    """Delete file or folder (safe trash)"""
    return await file_manager.delete_file(path, language, confirmed)

@router.post("/copy", response_model=BaseResponse)
async def copy_file(source: str, destination: str, language: str = "en"):
    """Copy file"""
    return await file_manager.copy_file(source, destination, language)

@router.post("/move", response_model=BaseResponse)
async def move_file(source: str, destination: str, language: str = "en"):
    """Move file"""
    return await file_manager.move_file(source, destination, language)

@router.post("/rename", response_model=BaseResponse)
async def rename_file(old_path: str, new_name: str, language: str = "en"):
    """Rename file"""
    return await file_manager.rename_file(old_path, new_name, language)

@router.get("/info", response_model=FileInfoResponse)
async def get_file_info(path: str, language: str = "en"):
    """Get file or folder metadata"""
    return await file_manager.get_file_info(path, language)
