from typing import Any, Dict, Optional

from modules.media import media_processor


class MediaHandler:

    async def handle(self, command_key: str, params: Any, current_lang: str) -> Optional[Dict[str, Any]]:
        if command_key in ('ocr_image', 'extract_text'):
            if params:
                return await media_processor.extract_text_from_image(params, current_lang)
            return await media_processor.extract_text_from_screenshot(current_lang)
        if command_key in ('analyze_screen', 'what_is_on_my_screen'):
            query = params.get('query', str(params)) if isinstance(params, dict) else (params if params != command_key else None)
            return await media_processor.analyze_screen(query, current_lang)
        if command_key == 'ocr_pdf':
            path = params.get('path', str(params)) if isinstance(params, dict) else str(params)
            return await media_processor.extract_text_from_pdf(path, None, current_lang)
        if command_key == 'convert_image':
            if isinstance(params, dict):
                src, dst = params.get('input', ''), params.get('output', '')
                fmt = params.get('format')
                return await media_processor.convert_image(src, dst, fmt, current_lang)
        if command_key == 'resize_image':
            if isinstance(params, dict):
                src, dst = params.get('input', ''), params.get('output', '')
                w, h = params.get('width'), params.get('height')
                return await media_processor.resize_image(src, dst, w, h, True, current_lang)
        if command_key == 'compress_image':
            if isinstance(params, dict):
                src, dst = params.get('input', ''), params.get('output', '')
                q = params.get('quality', 85)
                return await media_processor.compress_image(src, dst, q, current_lang)
        if command_key == 'merge_pdfs':
            if isinstance(params, dict):
                files, out = params.get('files', []), params.get('output', '')
                return await media_processor.merge_pdfs(files, out, current_lang)
        if command_key == 'pdf_to_images':
            path = params.get('path', str(params)) if isinstance(params, dict) else str(params)
            return await media_processor.pdf_to_images(path, None, 200, current_lang)
        if command_key == 'images_to_pdf':
            if isinstance(params, dict):
                files, out = params.get('images', []), params.get('output', '')
                return await media_processor.images_to_pdf(files, out, current_lang)
        if command_key == 'batch_pdf':
            folder = params.get('folder', str(params)) if isinstance(params, dict) else str(params)
            return await media_processor.batch_images_to_pdf(folder, "batch.pdf", current_lang)
        if command_key == 'scan_folder':
            folder = params.get('folder', str(params)) if isinstance(params, dict) else str(params)
            ftype = params.get('type', 'all')
            return await media_processor.scan_folder(folder, ftype, current_lang)
        if command_key == 'make_drawing':
            return await media_processor.make_drawing(current_lang)
        if command_key == 'get_selected_text':
            return await media_processor.get_selected_text(current_lang)
        if command_key == 'narrate_screen':
            return await media_processor.narrate_screen(current_lang)
        if command_key == 'get_screen_summary':
            return await media_processor.get_screen_summary(current_lang)
        return None
