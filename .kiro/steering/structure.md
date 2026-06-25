# JARVIS Project Structure & Organization

## Root Directory Layout

```
jarvis-bilingual-adv-ai-assistant/
├── src/                    # Frontend React application
├── backend/                # Python FastAPI backend
├── docs/                   # Documentation and guides
├── scripts/                # Build and utility scripts
├── memory/                 # Agent memory and traces
├── mobile/                 # Mobile companion app
├── docker-compose.yml      # Infrastructure services
├── package.json           # Frontend dependencies and scripts
└── README.md              # Main project documentation
```

## Frontend Structure (`src/`)

```
src/
├── components/            # React UI components
│   ├── ArcReactor.tsx    # Central control interface
│   ├── SystemDiagnostics.tsx  # HUD and monitoring
│   └── HistoryLog.tsx    # Command history display
├── services/             # API clients and external services
├── hooks/                # Custom React hooks
├── context/              # React context providers
├── store/                # Zustand state management
├── types/                # TypeScript type definitions
├── utils/                # Utility functions and helpers
├── styles/               # CSS and design system
├── tests/                # Frontend test files
├── App.tsx               # Main application component
├── main.tsx              # React entry point
└── config.ts             # Application configuration
```

## Backend Structure (`backend/`)

```
backend/
├── routers/              # FastAPI route modules
│   ├── agent.py         # AI agent endpoints (/api/v1/agent/*)
│   ├── system.py        # System control endpoints
│   ├── commands.py      # Voice command processing
│   ├── files.py         # File operations
│   ├── websocket.py     # WebSocket connections
│   └── ...              # 20+ specialized routers
├── modules/              # Core functionality modules
│   ├── system.py        # System monitoring and control
│   ├── automation.py    # Desktop automation
│   ├── memory.py        # Agent memory management
│   ├── proactive.py     # Proactive suggestions engine
│   └── wake_word.py     # Voice activation
├── handlers/             # Command processing logic
├── config/               # Configuration and constants
├── utils/                # Utility functions and helpers
├── migrations/           # Alembic database migrations
├── tests/                # Backend test suite
├── main.py               # FastAPI application entry point
├── models.py             # Database models (SQLAlchemy)
└── requirements.txt      # Python dependencies
```

## Key Architectural Patterns

### Modular Router System
- Each router handles a specific domain (system, files, media, etc.)
- All API routes prefixed with `/api/v1/` for versioning
- WebSocket endpoints for real-time communication
- Consistent error handling and response formatting

### Component Organization
- **UI Components**: Reusable React components with TypeScript interfaces
- **Services**: API abstraction layer with async/await patterns
- **Hooks**: Custom React hooks for state management and side effects
- **Context**: Global state providers for notifications, settings, etc.

### Backend Modules
- **Handlers**: High-level command processing and orchestration
- **Modules**: Low-level system integration and hardware control
- **Routers**: HTTP/WebSocket endpoint definitions
- **Utils**: Cross-cutting concerns (logging, validation, etc.)

## File Naming Conventions

### Frontend (TypeScript/React)
- **Components**: PascalCase (e.g., `ArcReactor.tsx`, `SystemDiagnostics.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useVoiceRecognition.ts`)
- **Services**: camelCase (e.g., `apiClient.ts`, `websocketService.ts`)
- **Types**: PascalCase interfaces (e.g., `CommandResponse`, `SystemStats`)

### Backend (Python)
- **Modules**: snake_case (e.g., `system.py`, `wake_word.py`)
- **Routers**: snake_case matching domain (e.g., `agent.py`, `commands.py`)
- **Classes**: PascalCase (e.g., `CommandHandler`, `SystemModule`)
- **Functions**: snake_case (e.g., `process_command`, `get_system_stats`)

## Configuration Management

### Environment Configuration
- **Frontend**: `config.ts` for build-time constants
- **Backend**: `.env` files with `python-dotenv` loading
- **Docker**: `docker-compose.yml` with environment variable injection
- **Database**: `alembic.ini` for migration configuration

### API Structure
- **REST Endpoints**: `/api/v1/{domain}/{action}` pattern
- **WebSocket**: Single endpoint with message-based routing
- **Authentication**: API key header validation on all protected routes
- **CORS**: Configured for frontend domain with credentials support

## Development Guidelines

### Code Organization
- Group related functionality in dedicated modules/components
- Maintain separation between UI logic and business logic
- Use TypeScript interfaces to mirror backend Pydantic models
- Follow domain-driven design principles in router organization

### Import Patterns
- Relative imports for local modules/components
- Absolute imports for external libraries
- Path aliases configured (`@/*` for `./src/*`)
- Consistent import ordering (external, internal, relative)

### Testing Structure
- **Frontend**: Vitest with React Testing Library in `src/tests/`
- **Backend**: pytest with async support in `backend/tests/`
- **Integration**: End-to-end functionality tests
- **Coverage**: Maintain high test coverage for critical paths