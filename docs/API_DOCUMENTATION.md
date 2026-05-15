# JARVIS API Documentation (v3.8.0)

Complete API reference for JARVIS Backend.

---

## Base URL

```bash
http://localhost:8000
```

```bash
ws://localhost:8000/ws
```

---

## API Versioning

As of v3.7.1, JARVIS has transitioned to a modular router-based system. All endpoints are now available under the `/api/v1` prefix.

- **V1 Prefix**: `http://localhost:8000/api/v1`
- **Legacy Support**: Root-level endpoints (e.g., `http://localhost:8000/api/command`) are maintained for backward compatibility.

---

## Large Language Model (LLM)

JARVIS supports multiple LLM providers for conversational intelligence.

### Configuration

Update `backend/config.py` or `.env` to switch providers:

- `LLM_PROVIDER`: `nvidia` (default) or `openrouter`.
- `NVIDIA_MODEL`: Model ID for NVIDIA (e.g., `qwen/qwen2.5-7b-instruct`).
- `OPENROUTER_MODEL`: Model ID for OpenRouter.

### Failover Mechanism

If the primary provider fails, JARVIS automatically attempts to use the secondary provider to maintain functionality. For example, if NVIDIA returns a 401 or 500 error, JARVIS will automatically try the configured OpenRouter model.

---

## Authentication

## Response Format

All responses follow this structure:

```json
{
  "success": true/false,
  "action_type": "COMMAND_NAME",
  "response": "Human-readable message",
  "data": {},
  "error": "Error message (if success=false)"
}
```

---

## System Endpoints

### Health Check

```http
GET /
```

