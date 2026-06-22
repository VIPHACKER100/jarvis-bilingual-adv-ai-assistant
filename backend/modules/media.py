import os
import io
import base64
import asyncio
import shutil
import subprocess
import pyperclip
from pathlib import Path
from typing import Dict, List, Optional, Union, Any, cast
from PIL import Image, ImageFilter, ImageEnhance
import pytesseract
from PyPDF2 import PdfMerger, PdfReader, PdfWriter
from pdf2image import convert_from_path
import pyautogui

from modules.bilingual_parser import parser
from utils.platform_utils import is_windows, is_macos, is_linux
from utils.logger_structured import logger, log_command


class MediaProcessor:
    """OCR, PDF, and Image processing tools"""

    _TESSERACT_INSTALL_HINT = (
        "Install Tesseract OCR and add it to PATH "
        "(Windows: https://github.com/UB-Mannheim/tesseract/wiki, "
        "then add C:\\Program Files\\Tesseract-OCR)."
    )

    def __init__(self):
        self._tesseract_ready = self._configure_tesseract()

    def _configure_tesseract(self) -> bool:
        """Locate tesseract binary and verify it runs."""
        candidates = []
        if is_windows():
            candidates.extend([
                r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
            ])
        which_path = shutil.which('tesseract')
        if which_path:
            candidates.append(which_path)

        for path in candidates:
            if path and os.path.isfile(path):
                pytesseract.pytesseract.tesseract_cmd = path
                break

        try:
            pytesseract.get_tesseract_version()
            return True
        except Exception:
            return False

    def _tesseract_unavailable_response(self, action_type: str, language: str = 'en') -> Dict:
        msg_en = f"Tesseract OCR is not installed. {self._TESSERACT_INSTALL_HINT}"
        msg_hi = (
            "Tesseract OCR install nahi hai. "
            "Windows par install karke PATH mein add karein "
            "(C:\\Program Files\\Tesseract-OCR)."
        )
        return {
            'success': False,
            'action_type': action_type,
            'error': 'tesseract_not_found',
            'response': msg_hi if language == 'hi' else msg_en,
        }

    # ==================== OCR FUNCTIONS ====================

    async def extract_text_from_image(
            self,
            image_path: str,
            language: str = 'en') -> Dict:
        """Extract text from image file"""
        if not self._tesseract_ready:
            return self._tesseract_unavailable_response('OCR_IMAGE', language)
        try:
            path = Path(image_path).expanduser().resolve()

            if not path.exists():
                return {
                    'success': False,
                    'action_type': 'OCR_IMAGE',
                    'error': 'Image file not found',
                    'response': 'Image file not found'
                }

            # Open image asynchronously
            image = await asyncio.to_thread(Image.open, path)

            # Extract text (offload to thread pool as it's CPU intensive)
            text = await asyncio.to_thread(pytesseract.image_to_string, image)
            text = text.strip()

            log_command(f'OCR on {path.name}', 'ocr_image', True)

            return {
                'success': True,
                'action_type': 'OCR_IMAGE',
                'file': str(path),
                'text': text,
                'text_preview': text[:200] + '...' if len(text) > 200 else text,
                'response': f'Extracted {len(text)} characters from image'
            }

        except Exception as e:
            logger.error(f'Error extracting text from image: {e}')
            return {
                'success': False,
                'action_type': 'OCR_IMAGE',
                'error': str(e),
                'response': 'Failed to extract text from image'
            }

    async def extract_text_from_pdf(
            self,
            pdf_path: str,
            page_number: Optional[int] = None,
            language: str = 'en') -> Dict:
        """Extract text from PDF file"""
        try:
            path = Path(pdf_path).expanduser().resolve()

            if not path.exists():
                return {
                    'success': False,
                    'action_type': 'OCR_PDF',
                    'error': 'PDF file not found',
                    'response': 'PDF file not found'
                }

            # Try PyPDF2 first for text-based PDFs
            try:
                reader = PdfReader(str(path))
                text = ""

                if page_number is not None:
                    # Extract specific page
                    if 0 <= page_number < len(reader.pages):
                        text = await asyncio.to_thread(reader.pages[page_number].extract_text)
                    else:
                        return {
                            'success': False,
                            'action_type': 'OCR_PDF',
                            'error': f'Invalid page number. PDF has {len(reader.pages)} pages',
                            'response': 'Invalid page number'
                        }
                else:
                    # Extract all pages
                    for page in reader.pages:
                        page_text = await asyncio.to_thread(page.extract_text)
                        text += (page_text or "") + "\n"

                if text.strip():
                    log_command(f'PDF text extract from {path.name}', 'ocr_pdf', True)
                    return {
                        'success': True,
                        'action_type': 'OCR_PDF',
                        'file': str(path),
                        'text': text,
                        'text_preview': text[:200] + '...' if len(text) > 200 else text,
                        'pages': len(reader.pages),
                        'response': f'Extracted text from {len(reader.pages)} pages'
                    }
            except BaseException:
                pass  # Fall through to OCR

            if not self._tesseract_ready:
                return self._tesseract_unavailable_response('OCR_PDF', language)

            # Use OCR for scanned PDFs asynchronously
            def convert_pdf():
                return convert_from_path(
                    str(path),
                    first_page=page_number,
                    last_page=page_number)
            
            images = await asyncio.to_thread(convert_pdf)

            if not images:
                return {
                    'success': False,
                    'action_type': 'OCR_PDF',
                    'error': 'Could not convert PDF to images',
                    'response': 'Failed to process PDF'
                }

            text = ""
            for image in images:
                page_text = await asyncio.to_thread(pytesseract.image_to_string, image)
                text += page_text + "\n"

            log_command(f'OCR on PDF {path.name}', 'ocr_pdf', True)

            return {
                'success': True,
                'action_type': 'OCR_PDF',
                'file': str(path),
                'text': text,
                'text_preview': text[:200] + '...' if len(text) > 200 else text,
                'response': f'Extracted {len(text)} characters from PDF'
            }

        except Exception as e:
            logger.error(f'Error extracting text from PDF: {e}')
            return {
                'success': False,
                'action_type': 'OCR_PDF',
                'error': str(e),
                'response': 'Failed to extract text from PDF'
            }

    async def extract_text_from_screenshot(self, language: str = 'en') -> Dict:
        """Take screenshot, extract text, and categorize content"""
        if not self._tesseract_ready:
            return self._tesseract_unavailable_response('OCR_SCREENSHOT', language)
        try:
            # Take screenshot asynchronously
            screenshot = await asyncio.to_thread(pyautogui.screenshot)

            # Extract text
            text = await asyncio.to_thread(pytesseract.image_to_string, screenshot)
            text = text.strip()

            # Categorize the extracted text
            category_info = self.categorize_ocr_text(text)

            log_command('OCR on screenshot', 'ocr_screenshot', True)

            return {
                'success': True,
                'action_type': 'OCR_SCREENSHOT',
                'text': text,
                'category': category_info['category'],
                'confidence': category_info['confidence'],
                'text_preview': text[:200] + '...' if len(text) > 200 else text,
                'response': f'Extracted {len(text)} characters. Detected category: {category_info["category"]}'
            }

        except Exception as e:
            logger.error(f'Error extracting text from screenshot: {e}')
            return {
                'success': False,
                'action_type': 'OCR_SCREENSHOT',
                'error': str(e),
                'response': 'Failed to extract text from screen'
            }

    def categorize_ocr_text(self, text: str) -> Dict[str, Any]:
        """Categorize OCR text into workspace types (Code, Browser, Doc, etc.)"""
        text_lower = text.lower()
        
        # Keywords for categorization
        indicators = {
            'code': ['def ', 'import ', 'const ', 'function', 'class ', 'void ', '{', '}', 'public ', 'private '],
            'browser': ['http://', 'https://', 'www.', '.com', '.org', '.net', 'search', 'github', 'youtube'],
            'document': ['abstract', 'introduction', 'conclusion', 'section', 'table of contents', 'page ', 'chapter'],
            'terminal': ['$', '>', 'C:\\', '/home/', 'sudo ', 'apt ', 'npm ', 'git ', 'python ']
        }
        
        scores = {cat: 0 for cat in indicators}
        for cat, keywords in indicators.items():
            for kw in keywords:
                if kw in text_lower:
                    scores[cat] += 1
        
        # Determine the category with highest score
        best_cat = 'unknown'
        max_score = 0
        for cat, score in scores.items():
            if score > max_score:
                max_score = score
                best_cat = cat
        
        # Normalize confidence (simple heuristic)
        confidence = min(max_score / 3.0, 1.0) if max_score > 0 else 0.0
        
        return {
            'category': best_cat,
            'confidence': confidence,
            'scores': scores
        }

    async def analyze_screen(self, query: Optional[str] = None, language: str = 'en') -> Dict:
        """Capture screenshot and analyze it using a multimodal LLM"""
        try:
            from modules.llm_wrapper import llm_module
            from modules.desktop import desktop_manager
            
            # 1. Take a screenshot (saving to file for multimodal processing)
            screenshot_res = await desktop_manager.take_screenshot(save=True, language=language)
            if not screenshot_res.get('success'):
                return screenshot_res
            
            image_path = screenshot_res.get('file_path')
            
            # 2. Prepare prompt
            prompt = query or "Describe what is on my screen right now. Be specific about open windows, text, and any visible UI elements."
            if language == 'hi':
                prompt = query or "बताएं कि अभी मेरी स्क्रीन पर क्या है। खुले हुए विंडोज़, टेक्स्ट और यूआई एलिमेंट्स के बारे में विस्तार से बताएं।"
            
            # 3. Analyze with Vision LLM
            try:
                analysis = await llm_module.get_visual_response(image_path, prompt, language)
            except RuntimeError as ve:
                return {
                    'success': False,
                    'action_type': 'VISION_ANALYSIS',
                    'error': str(ve),
                    'response': str(ve)
                }
            
            if not analysis:
                return {
                    'success': False,
                    'action_type': 'VISION_ANALYSIS',
                    'error': 'Visual analysis failed or model returned empty response',
                    'response': 'I tried to look at your screen but couldn\'t process the image.'
                }
            
            log_command('Screen analysis', 'vision_analysis', True)
            
            return {
                'success': True,
                'action_type': 'VISION_ANALYSIS',
                'query': query,
                'response': analysis,
                'image_path': image_path
            }

        except Exception as e:
            logger.error(f'Error in screen analysis: {e}')
            return {
                'success': False,
                'action_type': 'VISION_ANALYSIS',
                'error': str(e),
                'response': 'An error occurred while analyzing your screen.'
            }

    # ==================== PDF TOOLS ====================

    async def merge_pdfs(
            self,
            pdf_files: List[str],
            output_path: str,
            language: str = 'en') -> Dict:
        """Merge multiple PDFs into one"""
        try:
            merger = PdfMerger()

            for pdf_file in pdf_files:
                path = Path(pdf_file).expanduser().resolve()
                if path.exists():
                    merger.append(str(path))

            output = Path(output_path).expanduser().resolve()
            await asyncio.to_thread(merger.write, str(output))
            await asyncio.to_thread(merger.close)

            log_command(f'merge {len(pdf_files)} PDFs', 'pdf_merge', True)

            return {
                'success': True,
                'action_type': 'PDF_MERGE',
                'output': str(output),
                'files_merged': len(pdf_files),
                'response': f'Merged {len(pdf_files)} PDFs into {output.name}'
            }

        except Exception as e:
            logger.error(f'Error merging PDFs: {e}')
            return {
                'success': False,
                'action_type': 'PDF_MERGE',
                'error': str(e),
                'response': 'Failed to merge PDFs'
            }

    async def split_pdf(
            self,
            pdf_path: str,
            pages: List[int],
            output_path: str,
            language: str = 'en') -> Dict:
        """Extract specific pages from PDF"""
        try:
            path = Path(pdf_path).expanduser().resolve()

            if not path.exists():
                return {
                    'success': False,
                    'action_type': 'PDF_SPLIT',
                    'error': 'PDF file not found',
                    'response': 'PDF file not found'
                }

            reader = PdfReader(str(path))
            writer = PdfWriter()

            for page_num in pages:
                if 0 <= page_num < len(reader.pages):
                    writer.add_page(reader.pages[page_num])

            output = Path(output_path).expanduser().resolve()
            def write_pdf():
                with open(output, 'wb') as output_file:
                    writer.write(output_file)
            
            await asyncio.to_thread(write_pdf)

            log_command(f'split PDF {path.name}', 'pdf_split', True)

            return {
                'success': True,
                'action_type': 'PDF_SPLIT',
                'output': str(output),
                'pages': len(pages),
                'response': f'Extracted {len(pages)} pages to {output.name}'
            }

        except Exception as e:
            logger.error(f'Error splitting PDF: {e}')
            return {
                'success': False,
                'action_type': 'PDF_SPLIT',
                'error': str(e),
                'response': 'Failed to split PDF'
            }

    async def pdf_to_images(
            self,
            pdf_path: str,
            output_folder: Optional[str] = None,
            dpi: int = 200,
            language: str = 'en') -> Dict:
        """Convert PDF pages to images"""
        try:
            path = Path(pdf_path).expanduser().resolve()

            if not path.exists():
                return {
                    'success': False,
                    'action_type': 'PDF_TO_IMAGES',
                    'error': 'PDF file not found',
                    'response': 'PDF file not found'
                }

            # Determine output folder
            if output_folder:
                output_dir = Path(output_folder).expanduser().resolve()
            else:
                output_dir = path.parent / f'{path.stem}_images'

            output_dir.mkdir(exist_ok=True)

            # Convert PDF to images asynchronously
            images = await asyncio.to_thread(convert_from_path, str(path), dpi=dpi)

            def save_images():
                saved_files = []
                for i, image in enumerate(images):
                    image_path = output_dir / f'page_{i + 1:03d}.png'
                    image.save(str(image_path), 'PNG')
                    saved_files.append(str(image_path))
                return saved_files
            
            saved_files = await asyncio.to_thread(save_images)

            log_command(f'PDF to images: {path.name}', 'pdf_to_images', True)

            return {
                'success': True,
                'action_type': 'PDF_TO_IMAGES',
                'output_folder': str(output_dir),
                'images_created': len(saved_files),
                'files': saved_files,
                'response': f'Converted PDF to {len(saved_files)} images'
            }

        except Exception as e:
            logger.error(f'Error converting PDF to images: {e}')
            return {
                'success': False,
                'action_type': 'PDF_TO_IMAGES',
                'error': str(e),
                'response': 'Failed to convert PDF to images'
            }

    async def images_to_pdf(
            self,
            image_paths: List[str],
            output_path: str,
            language: str = 'en') -> Dict:
        """Convert images to PDF"""
        try:
            def _open_images() -> list:
                imgs = []
                for img_path in image_paths:
                    p = Path(img_path).expanduser().resolve()
                    if p.exists():
                        img = Image.open(p)
                        if img.mode in ('RGBA', 'LA', 'P'):
                            img = img.convert('RGB')
                        imgs.append(img)
                return imgs

            images = await asyncio.to_thread(_open_images)

            if not images:
                return {
                    'success': False,
                    'action_type': 'IMAGES_TO_PDF',
                    'error': 'No valid images found',
                    'response': 'No valid images found'
                }

            output = Path(output_path).expanduser().resolve()

            def save_pdf():
                if len(images) > 1:
                    images[0].save(
                        str(output),
                        'PDF',
                        resolution=100.0,
                        save_all=True,
                        append_images=list(
                            images[i] for i in range(
                                1,
                                len(images))))
                else:
                    images[0].save(str(output), 'PDF', resolution=100.0)
                for img in images:
                    img.close()

            await asyncio.to_thread(save_pdf)

            log_command(f'images to PDF: {len(images)} images', 'images_to_pdf', True)

            return {
                'success': True,
                'action_type': 'IMAGES_TO_PDF',
                'output': str(output),
                'images': len(image_paths),
                'response': f'Created PDF from {len(image_paths)} images'
            }

        except Exception as e:
            logger.error(f'Error converting images to PDF: {e}')
            return {
                'success': False,
                'action_type': 'IMAGES_TO_PDF',
                'error': str(e),
                'response': 'Failed to create PDF'
            }

    # ==================== IMAGE TOOLS ====================

    async def convert_image(
            self,
            input_path: str,
            output_path: str,
            format: Optional[str] = None,
            language: str = 'en') -> Dict:
        """Convert image to different format"""
        try:
            path = Path(input_path).expanduser().resolve()

            if not path.exists():
                return {
                    'success': False,
                    'action_type': 'CONVERT_IMAGE',
                    'error': 'Image file not found',
                    'response': 'Image file not found'
                }

            def _open_and_convert():
                img = Image.open(path)
                suffix = str(Path(output_path).suffix)
                fmt = format or (suffix[1:].upper() if suffix else "PNG")
                if fmt.upper() in ('JPEG', 'JPG') and img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                return img, fmt

            image, fmt = await asyncio.to_thread(_open_and_convert)

            output = Path(output_path).expanduser().resolve()
            await asyncio.to_thread(image.save, str(output), fmt.upper())
            image.close()

            log_command(f'convert image {path.name} to {fmt}', 'convert_image', True)

            return {
                'success': True,
                'action_type': 'CONVERT_IMAGE',
                'input': str(path),
                'output': str(output),
                'format': fmt.upper(),
                'response': f'Converted {path.name} to {fmt.upper()}'
            }

        except Exception as e:
            logger.error(f'Error converting image: {e}')
            return {
                'success': False,
                'action_type': 'CONVERT_IMAGE',
                'error': str(e),
                'response': 'Failed to convert image'
            }

    async def resize_image(
            self,
            input_path: str,
            output_path: str,
            width: Optional[int] = None,
            height: Optional[int] = None,
            maintain_aspect: bool = True,
            language: str = 'en') -> Dict:
        """Resize image dimensions"""
        try:
            path = Path(input_path).expanduser().resolve()

            if not path.exists():
                return {
                    'success': False,
                    'action_type': 'RESIZE_IMAGE',
                    'error': 'Image file not found',
                    'response': 'Image file not found'
                }

            def _open_and_resize():
                img = Image.open(path)
                original = img.size
                if maintain_aspect and (width and height):
                    img.thumbnail((width, height), Image.Resampling.LANCZOS)
                elif width and height:
                    img = img.resize((width, height), Image.Resampling.LANCZOS)
                elif width:
                    ratio = width / original[0]
                    h = int(original[1] * ratio)
                    img = img.resize((width, h), Image.Resampling.LANCZOS)
                elif height:
                    ratio = height / original[1]
                    w = int(original[0] * ratio)
                    img = img.resize((w, height), Image.Resampling.LANCZOS)
                return img, original

            image, original_size = await asyncio.to_thread(_open_and_resize)

            if not width and not height:
                return {
                    'success': False,
                    'action_type': 'RESIZE_IMAGE',
                    'error': 'Width or height required',
                    'response': 'Please specify width or height'
                }

            output = Path(output_path).expanduser().resolve()
            await asyncio.to_thread(image.save, str(output))
            new_size = image.size
            image.close()

            log_command(f'resize image {path.name}', 'resize_image', True)

            return {
                'success': True,
                'action_type': 'RESIZE_IMAGE',
                'input': str(path),
                'output': str(output),
                'original_size': original_size,
                'new_size': new_size,
                'response': f'Resized from {original_size} to {new_size}'
            }

        except Exception as e:
            logger.error(f'Error resizing image: {e}')
            return {
                'success': False,
                'action_type': 'RESIZE_IMAGE',
                'error': str(e),
                'response': 'Failed to resize image'
            }

    async def compress_image(
            self,
            input_path: str,
            output_path: str,
            quality: int = 85,
            language: str = 'en') -> Dict:
        """Compress image file size"""
        try:
            path = Path(input_path).expanduser().resolve()

            if not path.exists():
                return {
                    'success': False,
                    'action_type': 'COMPRESS_IMAGE',
                    'error': 'Image file not found',
                    'response': 'Image file not found'
                }

            original_size = path.stat().st_size
            output = Path(output_path).expanduser().resolve()

            def do_compress():
                image = Image.open(path)
                if path.suffix.lower() in ['.jpg', '.jpeg']:
                    image.save(str(output), 'JPEG', quality=quality, optimize=True)
                elif path.suffix.lower() == '.png':
                    image.save(str(output), 'PNG', optimize=True)
                else:
                    image.save(str(output), optimize=True)
                image.close()

            await asyncio.to_thread(do_compress)

            new_size = output.stat().st_size
            reduction = ((original_size - new_size) / original_size) * 100

            log_command(f'compress image {path.name}', 'compress_image', True)

            return {
                'success': True,
                'action_type': 'COMPRESS_IMAGE',
                'input': str(path),
                'output': str(output),
                'original_size': original_size,
                'new_size': new_size,
                'reduction_percent': float(
                    round(
                        reduction,
                        1)) if reduction >= 0 else 0.0,
                'response': f'Compressed by {reduction:.1f}% ({self._format_size(original_size)} → {self._format_size(new_size)})'}

        except Exception as e:
            logger.error(f'Error compressing image: {e}')
            return {
                'success': False,
                'action_type': 'COMPRESS_IMAGE',
                'error': str(e),
                'response': 'Failed to compress image'
            }

    async def batch_images_to_pdf(
            self,
            source_folder: str,
            output_name: str = "batch_images.pdf",
            language: str = 'en') -> Dict:
        """Convert all images in a folder to a single PDF"""
        try:
            folder = Path(source_folder).expanduser().resolve()
            if not folder.exists() or not folder.is_dir():
                return {
                    'success': False,
                    'error': 'Folder not found',
                    'response': 'Source folder not found'}

            image_extensions = ['.png', '.jpg', '.jpeg', '.bmp', '.gif']
            image_paths = [str(f) for f in folder.iterdir()
                           if f.suffix.lower() in image_extensions]

            if not image_paths:
                return {'success': False, 'error': 'No images found',
                        'response': 'No images found in the specified folder'}

            output_path = folder / output_name
            return await self.images_to_pdf(image_paths, str(output_path), language)
        except Exception as e:
            logger.error(f'Error in batch images to PDF: {e}')
            return {'success': False, 'error': str(e)}

    async def scan_folder(
            self,
            folder_path: str,
            file_type: str = "all",
            language: str = 'en') -> Dict:
        """Scan folder for specific file types (media, pdf, etc.)"""
        try:
            folder = Path(folder_path).expanduser().resolve()
            if not folder.exists() or not folder.is_dir():
                return {'success': False, 'error': 'Folder not found'}

            extensions = {
                "media": [
                    '.png',
                    '.jpg',
                    '.jpeg',
                    '.mp4',
                    '.mp3',
                    '.wav',
                    '.mov'],
                "pdf": ['.pdf'],
                "doc": [
                    '.doc',
                    '.docx',
                    '.txt',
                    '.rtf'],
                "all": []}

            target_exts = extensions.get(file_type.lower(), [])
            found_files = []

            def do_scan():
                found_files = []
                for root, _, files in os.walk(folder):
                    for file in files:
                        if not target_exts or Path(
                                file).suffix.lower() in target_exts:
                            found_files.append({
                                'name': file,
                                'path': os.path.join(root, file),
                                'size': os.path.getsize(os.path.join(root, file))
                            })
                return found_files

            found_files = await asyncio.to_thread(do_scan)

            # Limit results for performance
            limited_files = list(found_files[i]
                                 for i in range(min(100, len(found_files))))

            return {
                'success': True,
                'action_type': 'SCAN_FOLDER',
                'folder': folder_path,
                'type': file_type,
                'files': limited_files,
                'count': len(found_files),
                'response': f'Found {len(found_files)} {file_type} files in {folder.name}'}
        except Exception as e:
            logger.error(f'Error scanning folder: {e}')
            return {'success': False, 'error': str(e)}

    async def make_drawing(self, language: str = 'en') -> Dict:
        """Open a drawing application (MS Paint fallback)"""
        try:
            def do_draw():
                if is_windows():
                    os.startfile('mspaint.exe')  # type: ignore
                elif is_macos():
                    subprocess.run(['open', '-a', 'Preview'])
                else:
                    subprocess.run(['pinta'])
            
            await asyncio.to_thread(do_draw)

            return {
                'success': True,
                'action_type': 'MAKE_DRAWING',
                'response': 'Drawing app opened'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    async def get_selected_text(self, language: str = 'en') -> Dict:
        """Get currently selected text on screen (via clipboard)"""
        try:
            # Press Ctrl+C (or Cmd+C) asynchronously
            def copy_to_clipboard():
                if is_macos():
                    pyautogui.hotkey('command', 'c')
                else:
                    pyautogui.hotkey('ctrl', 'c')
            
            await asyncio.to_thread(copy_to_clipboard)

            # Wait a bit for clipboard update
            await asyncio.sleep(0.5)

            selected_text = await asyncio.to_thread(pyperclip.paste)

            return {
                'success': True,
                'action_type': 'GET_SELECTED_TEXT',
                'text': selected_text,
                'response': f'Retrieved selected text: "{selected_text[:50]}..."'
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    async def read_pdf(
            self,
            pdf_path: str,
            page_number: Optional[int] = None,
            language: str = 'en') -> Dict:
        """Read PDF content aloud (via frontend TTS)"""
        result = await self.extract_text_from_pdf(pdf_path, page_number, language)
        if result['success']:
            text = result['text']
            # Limit text length for reading
            read_limit = 2000
            read_text = text[:read_limit] + \
                "..." if len(text) > read_limit else text

            return {
                'success': True,
                'action_type': 'READ_TEXT',
                'text': read_text,
                'file': pdf_path,
                'response': (
                    f"Reading PDF: {Path(pdf_path).name}"
                    if language == 'en'
                    else f"PDF पढ़ रहा हूँ: {Path(pdf_path).name}"
                )
            }
        return result

    async def narrate_screen(self, language: str = 'en') -> Dict:
        """Narrate what's currently on screen"""
        result = await self.extract_text_from_screenshot(language)
        if result['success']:
            text = result['text']
            if not text.strip():
                return {
                    'success': True,
                    'action_type': 'READ_TEXT',
                    'text': (
                        'The screen appears to be empty '
                        'or has no recognizable text.'
                    ),
                    'response': 'Screen is empty'
                }

            # Narrate the text
            return {
                'success': True,
                'action_type': 'READ_TEXT',
                'text': f"On your screen, I see: {text[:1000]}",
                'response': "Narrating screen content"
            }
        return result

    async def get_screen_summary(self, language: str = 'en') -> Dict:
        """Get a coherent summary of what's on screen using LLM"""
        from modules.llm_wrapper import llm_client
        
        result = await self.extract_text_from_screenshot(language)
        if result['success']:
            text = result['text']
            if not text.strip():
                return {'success': True, 'summary': "The screen appears empty.", 'response': "Screen summary: Empty."}
            
            # Use LLM to summarize
            prompt = f"The following text was extracted from a screenshot via OCR. Summarize what is on the screen in one or two clear sentences. Response language: {language}. Text: {text[:2000]}"
            summary = await llm_client.get_response(prompt, language)
            
            return {
                'success': True,
                'summary': summary,
                'response': f"Screen summary: {summary}"
            }
        return result

    async def analyze_screen(self, query: str, language: str = 'en') -> Dict:
        """Answer a specific question about the current screen content"""
        from modules.llm_wrapper import llm_client
        
        result = await self.extract_text_from_screenshot(language)
        if result['success']:
            text = result['text']
            
            prompt = f"The following text was extracted from a screenshot via OCR. Based ONLY on this text, answer the user's question: '{query}'. Response language: {language}. If you cannot find the answer, say so. Text: {text[:3000]}"
            answer = await llm_client.get_response(prompt, language)
            
            return {
                'success': True,
                'answer': answer,
                'response': answer
            }
        return result

    async def draw_shape(
            self,
            shape: str = "circle",
            language: str = 'en') -> Dict:
        """Draw a simple shape using mouse automation"""
        try:
            import math

            # Start position (center of screen)
            sw, sh = pyautogui.size()
            cx, cy = sw // 2, sh // 2

            pyautogui.moveTo(cx, cy)
            pyautogui.mouseDown()

            if shape.lower() == "circle":
                radius = 100
                for i in range(0, 361, 10):
                    angle = math.radians(i)
                    x = cx + radius * math.cos(angle)
                    y = cy + radius * math.sin(angle)
                    pyautogui.moveTo(x, y)
            elif shape.lower() == "square":
                size = 200
                pyautogui.dragRel(size, 0)
                pyautogui.dragRel(0, size)
                pyautogui.dragRel(-size, 0)
                pyautogui.dragRel(0, -size)

            pyautogui.mouseUp()

            return {
                'success': True,
                'action_type': 'DRAW_SHAPE',
                'shape': shape,
                'response': f"Drew a {shape}"
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def _format_size(self, size_bytes: int) -> str:
        """Format bytes to human readable"""
        for unit in ['B', 'KB', 'MB']:
            if size_bytes < 1024:
                return f'{size_bytes:.1f} {unit}'
            size_bytes = int(size_bytes / 1024)
        return f'{size_bytes:.1f} GB'


# Singleton instance
media_manager = MediaProcessor()
media_processor = media_manager
