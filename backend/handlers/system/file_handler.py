from typing import Any, Dict, Optional

from modules.file_manager import file_manager


class FileHandler:
    async def handle(self, command_key: str, params: Any, current_lang: str) -> Optional[Dict[str, Any]]:
        if command_key == "open_folder":
            folder = params.get("folder", str(params)) if isinstance(params, dict) else str(params)
            return await file_manager.open_folder(folder, current_lang)
        if command_key in (
            "open_downloads",
            "open_documents",
            "open_desktop",
            "open_pictures",
            "open_videos",
            "open_music",
            "open_home",
        ):
            folder_name = command_key.replace("open_", "")
            return await file_manager.open_folder(folder_name, current_lang)
        if command_key == "search_files":
            query = params.get("query", str(params)) if isinstance(params, dict) else str(params)
            return await file_manager.search_files(query, None, current_lang)
        if command_key == "create_folder":
            name = params.get("name", str(params)) if isinstance(params, dict) else str(params)
            return await file_manager.create_folder(name, None, current_lang)
        if command_key == "delete_file":
            path = params.get("path", str(params)) if isinstance(params, dict) else str(params)
            return await file_manager.delete_file(path, current_lang)
        if command_key == "copy_file":
            if isinstance(params, dict):
                src, dst = params.get("source", ""), params.get("destination", "")
                return await file_manager.copy_file(src, dst, current_lang)
        if command_key == "move_file":
            if isinstance(params, dict):
                src, dst = params.get("source", ""), params.get("destination", "")
                return await file_manager.move_file(src, dst, current_lang)
        if command_key == "rename_file":
            if isinstance(params, dict):
                path, name = params.get("path", ""), params.get("name", "")
                return await file_manager.rename_file(path, name, current_lang)
        if command_key == "read_file":
            path = params.get("path", str(params)) if isinstance(params, dict) else str(params)
            return await file_manager.read_file(path, 5000, current_lang)
        return None
