"""
JARVIS — Command Handler (Direct dispatch, no handler classes)
Replaces backend/handlers/ command pattern layer.
Routers import this module directly.
"""

import re
from typing import Any, Dict, Optional

from fastapi import WebSocket
from models import CommandResult
from modules.bilingual_parser import parser
from modules.context import context_manager
from modules.desktop import desktop_manager
from modules.file_manager import file_manager
from modules.input_control import input_controller
from modules.media import media_processor
from modules.memory import ConversationEntry, memory_manager
from modules.personalities import personality_manager
from modules.security import security
from modules.system import system_module
from modules.whatsapp import whatsapp_manager
from modules.window_manager import window_manager
from utils.logger_structured import log_command, logger

# Direct dispatch map: command_key -> (module_function_call)
# Each entry is a callable that accepts (params, current_lang) and returns Optional[Dict]


async def _dispatch_direct(command_key: str, params: Any, current_lang: str) -> Optional[Dict[str, Any]]:
    """Direct dispatch to module functions — no handler classes."""

    # ── System ──
    if command_key == "system_status":
        return await system_module.get_system_status(current_lang)
    if command_key == "time":
        return await system_module.get_time(current_lang)
    if command_key == "date":
        return await system_module.get_date(current_lang)
    if command_key == "battery":
        return await system_module.get_battery_status(current_lang)
    if command_key == "shutdown":
        return await system_module.shutdown(current_lang)
    if command_key == "restart":
        return await system_module.restart(current_lang)
    if command_key == "sleep":
        return await system_module.sleep(current_lang)
    if command_key == "volume_up":
        amount = None
        if params:
            nums = re.findall(r"\d+", str(params))
            if nums:
                amount = int(nums[0])
        return await system_module.volume_up(amount, current_lang)
    if command_key == "volume_down":
        amount = None
        if params:
            nums = re.findall(r"\d+", str(params))
            if nums:
                amount = int(nums[0])
        return await system_module.volume_down(amount, current_lang)
    if command_key == "mute":
        return await system_module.toggle_mute(current_lang)
    if command_key == "brightness_up":
        return await system_module.brightness_up(current_lang)
    if command_key == "brightness_down":
        return await system_module.brightness_down(current_lang)
    if command_key == "google_search":
        query = params.get("query", str(params)) if isinstance(params, dict) else (params if params != command_key else None)  # type: ignore[union-attr]
        return await system_module.google_search(query, current_lang)
    if command_key == "open_browser":
        return await system_module.google_search(None, current_lang)
    if command_key == "ip_address":
        return await system_module.get_network_info(current_lang)
    if command_key == "uptime":
        return await system_module.get_uptime(current_lang)
    if command_key == "weather":
        city = params.get("city", str(params)) if isinstance(params, dict) else (params if params != command_key else None)  # type: ignore[union-attr]
        return await system_module.get_weather(city, current_lang)

    # ── Window ──
    if command_key == "open_app":
        app_name = params.get("app", str(params)) if isinstance(params, dict) else str(params)  # type: ignore[union-attr]
        return await window_manager.open_app(app_name, current_lang)
    if command_key == "close_app":
        app_name = params.get("app", str(params)) if isinstance(params, dict) else str(params)  # type: ignore[union-attr]
        return await window_manager.close_app(app_name, current_lang)
    if command_key == "minimize":
        return await window_manager.minimize_window(params, current_lang)
    if command_key == "maximize":
        return await window_manager.maximize_window(params, current_lang)
    if command_key == "snap_left":
        return await window_manager.snap_window("left", current_lang)
    if command_key == "snap_right":
        return await window_manager.snap_window("right", current_lang)
    if command_key == "close_window":
        return await window_manager.close_window_by_title(params, current_lang)
    if command_key == "show_desktop":
        return await window_manager.show_desktop(current_lang)

    # ── Desktop ──
    if command_key == "take_screenshot":
        return await desktop_manager.take_screenshot(True, current_lang)
    if command_key == "media_play":
        return await desktop_manager.play_pause_media(current_lang)
    if command_key == "media_next":
        return await desktop_manager.next_track(current_lang)
    if command_key == "media_previous":
        return await desktop_manager.previous_track(current_lang)
    if command_key == "stop_media":
        return await desktop_manager.stop_media(current_lang)
    if command_key == "get_clipboard":
        return await desktop_manager.get_clipboard_text(current_lang)
    if command_key == "set_clipboard":
        text = params.get("text", str(params)) if isinstance(params, dict) else str(params)  # type: ignore[union-attr]
        return await desktop_manager.set_clipboard_text(text, current_lang)
    if command_key == "change_wallpaper":
        path = params.get("path", str(params)) if isinstance(params, dict) else str(params)  # type: ignore[union-attr]
        return await desktop_manager.change_wallpaper(path, current_lang)
    if command_key == "empty_recycle_bin":
        return await desktop_manager.empty_recycle_bin(current_lang)
    if command_key == "toggle_taskbar":
        return await desktop_manager.toggle_taskbar(current_lang)
    if command_key == "zoom_in":
        return await desktop_manager.zoom_screen("in", current_lang)
    if command_key == "zoom_out":
        return await desktop_manager.zoom_screen("out", current_lang)
    if command_key == "toggle_desktop_icons":
        return await desktop_manager.toggle_desktop_icons(current_lang)
    if command_key == "set_theme":
        theme = params.get("theme", str(params)) if isinstance(params, dict) else str(params)  # type: ignore[union-attr]
        return await desktop_manager.set_theme(theme, current_lang)

    # ── Input ──
    if command_key == "move_cursor":
        if isinstance(params, dict):
            x, y = params.get("x", 0), params.get("y", 0)
            return await input_controller.move_cursor(x, y)
    if command_key == "click":
        button = params.get("button", "left") if isinstance(params, dict) else "left"
        return await input_controller.click(button)
    if command_key == "double_click":
        return await input_controller.double_click()
    if command_key == "right_click":
        return await input_controller.right_click()
    if command_key == "scroll_up":
        return await input_controller.scroll(3)
    if command_key == "scroll_down":
        return await input_controller.scroll(-3)
    if command_key == "type_text":
        text = params.get("text", str(params)) if isinstance(params, dict) else str(params)  # type: ignore[union-attr]
        return await input_controller.type_text(text)
    if command_key == "press_key":
        key = params.get("key", str(params)) if isinstance(params, dict) else str(params)  # type: ignore[union-attr]
        return await input_controller.press_key(key)
    if command_key == "hotkey":
        keys = params.get("keys", []) if isinstance(params, dict) else [str(params)]  # type: ignore[union-attr]
        return await input_controller.press_hotkey(keys)
    if command_key == "new_tab":
        return await input_controller.new_tab()
    if command_key == "close_tab":
        return await input_controller.close_tab()
    if command_key == "copy":
        return await input_controller.copy_selection()
    if command_key == "paste":
        return await input_controller.paste_clipboard()
    if command_key == "select_all":
        return await input_controller.select_all()
    if command_key == "undo":
        return await input_controller.undo()
    if command_key == "save":
        return await input_controller.save()
    if command_key == "new_window":
        return await input_controller.new_window()
    if command_key == "find":
        return await input_controller.find()

    # ── File ──
    if command_key == "open_folder":
        folder = params.get("folder", str(params)) if isinstance(params, dict) else str(params)  # type: ignore[union-attr]
        return await file_manager.open_folder(folder, current_lang)
    if command_key in (
        "open_downloads", "open_documents", "open_desktop",
        "open_pictures", "open_videos", "open_music", "open_home",
    ):
        folder_name = command_key.replace("open_", "")
        return await file_manager.open_folder(folder_name, current_lang)
    if command_key == "search_files":
        query = params.get("query", str(params)) if isinstance(params, dict) else str(params)  # type: ignore[union-attr]
        return await file_manager.search_files(query, None, current_lang)
    if command_key == "create_folder":
        name = params.get("name", str(params)) if isinstance(params, dict) else str(params)  # type: ignore[union-attr]
        return await file_manager.create_folder(name, None, current_lang)
    if command_key == "delete_file":
        path = params.get("path", str(params)) if isinstance(params, dict) else str(params)  # type: ignore[union-attr]
        return await file_manager.delete_file(path, current_lang)
    if command_key == "copy_file":
        if isinstance(params, dict):
            return await file_manager.copy_file(params.get("source", ""), params.get("destination", ""), current_lang)
    if command_key == "move_file":
        if isinstance(params, dict):
            return await file_manager.move_file(params.get("source", ""), params.get("destination", ""), current_lang)
    if command_key == "rename_file":
        if isinstance(params, dict):
            return await file_manager.rename_file(params.get("path", ""), params.get("name", ""), current_lang)
    if command_key == "read_file":
        path = params.get("path", str(params)) if isinstance(params, dict) else str(params)  # type: ignore[union-attr]
        return await file_manager.read_file(path, 5000, current_lang)

    # ── Media ──
    if command_key in ("ocr_image", "extract_text"):
        if params:
            return await media_processor.extract_text_from_image(params, current_lang)
        return await media_processor.extract_text_from_screenshot(current_lang)
    if command_key in ("analyze_screen", "what_is_on_my_screen"):
        query = params.get("query", str(params)) if isinstance(params, dict) else (params if params != command_key else None)  # type: ignore[union-attr]
        return await media_processor.analyze_screen(query, current_lang)
    if command_key == "ocr_pdf":
        path = params.get("path", str(params)) if isinstance(params, dict) else str(params)  # type: ignore[union-attr]
        return await media_processor.extract_text_from_pdf(path, None, current_lang)
    if command_key == "convert_image":
        if isinstance(params, dict):
            return await media_processor.convert_image(params.get("input", ""), params.get("output", ""), params.get("format"), current_lang)
    if command_key == "resize_image":
        if isinstance(params, dict):
            return await media_processor.resize_image(params.get("input", ""), params.get("output", ""), params.get("width"), params.get("height"), True, current_lang)
    if command_key == "compress_image":
        if isinstance(params, dict):
            return await media_processor.compress_image(params.get("input", ""), params.get("output", ""), params.get("quality", 85), current_lang)
    if command_key == "merge_pdfs":
        if isinstance(params, dict):
            return await media_processor.merge_pdfs(params.get("files", []), params.get("output", ""), current_lang)
    if command_key == "pdf_to_images":
        path = params.get("path", str(params)) if isinstance(params, dict) else str(params)  # type: ignore[union-attr]
        return await media_processor.pdf_to_images(path, None, 200, current_lang)
    if command_key == "images_to_pdf":
        if isinstance(params, dict):
            return await media_processor.images_to_pdf(params.get("images", []), params.get("output", ""), current_lang)
    if command_key == "batch_pdf":
        folder = params.get("folder", str(params)) if isinstance(params, dict) else str(params)  # type: ignore[union-attr]
        return await media_processor.batch_images_to_pdf(folder, "batch.pdf", current_lang)
    if command_key == "scan_folder":
        folder = params.get("folder", str(params)) if isinstance(params, dict) else str(params)  # type: ignore[union-attr]
        ftype = params.get("type", "all")
        return await media_processor.scan_folder(folder, ftype, current_lang)
    if command_key == "make_drawing":
        return await media_processor.make_drawing(current_lang)
    if command_key == "get_selected_text":
        return await media_processor.get_selected_text(current_lang)
    if command_key == "narrate_screen":
        return await media_processor.narrate_screen(current_lang)
    if command_key == "get_screen_summary":
        return await media_processor.get_screen_summary(current_lang)

    # ── WhatsApp ──
    if command_key == "whatsapp_message":
        if isinstance(params, dict):
            return await whatsapp_manager.send_message(params.get("contact", ""), params.get("message", ""), current_lang)
        parts = [p.strip() for p in str(params).split(",")]
        if len(parts) >= 2:
            return await whatsapp_manager.send_message(parts[0], " ".join(parts[1:]), current_lang)
        return await whatsapp_manager.send_message(parts[0], "", current_lang) if parts else await whatsapp_manager.open_whatsapp(current_lang)
    if command_key == "whatsapp_call":
        contact = params.get("contact", str(params)) if isinstance(params, dict) else str(params)  # type: ignore[union-attr]
        return await whatsapp_manager.call_contact(contact, "video" in str(params).lower(), current_lang)
    if command_key == "whatsapp_draft_reply":
        return await whatsapp_manager.draft_smart_reply(current_lang)

    # ── Personality ──
    if command_key == "set_personality":
        p_id = str(params).lower().strip() if params else "stark"
        if personality_manager.set_personality(p_id):
            from config import CONFIG, save_config
            CONFIG["personality"] = p_id
            save_config(CONFIG)
            name = personality_manager.get_config()["name"]
            return {
                "success": True,
                "action_type": "PERSONALITY_SET",
                "response": f"Switching to {name} protocol, Sir." if current_lang == "en" else f"{name} प्रोटोकॉल सक्रिय।",
            }
        return {"success": False, "action_type": "PERSONALITY_SET", "response": f"Unknown personality '{p_id}'. Available: stark, midnight, avenue, linear."}

    # ── Memory ──
    if command_key == "save_memory":
        if isinstance(params, dict):
            title, content = params.get("title", ""), params.get("content", "")
            if title and content:
                await memory_manager.neural.update_node(title, content)
                return {"success": True, "action_type": "MEMORY_SAVE", "response": f"I've saved that to my neural memory under '{title}', Sir." if current_lang == "en" else f"मैंने इसे '{title}' के तहत अपनी याददाश्त में सहेज लिया है, सर।"}
    if command_key == "list_memories":
        nodes = await memory_manager.list_nodes()
        names = ", ".join(n["name"] for n in nodes)
        return {"success": True, "action_type": "MEMORY_LIST", "response": f"Here are the memory nodes I have: {names}" if names else "My neural memory is currently empty.", "data": nodes}
    if command_key == "command_insights":
        days = 30
        if params:
            nums = re.findall(r"\d+", str(params))
            if nums:
                days = min(int(nums[0]), 365)
        data = await memory_manager.get_command_insights(days)
        top = data.get("top_commands") or []
        if top:
            summary = ", ".join(f"{c['command_type']} ({c['count']})" for c in top[:3])
            response = f"Your top commands in the last {days} days: {summary}." if current_lang == "en" else f"पिछले {days} दिनों में सबसे ज़्यादा: {summary}।"
        else:
            response = "No command usage data yet, Sir." if current_lang == "en" else "अभी कोई कमांड डेटा नहीं है, सर।"
        return {"success": True, "action_type": "COMMAND_INSIGHTS", "response": response, "data": data}

    return None


