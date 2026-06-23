from fastapi import APIRouter
from models import (
    BaseResponse,
    WhatsAppCallRequest,
    WhatsAppContactListResponse,
    WhatsAppDraftResponse,
    WhatsAppMessageRequest,
)
from modules.whatsapp import whatsapp_manager

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp Automation"])


@router.post("/open", response_model=BaseResponse)
async def open_whatsapp(language: str = "en"):
    """Open WhatsApp Desktop app"""
    return await whatsapp_manager.open_whatsapp(language)


@router.post("/send", response_model=BaseResponse)
async def send_message(data: WhatsAppMessageRequest):
    """Send a text message safely via automation"""
    return await whatsapp_manager.send_message(data.contact, data.message, data.language)


@router.post("/call", response_model=BaseResponse)
async def call_contact(data: WhatsAppCallRequest):
    """Initialize a voice or video call"""
    return await whatsapp_manager.call_contact(data.contact, data.video, data.language)


@router.get("/contacts", response_model=WhatsAppContactListResponse)
async def list_contacts(language: str = "en"):
    """List known contacts or aliases"""
    return await whatsapp_manager.get_known_contacts(language)


@router.get("/status", response_model=BaseResponse)
async def get_whatsapp_status(language: str = "en"):
    """Check WhatsApp Desktop availability"""
    return await whatsapp_manager.get_status(language)


@router.post("/draft_reply", response_model=WhatsAppDraftResponse)
async def draft_whatsapp_reply(language: str = "en"):
    """Draft a reply based on current WhatsApp chat screen using OCR"""
    result = await whatsapp_manager.draft_smart_reply(language)
    result.setdefault("copied_to_clipboard", bool(result.get("draft")))
    return result
