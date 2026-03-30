from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Union
from datetime import datetime

# --- Base Responses ---

class BaseResponse(BaseModel):
    success: bool = True
    response: str = ""
    error: Optional[str] = None
    response_time: Optional[float] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

# --- Command Models ---

class CommandRequest(BaseModel):
    command: str
    language: Optional[str] = "en"
    session_id: Optional[str] = None

class CommandResult(BaseResponse):
    action_type: str = "UNKNOWN"
    command_key: str = "unknown"
    language: str = "en"
    macro_name: Optional[str] = None
    requires_confirmation: bool = False
    confirmation_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    data: Optional[Dict[str, Any]] = None

class ConfirmationRequest(BaseModel):
    approved: bool
    details: Optional[Dict[str, Any]] = None

# --- System Status Models ---

class BatteryInfo(BaseModel):
    percent: Optional[int] = None
    is_charging: Optional[bool] = None
    secs_left: Optional[int] = None

class CPUInfo(BaseModel):
    percent: float
    count: int

class MemoryInfo(BaseModel):
    total: int
    used: int
    percent: float
    available: int

class DiskInfo(BaseModel):
    total: int
    used: int
    free: int
    percent: float

class NetworkIOInfo(BaseModel):
    bytes_sent: int
    bytes_recv: int
    packets_sent: int
    packets_recv: int

class SystemStatusResponse(BaseResponse):
    battery: BatteryInfo
    cpu: CPUInfo
    memory: MemoryInfo
    disk: DiskInfo
    network: NetworkIOInfo
    uptime: float
    volume: int
    platform: str

class BatteryResponse(BaseResponse):
    percent: Optional[int] = None
    is_charging: Optional[bool] = None

class TimeResponse(BaseResponse):
    time: str
    formatted: str

class DateResponse(BaseResponse):
    date: str
    formatted: str

class VolumeResponse(BaseResponse):
    volume: int

class UptimeResponse(BaseResponse):
    uptime_seconds: float
    formatted: str

class NetworkInfoResponse(BaseResponse):
    hostname: str
    ip: str
    interfaces: List[Dict[str, str]]

# --- Window & App Models ---

class WindowInfo(BaseModel):
    title: str
    pid: int
    is_minimized: bool = False
    is_maximized: bool = False
    position: Optional[List[int]] = None
    size: Optional[List[int]] = None

class WindowListResponse(BaseResponse):
    windows: List[WindowInfo]
    count: int

class AppListResponse(BaseResponse):
    apps: List[str]
    count: int

# --- File Models ---

class FileInfo(BaseModel):
    name: str
    path: str
    size: int
    size_human: str
    created: str
    modified: str
    is_file: bool
    is_dir: bool

class FileInfoResponse(BaseResponse):
    info: FileInfo

class FileListResponse(BaseResponse):
    folder: str
    items: List[FileInfo]
    total_count: int

# --- Memory Models ---

class ConversationEntryRequest(BaseModel):
    user_input: str
    jarvis_response: str
    command_type: str
    success: bool = True
    language: str = "en"
    session_id: str = "default"

class ConversationEntryModel(BaseModel):
    id: Optional[int] = None
    user_input: str
    jarvis_response: str
    command_type: str
    success: bool
    language: str
    session_id: str
    timestamp: str

class ConversationListResponse(BaseResponse):
    conversations: List[ConversationEntryModel]
    count: int

class FactRequest(BaseModel):
    key: str
    value: str
    category: str = "general"
    source: str = "manual"

class FactModel(BaseModel):
    id: Optional[int] = None
    key: str
    value: str
    category: str
    source: str
    timestamp: str

class FactListResponse(BaseResponse):
    facts: List[FactModel]
    count: int

class StatsResponse(BaseResponse):
    stats: Dict[str, Any]

# --- Input Models ---

class CursorPositionResponse(BaseResponse):
    position: Dict[str, int]
    screen: Dict[str, int]

