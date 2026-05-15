# System Configuration & Diagnostics

> 38 nodes · cohesion 0.05

## Key Concepts

- **system.py** (18 connections) — `backend/routers/system.py`
- **defaults.py** (4 connections) — `backend/config/defaults.py`
- **__init__.py** (4 connections) — `backend/config/__init__.py`
- **save_config()** (4 connections) — `backend/config/defaults.py`
- **set_personality()** (3 connections) — `backend/routers/system.py`
- **environment.py** (2 connections) — `backend/config/environment.py`
- **get_config()** (2 connections) — `backend/config/defaults.py`
- **get_battery_status()** (2 connections) — `backend/routers/system.py`
- **get_command_insights()** (2 connections) — `backend/routers/system.py`
- **get_network_info()** (2 connections) — `backend/routers/system.py`
- **get_performance_history()** (2 connections) — `backend/routers/system.py`
- **get_personalities()** (2 connections) — `backend/routers/system.py`
- **get_system_status()** (2 connections) — `backend/routers/system.py`
- **google_search()** (2 connections) — `backend/routers/system.py`
- **sleep()** (2 connections) — `backend/routers/system.py`
- **toggle_mute()** (2 connections) — `backend/routers/system.py`
- **commands.py** (1 connections) — `backend/config/commands.py`
- **responses.py** (1 connections) — `backend/config/responses.py`
- **Load user config from JSON, merging with defaults** (1 connections) — `backend/config/defaults.py`
- **Save user config to JSON** (1 connections) — `backend/config/defaults.py`
- **get_date()** (1 connections) — `backend/routers/system.py`
- **get_time()** (1 connections) — `backend/routers/system.py`
- **get_uptime()** (1 connections) — `backend/routers/system.py`
- **get_weather()** (1 connections) — `backend/routers/system.py`
- **Get behavioral command analytics** (1 connections) — `backend/routers/system.py`
- *... and 13 more nodes in this community*

## Relationships

- No strong cross-community connections detected

## Source Files

- `backend/config/__init__.py`
- `backend/config/commands.py`
- `backend/config/defaults.py`
- `backend/config/environment.py`
- `backend/config/responses.py`
- `backend/routers/system.py`

## Audit Trail

- EXTRACTED: 74 (96%)
- INFERRED: 3 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*