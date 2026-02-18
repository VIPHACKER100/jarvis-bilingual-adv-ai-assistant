# JARVIS API Documentation

Complete API reference for JARVIS Backend.

---

## Base URL

```
http://localhost:8000
```

## WebSocket URL

```
ws://localhost:8000/ws
```

---

## Authentication

Currently, JARVIS runs locally without authentication. Future versions will include API keys.

---

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

**Response:**

```json
{
  "status": "online",
  "name": "JARVIS Backend",
  "version": "2.1.0",
  "platform": "windows",
  "timestamp": "2024-01-01T12:00:00"
}
```

### Web Search (New in v2.1)

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
  "platform": "Windows"
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
    "response": "Shutting down the system."
  }
}
```

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
|-------------|-------------|
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
