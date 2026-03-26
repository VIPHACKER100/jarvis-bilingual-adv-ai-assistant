from fastapi import APIRouter, HTTPException, Query, Body
from typing import Dict, Any, Optional
from modules.whatsapp import whatsapp_manager

router = APIRouter(prefix="/api/whatsapp", tags=["WhatsApp Automation"])

@router.post("/open")
async def open_whatsapp(language: str = "en"):
    """Open WhatsApp Desktop app"""
    return await whatsapp_manager.open_whatsapp(language)

@router.post("/send")
async def send_message(contact: str, message: str, language: str = "en"):
    """Send a text message safely via automation"""
    return await whatsapp_manager.send_message(contact, message, language)

@router.post("/call")
async def call_contact(contact: str, video: bool = False, language: str = "en"):
    """Initialize a voice or video call"""
    return await whatsapp_manager.call_contact(contact, video, language)

@router.get("/contacts")
async def list_contacts(language: str = "en"):
    """List known contacts or aliases"""
    # Assuming contacts_manager has a method list_contacts()
    return await whatsapp_manager.get_known_contacts(language)

@router.get("/status")
async def get_whatsapp_status(language: str = "en"):
    """Check WhatsApp Desktop availability"""
    return await whatsapp_manager.get_status(language)
