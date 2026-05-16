# Command Test Matrix

**Date:** 2026-05-16  
**Registry:** `backend/config/commands.py` → `HINDI_COMMANDS`  
**Total command keys:** 90

## Summary

| Metric | Count | % |
|--------|-------|---|
| Parser matches expected key (sample phrase) | 80 | 89% |
| Has `dispatch_command` branch | 89 | 99% |
| Fully OK (parse + dispatch) | 79 | 88% |
| Parser mismatch | 10 | 11% |
| Missing dispatch only | 1 | 1% |

**Method:** For each command key, the first ASCII phrase (≥4 chars) was sent to `BilingualParser.parse_command()`. Dispatch presence was verified in `handlers/command_handler.py`.

---

## Parser collisions (action required)

These short or overlapping phrases map to the **wrong** command:

| Expected key | Sample phrase | Parsed as | Severity | Cause |
|--------------|---------------|-----------|----------|-------|
| `time` | `time` | `uptime` | High | `uptime` contains substring `time` |
| `open_app` | `open` | `open_folder` | High | `open folder` phrase longer match |
| `close_app` | `close` | `close_window` | High | `close window` wins over `close` |
| `click` | `click` | `right_click` | High | `right click` contains `click` |
| `press_key` | `press` | `compress_image` | Medium | `compress` fuzzy/substring |
| `open_downloads` | `open downloads` | `open_documents` | High | Config typo: `open_documents` lists `'open downloads'` |
| `move_file` | `move file` | `delete_file` | High | `delete file` fuzzy overlap |
| `extract_text` | `extract text` | `ocr_image` | Low | Related OCR alias (acceptable) |
| `images_to_pdf` | `images to pdf` | `batch_pdf` | Medium | Shared phrases in registry |
| `copy` | `copy` | `get_selected_text` | High | `copy text` / selection phrases |

### Missing dispatch

| Key | Sample | Parsed | Issue |
|-----|--------|--------|-------|
| `command_insights` | `command insights` | `command_insights` | Parses correctly but **no** `dispatch_command` branch → falls through to autonomous agent |

**REST workaround:** `GET /api/v1/system/command-insights` and UI `CommandInsights.tsx` work.

---

## Full command matrix (by category)

Legend: **OK** = parse + dispatch | **MISMATCH** = wrong parse | **NO_DISPATCH** = parse OK, no handler

### Power & system

| Key | Sample phrase | Parsed | Dispatch | Status |
|-----|---------------|--------|----------|--------|
| shutdown | shutdown | shutdown | Yes | OK |
| restart | restart | restart | Yes | OK |
| sleep | sleep | sleep | Yes | OK |
| time | time | uptime | Yes | MISMATCH |
| date | date | date | Yes | OK |
| battery | battery | battery | Yes | OK |
| system_status | system status | system_status | Yes | OK |
| ip_address | ip address | ip_address | Yes | OK |
| uptime | uptime | uptime | Yes | OK |
| weather | weather | weather | Yes | OK |

### Volume & brightness

| Key | Sample | Parsed | Dispatch | Status |
|-----|--------|--------|----------|--------|
| volume_up | volume up | volume_up | Yes | OK |
| volume_down | volume down | volume_down | Yes | OK |
| mute | mute | mute | Yes | OK |
| brightness_up | brightness up | brightness_up | Yes | OK |
| brightness_down | brightness down | brightness_down | Yes | OK |

### Apps & windows

| Key | Sample | Parsed | Dispatch | Status |
|-----|--------|--------|----------|--------|
| open_app | open | open_folder | Yes | MISMATCH |
| close_app | close | close_window | Yes | MISMATCH |
| minimize | minimize | minimize | Yes | OK |
| maximize | maximize | maximize | Yes | OK |
| close_window | close window | close_window | Yes | OK |
| show_desktop | show desktop | show_desktop | Yes | OK |
| snap_left | snap left | snap_left | Yes | OK |
| snap_right | snap right | snap_right | Yes | OK |

### WhatsApp

| Key | Sample | Parsed | Dispatch | Status |
|-----|--------|--------|----------|--------|
| whatsapp_message | whatsapp | whatsapp_message | Yes | OK |
| whatsapp_call | call | whatsapp_call | Yes | OK |
| whatsapp_draft_reply | draft a reply | whatsapp_draft_reply | Yes | OK |

### Input control

| Key | Sample | Parsed | Dispatch | Status |
|-----|--------|--------|----------|--------|
| move_cursor | move cursor | move_cursor | Yes | OK |
| click | click | right_click | Yes | MISMATCH |
| double_click | double click | double_click | Yes | OK |
| right_click | right click | right_click | Yes | OK |
| scroll_up | scroll up | scroll_up | Yes | OK |
| scroll_down | scroll down | scroll_down | Yes | OK |
| type_text | type | type_text | Yes | OK |
| press_key | press | compress_image | Yes | MISMATCH |
| hotkey | hotkey | hotkey | Yes | OK |

### Browser shortcuts

