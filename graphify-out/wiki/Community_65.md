# Community 65

> 13 nodes · cohesion 0.17

## Key Concepts

- **broadcast_notification()** (6 connections) — `backend/routers/websocket.py`
- **WebSocketResponse** (4 connections) — `backend/models.py`
- **.check_system_health()** (4 connections) — `backend/modules/system.py`
- **.monitor_processes()** (4 connections) — `backend/modules/system.py`
- **push_notification()** (4 connections) — `backend/routers/notifications.py`
- **websocket_endpoint()** (4 connections) — `backend/routers/websocket.py`
- **websocket.py** (2 connections) — `backend/routers/websocket.py`
- **notifications.py** (1 connections) — `backend/routers/notifications.py`
- **Check system health and broadcast notifications for critical events** (1 connections) — `backend/modules/system.py`
- **Scan for suspicious processes based on Neural Security Node and resource usage** (1 connections) — `backend/modules/system.py`
- **Push a notification to all connected WebSocket clients** (1 connections) — `backend/routers/notifications.py`
- **Real-time bidirectional communication** (1 connections) — `backend/routers/websocket.py`
- **Broadcast a UI notification to all connected WebSocket clients** (1 connections) — `backend/routers/websocket.py`

## Relationships

- No strong cross-community connections detected

## Source Files

- `backend/models.py`
- `backend/modules/system.py`
- `backend/routers/notifications.py`
- `backend/routers/websocket.py`

## Audit Trail

- EXTRACTED: 22 (65%)
- INFERRED: 12 (35%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*