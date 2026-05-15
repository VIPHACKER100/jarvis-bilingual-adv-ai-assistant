import asyncio
import re
import json
from datetime import datetime
from typing import Dict, Any, List, Optional, cast, Union
from fastapi import WebSocket

from config import HINDI_COMMANDS
from modules.system import system_module
from modules.security import security
from modules.bilingual_parser import parser
from modules.window_manager import window_manager
from modules.input_control import input_controller
from modules.whatsapp import whatsapp_manager
from modules.file_manager import file_manager
from modules.media import media_processor
from modules.desktop import desktop_manager
from modules.llm import llm_module
from modules.automation import automation_manager
from modules.memory import memory_manager, ConversationEntry
from modules.context import context_manager
from utils.logger import logger, log_command
from models import CommandResult, ConversationEntryModel

async def handle_command(websocket: Optional[WebSocket], command: str, 
                         language: Optional[str] = None, 
                         override_params: Optional[Dict[str, Any]] = None,
                         session_id: Optional[str] = None) -> Dict[str, Any]:
    """Process a command and return result as a dictionary compatible with CommandResult model"""
    # Use English as default language
    current_lang = language or 'en'
    
    # Detect language if not provided
    if not language:
        current_lang = parser.detect_language(command)
    
    # Parse command
    command_key, detected_lang, params = parser.parse_command(command)
    
    # LLM Fallback for Adaptive NLP
    if command_key == 'unknown' or not command_key:
        logger.info(f"Rule-based parser failed for: '{command}'. Attempting LLM extraction...")
        available_keys = list(HINDI_COMMANDS.keys())
        llm_result = await llm_module.extract_command(command, available_keys)
        if llm_result and llm_result.get('command_key') != 'unknown':
            command_key = llm_result['command_key']
            params = llm_result.get('params')
            logger.info(f"LLM successfully extracted command: {command_key}")

    if detected_lang and language != 'hinglish':
        current_lang = detected_lang
        
    # Apply parameters override (from macros)
    if override_params:
        if params:
            params.update(override_params)
        else:
            params = override_params
    
    # Check if command matches a macro trigger phrase (voice trigger)
    macro = automation_manager.find_macro_by_trigger(command)
    if macro:
        logger.info(f"Voice trigger matched macro: {macro.name}")
        
        # Define callback for macro commands
        async def macro_cmd_callback(cmd, p):
            res = await handle_command(websocket, cmd, language, p, session_id)
            if websocket:
                try:
                    await websocket.send_json({
                        'type': 'macro_update',
                        'command': cmd,
                        'result': res
                    })
                except:
                    pass
        
        # Start macro in background
        asyncio.create_task(automation_manager.run_macro(macro.id, macro_cmd_callback))
        
        res_obj = CommandResult(
            success=True,
            action_type='MACRO_STARTED',
            response=f"Executing macro: {macro.name}" if language == 'en' else f"मैक्रो शुरू कर रहा हूँ: {macro.name}",
            macro_name=macro.name,
            command_key='macro',
            language=current_lang
        )
        res = res_obj.dict()

        # Persist macro trigger to memory
        try:
            entry = ConversationEntry(
                user_input=command,
                jarvis_response=res['response'],
                command_type='macro',
                success=True,
                language=current_lang,
                session_id=session_id or ""
            )
            await memory_manager.save_conversation(entry)
            await context_manager.update_context(command, 'macro', True, session_id or "default")
        except Exception as e:
            logger.error(f"Error persisting macro to memory: {e}")

        return res
    
    logger.info(f"Command received: '{command}' -> '{command_key}' (lang: {current_lang})")
    
    # Route to appropriate module
    result: Dict[str, Any] = {}
    
    # Dispatch logic
    if command_key == 'system_status':
        result = await system_module.get_system_status(current_lang)
    elif command_key == 'time':
        result = await system_module.get_time(current_lang)
    elif command_key == 'date':
        result = await system_module.get_date(current_lang)
    elif command_key == 'battery':
        result = await system_module.get_battery_status(current_lang)
    elif command_key == 'shutdown':
        result = await system_module.shutdown(current_lang)
    elif command_key == 'restart':
        result = await system_module.restart(current_lang)
    elif command_key == 'sleep':
        result = await system_module.sleep(current_lang)
    elif command_key in ['volume_up', 'volume_down']:
        amount = None
        if params:
            nums = re.findall(r'\d+', str(params))
            if nums: amount = int(nums[0])
        if command_key == 'volume_up':
            result = await system_module.volume_up(amount, current_lang)
        else:
            result = await system_module.volume_down(amount, current_lang)
    elif command_key == 'mute':
        result = await system_module.toggle_mute(current_lang)
    elif command_key == 'brightness_up':
        result = await system_module.brightness_up(current_lang)
    elif command_key == 'brightness_down':
        result = await system_module.brightness_down(current_lang)
    elif command_key == 'google_search':
        query = params.get('query', str(params)) if isinstance(params, dict) else (params if params != command else None)
        result = await system_module.google_search(query, current_lang)
    elif command_key == 'open_browser':
        result = await system_module.google_search(None, current_lang)
    elif command_key == 'ip_address':
        result = await system_module.get_network_info(current_lang)
    elif command_key == 'uptime':
        result = await system_module.get_uptime(current_lang)
    elif command_key == 'weather':
        city = params.get('city', str(params)) if isinstance(params, dict) else (params if params != command else None)
        result = await system_module.get_weather(city, current_lang)
    
    # Window/App commands
    elif command_key == 'open_app':
        app_name = params.get('app', str(params)) if isinstance(params, dict) else str(params)
        result = await window_manager.open_app(app_name, current_lang)
    elif command_key == 'close_app':
        app_name = params.get('app', str(params)) if isinstance(params, dict) else str(params)
        result = await window_manager.close_app(app_name, current_lang)
    elif command_key == 'minimize':
        result = await window_manager.minimize_window(params, current_lang)
    elif command_key == 'maximize':
        result = await window_manager.maximize_window(params, current_lang)
    elif command_key == 'snap_left':
        result = await window_manager.snap_window('left', current_lang)
    elif command_key == 'snap_right':
        result = await window_manager.snap_window('right', current_lang)
    elif command_key == 'close_window':
        result = await window_manager.close_window_by_title(params, current_lang)
    elif command_key == 'show_desktop':
        result = await window_manager.show_desktop(current_lang)
    
    # Desktop commands
    elif command_key == 'take_screenshot':
        result = await desktop_manager.take_screenshot(True, current_lang)
    elif command_key == 'media_play':
        result = await desktop_manager.play_pause_media(current_lang)
    elif command_key == 'media_next':
        result = await desktop_manager.next_track(current_lang)
    elif command_key == 'media_previous':
        result = await desktop_manager.previous_track(current_lang)
    elif command_key == 'get_clipboard':
        result = await desktop_manager.get_clipboard_text(current_lang)
    elif command_key == 'set_clipboard':
        text = params.get('text', str(params)) if isinstance(params, dict) else str(params)
        result = await desktop_manager.set_clipboard_text(text, current_lang)
    elif command_key == 'change_wallpaper':
        path = params.get('path', str(params)) if isinstance(params, dict) else str(params)
        result = await desktop_manager.change_wallpaper(path, current_lang)
    elif command_key == 'empty_recycle_bin':
        result = await desktop_manager.empty_recycle_bin(current_lang)
    elif command_key == 'toggle_taskbar':
        result = await desktop_manager.toggle_taskbar(current_lang)
    elif command_key == 'zoom_in':
        result = await desktop_manager.zoom_screen('in', current_lang)
    elif command_key == 'zoom_out':
        result = await desktop_manager.zoom_screen('out', current_lang)
    elif command_key == 'stop_media':
        result = await desktop_manager.stop_media(current_lang)
    elif command_key == 'toggle_desktop_icons':
        result = await desktop_manager.toggle_desktop_icons(current_lang)
    elif command_key == 'set_theme':
        theme = params.get('theme', str(params)) if isinstance(params, dict) else str(params)
        result = await desktop_manager.set_theme(theme, current_lang)
    
    # Input / Automation commands
    elif command_key == 'move_cursor':
        if isinstance(params, dict):
            x, y = params.get('x', 0), params.get('y', 0)
            result = await input_controller.move_cursor(x, y)
    elif command_key == 'click':
        button = params.get('button', 'left') if isinstance(params, dict) else 'left'
        result = await input_controller.click(button)
    elif command_key == 'double_click':
        result = await input_controller.double_click()
    elif command_key == 'right_click':
        result = await input_controller.right_click()
    elif command_key == 'scroll_up':
        result = await input_controller.scroll(3)
    elif command_key == 'scroll_down':
        result = await input_controller.scroll(-3)
    elif command_key == 'type_text':
        text = params.get('text', str(params)) if isinstance(params, dict) else str(params)
        result = await input_controller.type_text(text)
    elif command_key == 'press_key':
        key = params.get('key', str(params)) if isinstance(params, dict) else str(params)
        result = await input_controller.press_key(key)
    elif command_key == 'hotkey':
        keys = params.get('keys', []) if isinstance(params, dict) else [str(params)]
        result = await input_controller.press_hotkey(keys)
    elif command_key == 'new_tab':
        result = await input_controller.new_tab()
    elif command_key == 'close_tab':
        result = await input_controller.close_tab()
    elif command_key == 'copy':
        result = await input_controller.copy_selection()
    elif command_key == 'paste':
        result = await input_controller.paste_clipboard()
    elif command_key == 'select_all':
        result = await input_controller.select_all()
    elif command_key == 'undo':
        result = await input_controller.undo()
    elif command_key == 'save':
        result = await input_controller.save()
    elif command_key == 'new_window':
        result = await input_controller.new_window()
    elif command_key == 'find':
        result = await input_controller.find()

    # File Management
    elif command_key == 'open_folder':
        folder = params.get('folder', str(params)) if isinstance(params, dict) else str(params)
        result = await file_manager.open_folder(folder, current_lang)
    elif command_key == 'open_downloads':
        result = await file_manager.open_folder('downloads', current_lang)
    elif command_key == 'open_documents':
        result = await file_manager.open_folder('documents', current_lang)
    elif command_key == 'open_desktop':
        result = await file_manager.open_folder('desktop', current_lang)
    elif command_key == 'open_pictures':
        result = await file_manager.open_folder('pictures', current_lang)
    elif command_key == 'open_videos':
        result = await file_manager.open_folder('videos', current_lang)
    elif command_key == 'open_music':
        result = await file_manager.open_folder('music', current_lang)
    elif command_key == 'open_home':
        result = await file_manager.open_folder('home', current_lang)
    elif command_key == 'search_files':
        query = params.get('query', str(params)) if isinstance(params, dict) else str(params)
        result = await file_manager.search_files(query, None, current_lang)
    elif command_key == 'create_folder':
        name = params.get('name', str(params)) if isinstance(params, dict) else str(params)
        result = await file_manager.create_folder(name, None, current_lang)
    elif command_key == 'delete_file':
        path = params.get('path', str(params)) if isinstance(params, dict) else str(params)
        result = await file_manager.delete_file(path, current_lang)
    elif command_key == 'copy_file':
        if isinstance(params, dict):
            src, dst = params.get('source', ''), params.get('destination', '')
            result = await file_manager.copy_file(src, dst, current_lang)
    elif command_key == 'move_file':
        if isinstance(params, dict):
            src, dst = params.get('source', ''), params.get('destination', '')
            result = await file_manager.move_file(src, dst, current_lang)
    elif command_key == 'rename_file':
        if isinstance(params, dict):
            path, name = params.get('path', ''), params.get('name', '')
            result = await file_manager.rename_file(path, name, current_lang)
    
    # OCR/Vision commands
    elif command_key in ['ocr_image', 'extract_text']:
        if params:
            result = await media_processor.extract_text_from_image(params, current_lang)
        else:
            result = await media_processor.extract_text_from_screenshot(current_lang)
    
    elif command_key in ['analyze_screen', 'what_is_on_my_screen']:
        query = params.get('query', str(params)) if isinstance(params, dict) else (params if params != command else None)
        result = await media_processor.analyze_screen(query, current_lang)
    
    elif command_key == 'ocr_pdf':
        path = params.get('path', str(params)) if isinstance(params, dict) else str(params)
        result = await media_processor.extract_text_from_pdf(path, None, current_lang)
    
    elif command_key == 'convert_image':
        if isinstance(params, dict):
            src, dst = params.get('input', ''), params.get('output', '')
            fmt = params.get('format')
            result = await media_processor.convert_image(src, dst, fmt, current_lang)
            
    elif command_key == 'resize_image':
        if isinstance(params, dict):
            src, dst = params.get('input', ''), params.get('output', '')
            w, h = params.get('width'), params.get('height')
            result = await media_processor.resize_image(src, dst, w, h, True, current_lang)
            
    elif command_key == 'compress_image':
        if isinstance(params, dict):
            src, dst = params.get('input', ''), params.get('output', '')
            q = params.get('quality', 85)
            result = await media_processor.compress_image(src, dst, q, current_lang)
            
    elif command_key == 'merge_pdfs':
        if isinstance(params, dict):
            files, out = params.get('files', []), params.get('output', '')
            result = await media_processor.merge_pdfs(files, out, current_lang)
            
    elif command_key == 'pdf_to_images':
        path = params.get('path', str(params)) if isinstance(params, dict) else str(params)
        result = await media_processor.pdf_to_images(path, None, 200, current_lang)
        
    elif command_key == 'images_to_pdf':
        if isinstance(params, dict):
            files, out = params.get('images', []), params.get('output', '')
            result = await media_processor.images_to_pdf(files, out, current_lang)
            
    elif command_key == 'batch_pdf':
        folder = params.get('folder', str(params)) if isinstance(params, dict) else str(params)
        result = await media_processor.batch_images_to_pdf(folder, "batch.pdf", current_lang)
        
    elif command_key == 'scan_folder':
        folder = params.get('folder', str(params)) if isinstance(params, dict) else str(params)
        ftype = params.get('type', 'all')
        result = await media_processor.scan_folder(folder, ftype, current_lang)
        
    elif command_key == 'make_drawing':
        result = await media_processor.make_drawing(current_lang)
        
    elif command_key == 'get_selected_text':
        result = await media_processor.get_selected_text(current_lang)
        
    elif command_key == 'narrate_screen':
        result = await media_processor.narrate_screen(current_lang)
        
    elif command_key == 'get_screen_summary':
        result = await media_processor.get_screen_summary(current_lang)
    
    # WhatsApp
    elif command_key == 'whatsapp_message':
        if params:
            if isinstance(params, dict):
                contact, msg = params.get('contact', ''), params.get('message', '')
                result = await whatsapp_manager.send_message(contact, msg, current_lang)
            else:
                parts = [p.strip() for p in str(params).split(',')]
                if len(parts) >= 2:
                    result = await whatsapp_manager.send_message(parts[0], ' '.join(parts[1:]), current_lang)
                else:
                    result = await whatsapp_manager.send_message(parts[0], "", current_lang)
        else:
            result = await whatsapp_manager.open_whatsapp(current_lang)
            
    elif command_key == 'whatsapp_call':
        contact = params.get('contact', str(params)) if isinstance(params, dict) else str(params)
        is_video = 'video' in str(params).lower() or 'video' in command.lower()
        result = await whatsapp_manager.call_contact(contact, is_video, current_lang)
    
    elif command_key == 'whatsapp_draft_reply':
        result = await whatsapp_manager.draft_smart_reply(current_lang)

    # Personality / theme switching
    elif command_key == 'set_personality':
        from modules.personalities import personality_manager
        from config import CONFIG, save_config
        p_id = str(params).lower().strip() if params else 'stark'
        if personality_manager.set_personality(p_id):
            CONFIG['personality'] = p_id
            save_config(CONFIG)
            name = personality_manager.get_config()['name']
            result = {'success': True, 'action_type': 'PERSONALITY_SET',
                      'response': f"Switching to {name} protocol, Sir." if current_lang == 'en'
                                  else f"{name} प्रोटोकॉल सक्रिय।"}
        else:
            result = {'success': False, 'action_type': 'PERSONALITY_SET',
                      'response': f"Unknown personality '{p_id}'. Available: stark, midnight, avenue, linear."}

    # Command insights
    elif command_key == 'command_insights':
        insights = await memory_manager.get_command_insights()
        top = ', '.join([c['command_type'] for c in insights.get('top_commands', [])[:3]])
        result = {'success': True, 'action_type': 'INSIGHTS',
                  'response': f"Your top commands: {top}." if top else "No insight data yet.",
                  'data': insights}

    # AI Conversation Fallback
    else:
        logger.info(f"No direct handler for '{command_key}', using AI fallback...")
        context_str = ""
        try:
            # Use query-aware search for better context relevance (v3.7.0)
            facts = await memory_manager.search_memory(command)
            if facts:
                context_str += "Known facts:\n" + "\n".join([f"- {f.key}: {f.value}" for f in facts[:5]])
            history = await context_manager.get_conversation_context(limit=3)
            if history:
                context_str += "\nHistory:\n" + "\n".join([f"User: {h['user']}\nJARVIS: {h['jarvis']}" for h in history])
        except: pass

        llm_response = ""
        if websocket:
            # Send initial signal that AI is thinking
            try:
                await websocket.send_json({
                    'type': 'stream_start',
                    'session_id': session_id
                })
            except: pass

            async for chunk in llm_module.get_response_stream(command, current_lang, context=context_str):
                llm_response += chunk
                try:
                    await websocket.send_json({
                        'type': 'stream_chunk',
                        'chunk': chunk,
                        'session_id': session_id
                    })
                except: break
            
            # Send final signal
            try:
                await websocket.send_json({
                    'type': 'stream_end',
                    'full_response': llm_response,
                    'session_id': session_id
                })
            except: pass
        else:
            llm_response = await llm_module.get_response(command, current_lang, context=context_str)

        if llm_response:
            result = {'success': True, 'action_type': 'CONVERSATION', 'response': llm_response}
            log_command(command, 'conversation', True)
        else:
            result = {'success': False, 'action_type': 'UNKNOWN', 'response': parser.get_response('command_not_understood', current_lang)}
            log_command(command, 'unknown', False)

    # Post-process with Pydantic model
    # Convert Pydantic object to dict if needed
    if hasattr(result, 'dict'):
        result = result.dict()
    
    details = result.get('details') or (params if isinstance(params, dict) else None)
    
    # Get proactive suggestion
    suggestion = await context_manager.suggest_next_action()
    
    res_obj = CommandResult(
        success=result.get('success', True),
        response=result.get('response', ''),
        action_type=result.get('action_type', 'COMMAND_EXECUTION'),
        command_key=command_key or 'unknown',
        language=current_lang,
        suggestion=suggestion,
        details=details,
        data=result.get('data')
    )

    # Security confirmation check
    if res_obj.success and result.get('requires_confirmation') and not result.get('confirmation_id'):
        res_obj.requires_confirmation = True
        res_obj.confirmation_id = security.request_confirmation(
            command_key=command_key,
            command_text=command,
            language=current_lang,
            details={'params': params, 'language': current_lang}
        )
    
    res = res_obj.dict()
    
    # Save to memory
    try:
        entry = ConversationEntry(
            user_input=command,
            jarvis_response=res['response'],
            command_type=command_key or "conversation",
            success=res['success'],
            language=current_lang,
            session_id=session_id or ""
        )
        await memory_manager.save_conversation(entry)
        await context_manager.update_context(command, command_key or "conversation", res['success'], session_id or "default")
    except Exception as e:
        logger.error(f"Error saving to memory in command_handler: {e}")
        
    return res