class ShortcutRequest(BaseModel):
    keys: List[str]

# --- Media/OCR Models ---

class OCRResultResponse(BaseResponse):
    text: Optional[str] = None
    confidence: float = 0.0
    detected_language: Optional[str] = None
    extraction_type: str = "OCR"

# --- PDF/Image Tool Models ---

class PDFMergeRequest(BaseModel):
    files: List[str]
    output: str
    language: str = "en"

class PDFSplitRequest(BaseModel):
    pdf_path: str
    pages: List[int]
    output: str
    language: str = "en"

class PDFToImageRequest(BaseModel):
    pdf_path: str
    output_folder: str
    dpi: int = 200
    language: str = "en"

class ImageToPDFRequest(BaseModel):
    images: List[str]
    output: str
    language: str = "en"

class ImageResizeRequest(BaseModel):
    image_path: str
    width: int
    height: int
    output_path: Optional[str] = None
    language: str = "en"

class ImageConvertRequest(BaseModel):
    image_path: str
    target_format: str
    output_path: Optional[str] = None
    language: str = "en"

class ImageCompressRequest(BaseModel):
    image_path: str
    output_path: str
    quality: int = 85
    language: str = "en"

# --- Automation Models ---

class AutomationTaskRequest(BaseModel):
    name: str
    command: str
    schedule_type: str  # e.g., "interval", "cron", "once"
    interval_seconds: Optional[int] = None
    cron_expression: Optional[str] = None
    enabled: bool = True

class MacroRequest(BaseModel):
    name: str
    commands: List[str]
    trigger_phrase: Optional[str] = None
    description: Optional[str] = ""

# --- Settings Models ---

class SettingsResponse(BaseModel):
    AI_ENGINE: str
    NVIDIA_MODEL: str
    OPENROUTER_MODEL: str
    PORT: int
    LOG_LEVEL: str
    DANGEROUS_COMMANDS_ENABLED: bool
    CONFIRMATION_TIMEOUT: int
    WAKE_WORD_ENABLED: bool
    WAKE_WORD_PHRASE: str

class ApiKeyStatusResponse(BaseModel):
    NVIDIA_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    BACKEND_API_KEY: Optional[str] = None

class SettingsUpdateRequest(BaseModel):
    llm_provider: Optional[str] = None
    enable_dangerous_commands: Optional[bool] = None
    confirmation_timeout: Optional[int] = None
    wake_word_enabled: Optional[bool] = None
    wake_word_phrase: Optional[str] = None

class ApiKeyUpdateRequest(BaseModel):
    nvidia_api_key: Optional[str] = None
    openrouter_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    backend_api_key: Optional[str] = None

class KeyTestRequest(BaseModel):
    provider: str
    api_key: str

# --- WhatsApp Models ---

class WhatsAppMessageRequest(BaseModel):
    contact: str
    message: str
    language: str = "en"

class WhatsAppCallRequest(BaseModel):
    contact: str
    video: bool = False
    language: str = "en"

class WhatsAppContactListResponse(BaseResponse):
    contacts: List[Dict[str, str]]
    count: int

# --- Notification Models ---

class NotificationRequest(BaseModel):
    title: str
    message: str
    type: str = "info"  # "info", "success", "warning", "error"
    duration: int = 5000

class NotificationResponse(BaseResponse):
    clients_notified: int

# --- Desktop/UI Models ---

class ClipboardResponse(BaseResponse):
    text: Optional[str] = None

class ScreenshotResponse(BaseResponse):
    path: Optional[str] = None
    saved: bool = True

# --- WebSocket Models ---

class WebSocketMessage(BaseModel):
    type: str  # "command", "ping", "get_status"
    command: Optional[str] = None
    language: Optional[str] = "en"
    params: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None

class WebSocketResponse(BaseModel):
    type: str  # "command_result", "system_status", "notification", "pong", "error"
    data: Optional[Any] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
