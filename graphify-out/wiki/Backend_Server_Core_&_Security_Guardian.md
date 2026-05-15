# Backend Server Core & Security Guardian

> 44 nodes · cohesion 0.05

## Key Concepts

- **SecurityManager** (11 connections) — `backend/modules/security.py`
- **main.py** (10 connections) — `backend/main.py`
- **log_system_event()** (6 connections) — `backend/utils/logger.py`
- **lifespan()** (5 connections) — `backend/main.py`
- **logger.py** (5 connections) — `backend/utils/logger.py`
- **.request_confirmation()** (5 connections) — `backend/modules/security.py`
- **monitor_event_loop_lag()** (4 connections) — `backend/main.py`
- **._handle_timeout()** (4 connections) — `backend/modules/security.py`
- **UTF8ConsoleHandler** (4 connections) — `backend/utils/logger.py`
- **broadcast_system_status()** (3 connections) — `backend/main.py`
- **.confirm_command()** (3 connections) — `backend/modules/security.py`
- **setup_logger()** (3 connections) — `backend/utils/logger.py`
- **add_request_id()** (2 connections) — `backend/main.py`
- **_find_frontend_dir()** (2 connections) — `backend/main.py`
- **response_time_middleware()** (2 connections) — `backend/main.py`
- **root()** (2 connections) — `backend/main.py`
- **.cleanup_old_confirmations()** (2 connections) — `backend/modules/security.py`
- **.get_confirmation_details()** (2 connections) — `backend/modules/security.py`
- **.get_confirmation_status()** (2 connections) — `backend/modules/security.py`
- **.is_dangerous()** (2 connections) — `backend/modules/security.py`
- **.register_callback()** (2 connections) — `backend/modules/security.py`
- **api_key_middleware()** (1 connections) — `backend/main.py`
- **favicon()** (1 connections) — `backend/main.py`
- **global_exception_handler()** (1 connections) — `backend/main.py`
- **Monitor event loop latency to detect blocking calls** (1 connections) — `backend/main.py`
- *... and 19 more nodes in this community*

## Relationships

- No strong cross-community connections detected

## Source Files

- `backend/main.py`
- `backend/modules/security.py`
- `backend/utils/logger.py`

## Audit Trail

- EXTRACTED: 91 (88%)
- INFERRED: 13 (12%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*