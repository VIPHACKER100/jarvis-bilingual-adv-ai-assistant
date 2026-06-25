# JARVIS Technical Stack & Build System

## Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript 5.9
- **Build Tool**: Vite 8.x for fast development and builds
- **Styling**: Tailwind CSS 4.x with custom glassmorphism design system
- **State Management**: Zustand for lightweight global state
- **UI Components**: Framer Motion for animations, Lucide React for icons
- **Data Fetching**: TanStack React Query for API state management
- **Routing**: React Router DOM 7.x

### Backend
- **Framework**: FastAPI (Python 3.13) with async/await architecture
- **Server**: Uvicorn with WebSocket support
- **Database**: PostgreSQL 16 with pgvector extension for semantic search
- **Cache**: Redis 7 for session management and caching
- **ORM**: SQLAlchemy 2.0+ with Alembic for migrations
- **Authentication**: API key-based with HMAC constant-time comparison

### Infrastructure
- **Containerization**: Docker Compose with multi-service setup
- **Observability**: OpenTelemetry with Jaeger tracing
- **Logging**: Structlog for structured JSON logging
- **Build**: PyInstaller for Windows executable generation
- **CI/CD**: GitHub Actions with CodeQL security scanning

## Common Commands

### Development Setup
```bash
# Start infrastructure services
docker compose up -d postgres redis

# Frontend development
npm install
npm run dev                 # Start dev server on :5173
npm run build              # Production build
npm run typecheck          # TypeScript validation
npm run lint               # ESLint checking
npm run format             # Prettier formatting

# Backend development
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
alembic upgrade head       # Apply DB migrations
python main.py             # Start server on :8000
```

### Testing
```bash
# Frontend tests
npm run test               # Run Vitest tests
npm run test:watch         # Watch mode

# Backend tests
cd backend
pytest                     # Run all Python tests
pytest tests/test_modules.py  # Specific test file
```

### Quality Checks
```bash
# Frontend quality pipeline
npm run check              # Typecheck + lint + format + build

# Backend quality
cd backend
pip install -r requirements.txt --force-reinstall
python test_modules.py     # Module functionality tests
```

### Production Build
```bash
# Create Windows executable
python scripts/build.py    # Generates JARVIS_v{VERSION}.zip in dist/
```

## Build System Notes

- **Vite Configuration**: Uses `@vitejs/plugin-react` with hot reload
- **TypeScript**: Strict mode enabled with zero `any` types policy
- **ESLint**: Extended with Prettier integration and React hooks rules
- **PyInstaller**: Configured for cross-platform executable generation
- **Docker**: Multi-stage builds with health checks and resource limits
- **Database**: Alembic handles schema migrations with pgvector setup

## Development Workflow

1. Start PostgreSQL + Redis containers
2. Run backend (`python main.py`) on port 8000
3. Run frontend (`npm run dev`) on port 5173
4. Use browser for Web Speech API (Chrome/Edge recommended)
5. Test via WebSocket connection or REST API endpoints under `/api/v1/`

## Key Dependencies

- **Voice**: Web Speech API (browser-native), `openwakeword` for offline detection
- **System Integration**: `pyautogui`, `psutil`, `pywin32` (Windows-specific)
- **AI/ML**: `openai`, `google-generativeai` for LLM integration
- **Image/PDF**: `Pillow`, `pytesseract`, `PyPDF2`, `pdf2image`
- **Network**: `zeroconf` for mDNS discovery, `websockets` for real-time communication