```http
```http
POST /api/command
{
  "command": "search for Jarvis Lab",
  "language": "en"
}
```

**Result:** Opens default browser with Google Search for "Jarvis Lab".

### System Status

```http
GET /api/system/status
```

**Response:**

```json
{
  "success": true,
  "battery": {
    "percent": 85,
    "is_charging": true,
    "secs_left": null
  },
  "cpu": {
    "percent": 25.5,
    "count": 8
  },
  "memory": {
    "total": 17179869184,
    "used": 8589934592,
    "percent": 50.0,
    "available": 8589934592
  },
  "disk": {
    "total": 512000000000,
    "used": 256000000000,
    "free": 256000000000,
    "percent": 50.0
  },
  "network": {
    "bytes_sent": 1234567,
    "bytes_recv": 7654321,
    "packets_sent": 1234,
    "packets_recv": 5678
  },
  "uptime": 86400,
  "volume": 75,
  "platform": "Windows",
  "event_loop_lag": 1.5,
  "personality": {
    "name": "stark",
    "theme": "ironman-gold"
  }
}
```

---

### Command Insights (Behavioral Analytics)

```http
GET /api/system/command-insights?days=30
```

**Response:**

```json
{
  "success": true,
  "data": {
    "top_commands": [
      {"command_type": "open_app", "count": 45},
      {"command_type": "google_search", "count": 20}
    ],
    "daily_activity": [
      {"day": "2024-05-01", "count": 12},
      {"day": "2024-05-02", "count": 15}
    ],
    "peak_hour": {"hour": 14, "count": 25},
    "failure_patterns": [
      {"command_type": "whatsapp_send", "failures": 2, "total": 10}
    ],
    "period_days": 30
  }
}
```

---

## Command Execution

### Execute Command

```http
POST /api/command
Content-Type: application/json
```

**Request Body:**

```json
{
  "command": "open chrome",
  "language": "en"
}
```

**Response:**

```json
{
  "success": true,
  "action_type": "OPEN_APP",
  "command_key": "open_app",
  "language": "en",
  "response": "Opening chrome.",
  "data": {
    "app_name": "chrome",
    "executable": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

### Confirm Dangerous Command

```http
POST /api/confirm/{confirmation_id}
Content-Type: application/json
```

**Request Body:**

```json
{
  "approved": true
}
```

**Response:**

```json
{
  "success": true,
  "approved": true,
  "result": {
    "success": true,
    "action_type": "SHUTDOWN",
    "response": "Shutting down the system.",
    "macro_name": "Emergency Shutdown Sequence"
  }
}
```

> [!NOTE]
> Response may include `macro_name` if the command was part of an automation sequence.

---

## Window Management

### List Windows

```http
GET /api/windows/list
```

**Response:**

```json
{
  "success": true,
  "action_type": "LIST_WINDOWS",
  "windows": [
    {
      "title": "Google Chrome",
      "pid": 1234,
      "is_minimized": false,
      "is_maximized": false,
      "position": [100, 100],
      "size": [1200, 800]
    }
  ],
  "count": 5
}
```

### List Running Apps

```http
GET /api/apps/list
```

### Open Application

```http
POST /api/apps/open
Content-Type: application/json

{
  "app_name": "notepad",
  "language": "en"
}
```

### Close Application

```http
POST /api/apps/close
Content-Type: application/json

{
  "app_name": "notepad",
  "language": "en",
  "confirmed": false
}
```

---

## Input Control

### Get Cursor Position

```http
GET /api/input/cursor
```

**Response:**

```json
{
  "success": true,
  "action_type": "GET_CURSOR",
  "position": {"x": 500, "y": 300},
  "screen": {"width": 1920, "height": 1080}
}
```

### Move Cursor

```http
POST /api/input/move
Content-Type: application/json

{
  "x": 500,
  "y": 300
}
```

### Click Mouse

```http
POST /api/input/click
Content-Type: application/json

{
  "button": "left"
}
```

**Buttons:** `left`, `right`, `middle`

### Type Text

```http
POST /api/input/type
Content-Type: application/json

{
  "text": "Hello World"
}
```

---

## File Manager

### Open Folder

```http
POST /api/files/open
Content-Type: application/json

{
  "folder": "downloads",
  "language": "en"
}
```

### List Files

```http
GET /api/files/list?folder=downloads&pattern=*.pdf
```

**Response:**

```json
{
  "success": true,
  "action_type": "LIST_FILES",
  "folder": "/home/user/Downloads",
  "items": [
    {
      "name": "document.pdf",
      "path": "/home/user/Downloads/document.pdf",
      "size": 1024000,
      "modified": "2024-01-01T12:00:00",
      "is_file": true,
      "is_dir": false
    }
  ],
  "total_count": 1
}
```

### Search Files

```http
POST /api/files/search
Content-Type: application/json

{
  "search": "report",
  "folder": "documents",
  "language": "en"
}
```

### Create Folder

```http
POST /api/files/create
Content-Type: application/json

{
  "name": "NewFolder",
  "parent": "documents",
  "language": "en"
}
```

### Delete File

```http
POST /api/files/delete
Content-Type: application/json

{
  "path": "/home/user/file.txt",
  "language": "en",
  "confirmed": false
}
```

### Copy File

```http
POST /api/files/copy
Content-Type: application/json

{
  "source": "/home/user/file.txt",
  "destination": "/home/user/backup/",
  "language": "en"
}
```

### Move File

```http
POST /api/files/move
Content-Type: application/json

{
  "source": "/home/user/file.txt",
  "destination": "/home/user/archive/",
  "language": "en"
}
```

### Rename File

```http
POST /api/files/rename
Content-Type: application/json

{
  "old_path": "/home/user/oldname.txt",
  "new_name": "newname.txt",
  "language": "en"
}
```

### Get File Info

```http
GET /api/files/info?path=/home/user/file.txt&language=en
```

**Response:**

```json
{
  "success": true,
  "action_type": "FILE_INFO",
  "info": {
    "name": "file.txt",
    "path": "/home/user/file.txt",
    "size": 1024,
    "size_human": "1.0 KB",
    "created": "2024-01-01T10:00:00",
    "modified": "2024-01-01T12:00:00",
    "accessed": "2024-01-01T12:00:00",
    "is_file": true,
    "is_dir": false,
    "extension": ".txt"
  }
}
```

---

## Media Processing (OCR)

### OCR Image

```http
POST /api/media/ocr/image
Content-Type: application/json

{
  "image_path": "/home/user/image.png",
  "language": "en"
}
```

**Response:**

```json
{
  "success": true,
  "action_type": "OCR_IMAGE",
  "file": "/home/user/image.png",
  "text": "Extracted text content...",
  "text_preview": "Extracted text...",
  "response": "Extracted 245 characters from image"
}
```

### OCR PDF

```http
POST /api/media/ocr/pdf
Content-Type: application/json

{
  "pdf_path": "/home/user/document.pdf",
  "page_number": 1,
  "language": "en"
}
```

### OCR Screenshot

```http
POST /api/media/ocr/screen?language=en
```

---

## PDF Tools

### Merge PDFs

```http
POST /api/pdf/merge
Content-Type: application/json

{
  "files": [
    "/home/user/page1.pdf",
    "/home/user/page2.pdf"
  ],
  "output": "/home/user/merged.pdf",
  "language": "en"
}
```

### Split PDF

```http
POST /api/pdf/split
Content-Type: application/json

{
  "pdf_path": "/home/user/document.pdf",
  "pages": [0, 1, 2],
  "output": "/home/user/extracted.pdf",
  "language": "en"
}
```

### PDF to Images

```http
POST /api/pdf/to-images
Content-Type: application/json

{
  "pdf_path": "/home/user/document.pdf",
  "output_folder": "/home/user/images",
  "dpi": 200,
  "language": "en"
}
```

### Images to PDF

```http
POST /api/pdf/from-images
Content-Type: application/json

{
  "images": [
    "/home/user/img1.png",
    "/home/user/img2.png"
  ],
  "output": "/home/user/output.pdf",
  "language": "en"
}
```

---

## Image Processing

### Convert Image

```http
POST /api/image/convert
Content-Type: application/json

{
  "input": "/home/user/image.png",
  "output": "/home/user/image.jpg",
  "format": "JPEG",
  "language": "en"
}
```

### Resize Image

```http
POST /api/image/resize
Content-Type: application/json

{
  "input": "/home/user/image.png",
  "output": "/home/user/resized.png",
  "width": 800,
  "height": 600,
  "maintain_aspect": true,
  "language": "en"
}
```

### Compress Image

```http
POST /api/image/compress
Content-Type: application/json

{
  "input": "/home/user/image.png",
  "output": "/home/user/compressed.jpg",
  "quality": 85,
  "language": "en"
}
```

---

## Desktop Utilities

### Take Screenshot

```http
GET /api/desktop/screenshot?save=true&language=en
```

**Response:**

```json
{
  "success": true,
  "action_type": "SCREENSHOT",
  "image": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "file_path": "/home/user/Pictures/JARVIS_Screenshots/screenshot_20240101_120000.png",
  "size": [1920, 1080],
  "response": "Screenshot captured (1920x1080)"
}
```

### Screenshot Region

```http
POST /api/desktop/screenshot/region
Content-Type: application/json

{
  "x": 100,
  "y": 100,
  "width": 800,
  "height": 600,
  "save": true,
  "language": "en"
}
```

### Get Clipboard Text

```http
GET /api/desktop/clipboard/text?language=en
```

### Set Clipboard Text

```http
POST /api/desktop/clipboard/text
Content-Type: application/json

{
  "text": "Text to copy",
  "language": "en"
}
```

### Clear Clipboard

```http
DELETE /api/desktop/clipboard?language=en
```

---

## Media Controls

### Play/Pause

```http
POST /api/desktop/media/play?language=en
```

### Next Track

```http
POST /api/desktop/media/next?language=en
```

### Previous Track

```http
POST /api/desktop/media/previous?language=en
```

### Stop

```http
POST /api/desktop/media/stop?language=en
```

---

## Memory & Analytics

### Save Conversation

```http
POST /api/memory/conversation
Content-Type: application/json

{
  "user_input": "Hello JARVIS",
  "jarvis_response": "Hello Aryan, how can I help you?",
  "command_type": "conversation",
  "success": true,
  "language": "hi-EN",
  "session_id": "123456"
}
```

### Get Recent Conversations

```http
GET /api/memory/conversations?limit=10
```

### Get Memory Stats (Analytics)

```http
GET /api/memory/stats?days=7
```

**Response:**

```json
{
  "success": true,
  "stats": {
    "total_conversations": 150,
    "successful_commands": 145,
    "success_rate": 96.6,
    "command_types": {
      "open_app": 45,
      "google_search": 20
    },
    "languages": {
      "en": 100,
      "hi-EN": 50
    },
    "period_days": 7
  }
}
```

### Delete All Conversations

```http
DELETE /api/memory/conversations
```

### Save User Fact

```http
POST /api/memory/fact
Content-Type: application/json

{
  "fact": "The user likes coffee",
  "category": "preferences"
}
```

---

## Device Synchronization

### Get Sync Status

```http
GET /api/v1/sync/status
```

**Response:**

```json
{
  "success": true,
  "device_name": "JARVIS-MAIN",
  "paired_devices_count": 1,
  "system_status": { ... },
  "last_updated": "2024-01-01T12:00:00"
}
```

### Pair Device

```http
POST /api/v1/sync/pair
Content-Type: application/json

{
  "device_name": "iPhone 15 Pro",
  "device_type": "mobile",
  "pairing_code": "JARVIS-SYNC"
}
```

**Response:**

```json
{
  "success": true,
  "device_id": "uuid-v4-string",
  "access_token": "secure-token-string",
  "message": "Successfully paired iPhone 15 Pro"
}
```

### List Paired Devices

```http
GET /api/v1/sync/devices
```

### Unpair Device

```http
DELETE /api/v1/sync/devices/{device_id}
```

---

## WebSocket Messages (Server to Client)

### Proactive Suggestion

Broadcasted when the Neural Proactivity Engine detects a helpful action.

```json
{
  "type": "proactive_suggestion",
  "data": {
    "text": "Detected Terminal error. Would you like me to suggest a fix?",
    "timestamp": "2024-01-01T12:00:00"
  }
}
```

### System Status Broadcast

Broadcasted every 5 seconds.

```json
{
  "type": "system_status",
  "data": { ... },
  "timestamp": "2024-01-01T12:00:00"
}
```

```

### Update User Fact

```http
PUT /api/memory/fact/{id}
Content-Type: application/json

{
  "value": "Alphabet Inc."
}
```

### Delete User Fact

```http
DELETE /api/memory/fact/{id}
```

**ID:** The unique integer ID returned in `GET /api/memory/facts`.

### Get User Facts

```http
GET /api/memory/facts?category=job
```

**Response:**

```json
{
  "success": true,
  "facts": [
    {
      "id": 1,
      "key": "boss_name",
      "value": "Aryan Ahirwar",
      "category": "contacts",
      "confidence": 1.0,
      "updated_at": "2024-01-01T12:00:00",
      "source": "manual"
    }
  ]
}
```

---

## Automation & Tasks

### Create Scheduled Task

```http
POST /api/automation/task
Content-Type: application/json

{
  "name": "Nightly Backup",
  "description": "Copy projects to backup drive",
  "command": "search for projects and copy to D:/Backups",
  "schedule_type": "daily",
  "schedule_time": "02:00",
  "days": ["Monday", "Wednesday", "Friday"],
  "condition": "battery > 50"
}
```

**Fields:**

- `schedule_type`: `daily`, `once`, `interval`
- `condition`: (Optional) System state constraint (e.g., `cpu < 30`, `battery > 20`)

### List Tasks

```http
GET /api/automation/tasks
```

### Create Macro

```http
POST /api/automation/macro
Content-Type: application/json

{
  "name": "Dev Mode",
  "description": "Open development environment",
  "commands": [
    "open vscode",
    "open chrome",
    "open terminal"
  ]
}
```

### Run Macro

```http
POST /api/automation/macro/{macro_id}/run
```

## WebSocket Protocol

### Connect

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
```

### Send Command

```javascript
ws.send(JSON.stringify({
  type: "command",
  command: "open chrome",
  language: "en",
  timestamp: Date.now()
}));
```

### Receive Response

```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch(message.type) {
    case "command_response":
      console.log("Response:", message.data);
      break;
    case "system_status":
      console.log("Status update:", message.data);
      break;
    case "confirmation_request":
      console.log("Confirmation needed:", message.data);
      break;
    case "personality_sync":
      console.log("Personality updated:", message.data);
      // Data: { id: "midnight", name: "Midnight", accent: "#5E6AD2" }
      break;
  }
};
```

### Ping/Pong

```javascript
// Send ping
ws.send(JSON.stringify({
  type: "ping",
  timestamp: Date.now()
}));

// Receive pong
// { type: "pong", timestamp: "2024-01-01T12:00:00" }
```

### Get Status

```javascript
ws.send(JSON.stringify({
  type: "get_status",
  timestamp: Date.now()
}));
```

---

## Error Codes

| Status Code | Description |
| ----------- | ----------- |
| 400 | Bad Request - Missing required parameters |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

**Error Response:**

```json
{
  "detail": "Error description"
}
```

---

## Rate Limiting

Currently no rate limiting for local usage. Future versions may implement limits for remote access.

---

## Changelog

### v3.7.0

- **Behavioral Insights Engine**: Added `/api/system/command-insights` to surface usage patterns, failure diagnostics, and peak activity hours.
- **Dynamic Persona Switching**: Added bilingual voice commands for activating Stark, Midnight, Avenue, and Linear personalities.
- **Neural Proactivity Core**: Real-time situational analysis with autonomous task suggestions delivered via WebSockets.
- **Settings API Reform**: Refactored settings response to a nested dictionary structure for better scalability and frontend parsing.

### v3.4.1

- **Async Migration**: Refactored backend to fully non-blocking asynchronous architecture.
- **Performance Observability**: Added `event_loop_lag` telemetry to system status.
- **Conditional Automation**: Added support for `condition` field in automation tasks (e.g., CPU/Battery checks).
- **HUD Performance Feedback**: Visual glitch/vibration effects in UI based on backend health.

### v3.4.0

- Added Neural Memory System (`/api/memory/*`) for conversation tracking and generic facts.
- Added detailed User Analytics (interaction volume, popular commands, language breakdown).
- Advanced Bilingual Intelligence with Hinglish support mapping (`hi-EN`).
- Project rebranding to `aryanahirwar.in`.

### v2.1.1

- Added dynamic volume/brightness control (optional amount parameter)
- Added bilingual application mapping (Hindi app names support)
- Improved localized responses for system commands

### v2.0.0

- Added File Manager endpoints
- Added OCR and Media Processing
- Added Desktop Utilities
- Added WebSocket support
- Bilingual command support

### v1.0.0

- Initial release
- Basic system control
- Window management
- Voice recognition

---

## Support

For issues or questions:

- GitHub Issues: <https://github.com/VIPHACKER100/jarvis-bilingual-adv-ai-assistant/issues>
- Documentation: <https://github.com/VIPHACKER100/jarvis-bilingual-adv-ai-assistant/tree/main/docs>