async def dispatch_command(
    command_key: str,
    params: Any,
    current_lang: str,
    command: str = "",
    websocket: Optional[WebSocket] = None,
    session_id: Optional[str] = None,
) -> Dict[str, Any]:
    result = await _dispatch_direct(command_key, params, current_lang)
    if result is not None:
        return result
    return {"success": False, "action_type": "UNKNOWN", "response": "Unknown command."}


async def handle_command(
    websocket: Optional[WebSocket],
    command: str,
    language: Optional[str] = None,
    override_params: Optional[Dict[str, Any]] = None,
    session_id: Optional[str] = None,
) -> Dict[str, Any]:
    command_key, detected_lang, params = parser.parse_command(command)
    current_lang = language or detected_lang

    if override_params:
        params = override_params

    logger.info(f"Command received: '{command}' -> '{command_key}' (lang: {current_lang})")

    result_raw = await dispatch_command(command_key, params, current_lang, command, websocket, session_id)

    if result_raw.get("action_type") != "UNKNOWN":
        result = result_raw
    else:
        logger.info(f"No direct handler for '{command_key}', invoking Autonomous Agent...")

        if websocket:
            try:
                await websocket.send_json({"type": "agent_thinking", "session_id": session_id})
            except Exception:
                pass

        async def on_agent_thought(thought: str):
            if websocket:
                try:
                    await websocket.send_json({"type": "agent_thinking", "data": {"thought": thought, "session_id": session_id}})
                except Exception:
                    pass

        from modules.agent import agent_controller
        agent_response = await agent_controller.run_loop(command, current_lang, session_id or "default", on_thought=on_agent_thought)

        if agent_response:
            result = {"success": True, "action_type": "AGENT_RESOLVED", "response": agent_response}
            log_command(command, "agent", True)
            if websocket:
                try:
                    await websocket.send_json({"type": "agent_resolved", "data": {"full_response": agent_response, "session_id": session_id}})
                except Exception:
                    pass
        else:
            result = {"success": False, "action_type": "UNKNOWN", "response": parser.get_response("command_not_understood", current_lang)}
            log_command(command, "unknown", False)

    details = result.get("details") or (params if isinstance(params, dict) else None)
    suggestion = await context_manager.suggest_next_action()

    res_obj = CommandResult(
        success=result.get("success", True),
        response=result.get("response", ""),
        action_type=result.get("action_type", "COMMAND_EXECUTION"),
        command_key=command_key or "unknown",
        language=current_lang,
        suggestion=suggestion,
        details=details,
        data=result.get("data"),
    )

    if res_obj.success and result.get("requires_confirmation") and not result.get("confirmation_id"):
        res_obj.requires_confirmation = True
        res_obj.confirmation_id = security.request_confirmation(
            command_key=command_key, command_text=command, language=current_lang, details={"params": params, "language": current_lang},
        )

    res = res_obj.model_dump()

    try:
        entry = ConversationEntry(
            user_input=command, jarvis_response=res["response"], command_type=command_key or "conversation",
            success=res["success"], language=current_lang, session_id=session_id or "",
        )
        await memory_manager.save_conversation(entry)
        await context_manager.update_context(command, command_key or "conversation", res["success"], session_id or "default")
    except Exception as e:
        logger.error(f"Error saving to memory in command_handler: {e}")

    return res