| Key | Sample | Parsed | Dispatch | Status |
|-----|--------|--------|----------|--------|
| new_tab | new tab | new_tab | Yes | OK |
| close_tab | close tab | close_tab | Yes | OK |
| new_window | new window | new_window | Yes | OK |
| find | find on page | find | Yes | OK |
| copy | copy | get_selected_text | Yes | MISMATCH |
| paste | paste | paste | Yes | OK |
| select_all | select all | select_all | Yes | OK |
| undo | undo | undo | Yes | OK |
| save | save | save | Yes | OK |

### Files

| Key | Sample | Parsed | Dispatch | Status |
|-----|--------|--------|----------|--------|
| open_folder | open folder | open_folder | Yes | OK |
| open_downloads | open downloads | open_documents | Yes | MISMATCH |
| open_documents | open downloads | open_documents | Yes | OK (config bug) |
| open_desktop | open desktop | open_desktop | Yes | OK |
| open_pictures | open pictures | open_pictures | Yes | OK |
| open_videos | open videos | open_videos | Yes | OK |
| open_music | open music | open_music | Yes | OK |
| open_home | open home | open_home | Yes | OK |
| search_files | search file | search_files | Yes | OK |
| create_folder | create folder | create_folder | Yes | OK |
| delete_file | delete file | delete_file | Yes | OK |
| copy_file | copy file | copy_file | Yes | OK |
| move_file | move file | delete_file | Yes | MISMATCH |
| rename_file | rename file | rename_file | Yes | OK |

### Media & OCR

| Key | Sample | Parsed | Dispatch | Status |
|-----|--------|--------|----------|--------|
| ocr_image | extract text from image | ocr_image | Yes | OK |
| ocr_pdf | extract text from pdf | ocr_pdf | Yes | OK |
| extract_text | extract text | ocr_image | Yes | MISMATCH (alias) |
| convert_image | convert image | convert_image | Yes | OK |
| resize_image | resize image | resize_image | Yes | OK |
| compress_image | compress image | compress_image | Yes | OK |
| merge_pdfs | merge pdfs | merge_pdfs | Yes | OK |
| pdf_to_images | pdf to images | pdf_to_images | Yes | OK |
| images_to_pdf | images to pdf | batch_pdf | Yes | MISMATCH |
| batch_pdf | images to pdf | batch_pdf | Yes | OK |
| scan_folder | scan folder | scan_folder | Yes | OK |
| make_drawing | make drawing | make_drawing | Yes | OK |
| get_selected_text | get selected text | get_selected_text | Yes | OK |

### Desktop

| Key | Sample | Parsed | Dispatch | Status |
|-----|--------|--------|----------|--------|
| take_screenshot | take screenshot | take_screenshot | Yes | OK |
| get_clipboard | get clipboard | get_clipboard | Yes | OK |
| set_clipboard | set clipboard | set_clipboard | Yes | OK |
| media_play | play media | media_play | Yes | OK |
| media_next | next track | media_next | Yes | OK |
| media_previous | previous track | media_previous | Yes | OK |
| stop_media | stop music | stop_media | Yes | OK |
| change_wallpaper | change wallpaper | change_wallpaper | Yes | OK |
| empty_recycle_bin | empty recycle bin | empty_recycle_bin | Yes | OK |
| toggle_taskbar | toggle taskbar | toggle_taskbar | Yes | OK |
| zoom_in | zoom in | zoom_in | Yes | OK |
| zoom_out | zoom out | zoom_out | Yes | OK |

### Search & AI screen

| Key | Sample | Parsed | Dispatch | Status |
|-----|--------|--------|----------|--------|
| google_search | search | google_search | Yes | OK |
| open_browser | open browser | open_browser | Yes | OK |
| narrate_screen | narrate screen | narrate_screen | Yes | OK |
| get_screen_summary | screen summary | get_screen_summary | Yes | OK |
| analyze_screen | analyze screen | analyze_screen | Yes | OK |

### Personality & analytics

| Key | Sample | Parsed | Dispatch | Status |
|-----|--------|--------|----------|--------|
| set_personality | set personality | set_personality | Yes | OK |
| command_insights | command insights | command_insights | **No** | NO_DISPATCH |

---

## Dispatch-only keys (voice phrases missing)

These run in `dispatch_command` but are **not** in `HINDI_COMMANDS`:

| Key | Notes |
|-----|-------|
| `read_file` | File read |
| `toggle_desktop_icons` | Desktop icons toggle |
| `set_theme` | OS theme |
| `what_is_on_my_screen` | Alias of `analyze_screen` |
| `save_memory` | Save neural node |
| `list_memories` | List neural nodes |

---

## Param-sensitive commands

Voice often passes a **string**; these handlers expect a **dict** and may return `UNKNOWN` without structured params:

`copy_file`, `move_file`, `rename_file`, `convert_image`, `resize_image`, `compress_image`, `merge_pdfs`, `images_to_pdf`, `move_cursor`

**Recommendation:** Normalize string params in `handle_command` before `dispatch_command`.

---

## Raw data

Full JSON: [parser_quick.json](./parser_quick.json)

Re-run:

```powershell
cd backend
python scripts/quick_parser_audit.py
```
