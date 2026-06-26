# Backend Requirements Document (BRD)

## 1. Introduction
This document outlines the backend architectural requirements, API specifications, and real-time communication protocols required to support the **JARVIS Core v4** neural interface application. The frontend is built as a highly responsive single-page React application, requiring a robust, real-time backend to facilitate its device management, remote control, security oversight, automation, and AI features.

## 2. System Architecture Overview
The backend must be built as a high-performance, low-latency service capable of handling real-time telemetry, remote desktop streaming, AI processing, and secure host control.

### 2.1 Core Technologies
- **Runtime Environment:** Node.js / Go / Rust (Low-latency preferred)
- **Real-time Protocol:** WebSockets (Socket.io or native WS) with binary payload support for media streaming.
- **Database:** 
  - PostgreSQL: For structured relational data (logs, settings, users).
  - Redis: For high-speed state caching and message brokering.
  - Vector DB (e.g., Milvus, Pinecone, or pgvector): For RAG and knowledge base embeddings.
- **AI Processing:** Integration with external LLM/TTS services (e.g., OpenAI, Google Cloud AI) or local GPU-accelerated models (Ollama, Whisper, local PyTorch models).

---

## 3. Core Modules & Feature Requirements

### 3.1 Neural HUD (Dashboard)
- **Telemetry Processing:** High-frequency gathering of CPU usage, Memory allocation, Network throughput (up/down).
- **Environment Controls:** APIs to read thermal sensors and adjust system cooling/power modes.
- **Task Management:** Real-time tracking of active background processes and system tasks.

### 3.2 Security Architecture (Security Dashboard)
- **Threat Detection (IDS/IPS):** Monitor incoming network connections and flag anomalies or known malicious IPs.
- **Firewall Integration:** Read and modify host OS firewall rules (e.g., iptables, Windows Firewall).
- **Quarantine/Lockdown:** Emergency procedure to sever external network connections while maintaining the control websocket.

### 3.3 Audit & Logging (Audit Timeline)
- **Immutable Ledger:** Store comprehensive system events (logins, file modifications, executed commands).
- **Log Aggregation:** Pull logs from host OS (syslog, Event Viewer) into a central queried database.

### 3.4 Device Management (Device Sync Hub)
- **Node Tracking:** Maintain active heartbeat connections with paired devices (phones, secondary servers, IoT devices).
- **Sync Protocol:** Manage state synchronization between the primary core and satellite devices.

### 3.5 Automation Engine (Automation Dashboard)
- **Task Scheduler:** Cron-like execution of scripts and routines.
- **Macro Runner:** Execute pre-defined complex sequences of OS-level actions.
- **Workflow State:** Track the success/failure of automated multi-step pipelines.

### 3.6 File System (File Manager)
- **Directory Browsing:** Secure, sandboxed read access to specific host directories.
- **File Operations:** Move, copy, rename, delete files.
- **Execution Engine:** Ability to spawn child processes to execute specific scripts (.sh, .bat, .exe) securely.
- **Transfer Handling:** Robust multipart upload and streaming download support.

### 3.7 Process & Window Manager
- **OS Window Tracking:** Interrogate the OS window manager (X11/Wayland/DWM) to list visible windows.
- **Window Control:** Minimize, maximize, focus, or forcefully close specific GUI windows.
- **Process Tree:** Monitor running PIDs, memory consumption per process, and provide termination (kill) signals.

### 3.8 Communication Bridge (WhatsApp Control)
- **Headless Client Integration:** Utilize libraries (e.g., puppeteer or whatsapp-web.js) to bridge WhatsApp into the interface.
- **State Management:** Track connection status, unread counts, and active channels.
- **Message Dispatch:** Handle text, image, and document transmission through the bridged protocol.

### 3.9 Remote Access (Desktop & Input Simulator)
- **Screen Capture:** Capture framebuffers and encode to WebRTC streams or high-framerate JPEG sequences.
- **Clipboard Sync:** Bidirectional synchronization between host and client clipboards.
- **Virtual Input Hooks:** Inject simulated keyboard and mouse events (clicks, movement, drag, key combos) at the OS level using native hooks.
- **Media Control:** Interface with OS media services (MPRIS, Windows Media Transport) for play/pause/volume control.

### 3.10 AI & Media Tools
- **Vision OCR:** Accept images, process via OCR engines (Tesseract or Vision APIs), and return structured text.
- **Audio Transcription:** Accept audio files, run through STT models (e.g., Whisper), and return transcripts.
- **Asset Generation:** Proxy prompts to Stable Diffusion or DALL-E endpoints to return generated images.

### 3.11 Neural Training (Personalization)
- **Voice Synthesis (TTS):** Integrate with advanced TTS APIs (e.g., ElevenLabs) or local models to convert text to speech using cloned voices.
- **Knowledge Base (RAG):** Accept document uploads (PDF, TXT, MD), chunk text, generate vector embeddings, and store in the Vector DB for contextual LLM retrieval.

---

## 4. Real-Time Communication (WebSocket API)

### 4.1 Telemetry Stream (`/ws/telemetry`)
- **Direction:** Server -> Client
- **Frequency:** High (1-5 Hz)
- **Events:** `sys:metrics`, `net:status`, `thermal:update`

### 4.2 Remote Control Protocol (`/ws/control`)
- **Direction:** Bidirectional
- **Events:**
  - `input:mouse_move`, `input:mouse_click`
  - `input:keyboard`, `input:macro`
  - `desktop:stream_request`, `desktop:stream_frame`
  - `media:control`

### 4.3 App State & Notifications (`/ws/app`)
- **Events:**
  - `sec:alert` (Security threats)
  - `automation:step_complete`
  - `msg:incoming` (WhatsApp bridge)

---

## 5. RESTful API Endpoints

### 5.1 System & Security
- `GET /api/v1/system/status` - Health, uptime, active nodes.
- `GET /api/v1/security/threats` - Active alerts and IDS logs.
- `POST /api/v1/security/lockdown` - Trigger network quarantine.

### 5.2 File & Process Management
- `GET /api/v1/files/list?path={path}` - List directory contents.
- `POST /api/v1/files/execute` - Run file/script.
- `PUT /api/v1/files/upload` - Multipart upload.
- `GET /api/v1/files/download?path={path}` - Stream file download.
- `GET /api/v1/processes` - List OS processes.
- `POST /api/v1/processes/{pid}/kill` - Terminate process.
- `GET /api/v1/windows` - List GUI windows.

### 5.3 Communication & Media
- `GET /api/v1/messaging/sessions` - WhatsApp bridge status.
- `POST /api/v1/messaging/send` - Dispatch message.
- `POST /api/v1/neural/ocr` - Submit image for text extraction.
- `POST /api/v1/neural/transcribe` - Submit audio for transcription.
- `POST /api/v1/neural/generate-image` - Submit prompt for generation.

### 5.4 Neural Training
- `POST /api/v1/neural/voice/train` - Upload audio samples for cloning.
- `POST /api/v1/neural/knowledge/ingest` - Upload documents for RAG vectorization.
- `GET /api/v1/neural/knowledge/status` - Indexing progress.

---

## 6. Authentication & Security
- **Access Control:** All REST endpoints and WebSocket connections MUST require strict authentication.
- **Method:** JWT (JSON Web Tokens) for client sessions, or Mutual TLS (mTLS) for secure node-to-node backend communication.
- **Network Architecture:** The backend should ideally run behind a reverse proxy (Nginx) and a secure VPN overlay (e.g., Tailscale, ZeroTier) to prevent unauthorized external access.
