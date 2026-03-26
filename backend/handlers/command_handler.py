import asyncio
import re
import json
from datetime import datetime
from typing import Dict, Any, List, Optional, cast
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
from modules.memory import memory_manager
from modules.context import context_manager
from utils.logger import logger, log_command

async def handle_command(websocket: Optional[WebSocket], command: str, 
                         language: Optional[str] = None, 
                         override_params: Optional[Dict[str, Any]] = None,
                         session_id: Optional[str] = None) -> Dict[str, Any]:
    """Process a command and return result"""
    # Use English as default language
    current_lang = language or 'en'
    
    # Detect language if not provided
    if not current_lang:
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
        
        res = {
            'success': True,
            'action_type': 'MACRO_STARTED',
            'response': f"Executing macro: {macro.name}" if language == 'en' else f"मैक्रो शुरू कर रहा हूँ: {macro.name}",
            'macro_name': macro.name,
            'command_key': 'macro',
            'language': current_lang,
            'timestamp': datetime.now().isoformat()
        }

        # Persist macro trigger to memory
        try:
            from modules.memory import ConversationEntry
            entry = ConversationEntry(
                user_input=command,
                jarvis_response=res['response'],
                command_type='macro',
                success=True,
                language=current_lang,
                session_id=session_id or ""
            )
            memory_manager.save_conversation(entry)
            context_manager.update_context(command, 'macro', True, session_id or "default")
        except Exception as e:
            logger.error(f"Error persisting macro to memory: {e}")

        return res
    
    logger.info(f"Command received: '{command}' -> '{command_key}' (lang: {language})")
    
    # Route to appropriate module
    result: Dict[str, Any] = {}
    
    # Dispatch logic summarized from original main.py handlers
    # System commands
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
    
    # Window/App commands
    elif command_key == 'open_app':
        app_name = params.get('app', str(params)) if isinstance(params, dict) else str(params)
        result = await window_manager.open_app(app_name, language)
    elif command_key == 'close_app':
        app_name = params.get('app', str(params)) if isinstance(params, dict) else str(params)
        result = await window_manager.close_app(app_name, language)
    elif command_key == 'minimize':
        result = await window_manager.minimize_window(params, language)
    elif command_key == 'maximize':
        result = await window_manager.maximize_window(params, language)
    
    # Desktop commands
    elif command_key == 'take_screenshot':
        result = await desktop_manager.take_screenshot(True, language)
    elif command_key == 'media_play':
        result = await desktop_manager.play_pause_media(language)
    elif command_key == 'media_next':
        result = await desktop_manager.next_track(language)
    elif command_key == 'media_previous':
        result = await desktop_manager.previous_track(language)
    
    # OCR/Vision commands
    elif command_key in ['ocr_image', 'extract_text']:
        if params:
            result = await media_processor.extract_text_from_image(params, language)
        else:
            result = await media_processor.extract_text_from_screenshot(language)
    
    # WhatsApp
    elif command_key == 'whatsapp_message':
        if params:
            if isinstance(params, dict):
                contact, msg = params.get('contact', ''), params.get('message', '')
                result = await whatsapp_manager.send_message_web(contact, msg, language)
            else:
                parts = [p.strip() for p in str(params).split(',')]
                if len(parts) >= 2:
                    result = await whatsapp_manager.send_message_web(parts[0], ' '.join(parts[1:]), language)
                else:
                    result = await whatsapp_manager.send_message_web(parts[0], "", language)
        else:
            result = await whatsapp_manager.open_whatsapp_web(language)
    
    # AI Conversation Fallback
    else:
        logger.info(f"No direct handler for '{command_key}', using AI fallback...")
        context_str = ""
        try:
            facts = memory_manager.search_memory("")
            if facts:
                context_str += "Known facts:\n" + "\n".join([f"- {f.key}: {f.value}" for f in facts[:5]])
            history = context_manager.get_conversation_context(limit=3)
            if history:
                context_str += "\nHistory:\n" + "\n".join([f"User: {h.user_input}\nJARVIS: {h.jarvis_response}" for h in history])
        except: pass

        llm_response = await llm_module.get_response(command, language, context=context_str)
        if llm_response:
            result = {'success': True, 'action_type': 'CONVERSATION', 'response': llm_response}
            log_command(command, 'conversation', True)
        else:
            result = {'success': False, 'action_type': 'UNKNOWN', 'response': parser.get_response('command_not_understood', language)}
            log_command(command, 'unknown', False)

    # Post-process, Confirmation, Memory save...
    res = cast(Dict[str, Any], result)
    if res and res.get('requires_confirmation') and not res.get('confirmation_id'):
        res['confirmation_id'] = security.request_confirmation(
            command_key=command_key,
            command_text=command,
            language=current_lang,
            details={'params': params, 'language': current_lang}
        )
    
    if res:
        res['command_key'] = command_key
        res['language'] = current_lang
        res['timestamp'] = datetime.now().isoformat()
    
    # Save to memory
    try:
        from modules.memory import ConversationEntry
        entry = ConversationEntry(
            user_input=command,
            jarvis_response=res.get('response', ''),
            command_type=command_key,
            success=res.get('success', True),
            language=current_lang,
            session_id=session_id or ""
        )
        memory_manager.save_conversation(entry)
        context_manager.update_context(command, command_key or "conversation", res.get('success', False), session_id or "default")
    except: pass
        
    return res
