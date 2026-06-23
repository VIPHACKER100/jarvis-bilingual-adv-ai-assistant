"""
JARVIS v3.9.0 — Tool Registry for Autonomous Agent
Defines all available system tools that the Agent can invoke.
"""

AVAILABLE_TOOLS = [
    {
        "name": "system_status",
        "description": "Get current system metrics (CPU, RAM, Battery, Uptime).",
        "parameters": {},
    },
    {
        "name": "google_search",
        "description": "Search the web for information using Google.",
        "parameters": {
            "type": "object",
            "properties": {"query": {"type": "string", "description": "The search query."}},
            "required": ["query"],
        },
    },
    {
        "name": "open_app",
        "description": "Open a specific application or file.",
        "parameters": {
            "type": "object",
            "properties": {"app": {"type": "string", "description": "Name of the app or path to file."}},
            "required": ["app"],
        },
    },
    {
        "name": "close_app",
        "description": "Close a specific application by name.",
        "parameters": {
            "type": "object",
            "properties": {"app": {"type": "string", "description": "Name of the app (e.g., 'chrome', 'notepad')."}},
            "required": ["app"],
        },
    },
    {
        "name": "whatsapp_message",
        "description": "Send a WhatsApp message to a contact.",
        "parameters": {
            "type": "object",
            "properties": {
                "contact": {"type": "string", "description": "Name of the contact or phone number."},
                "message": {"type": "string", "description": "The message content."},
            },
            "required": ["contact", "message"],
        },
    },
    {
        "name": "take_screenshot",
        "description": "Capture the current screen. Returns path to the screenshot.",
        "parameters": {},
    },
    {
        "name": "search_files",
        "description": "Search for files on the computer by name or extension.",
        "parameters": {
            "type": "object",
            "properties": {"query": {"type": "string", "description": "Filename or keyword to search for."}},
            "required": ["query"],
        },
    },
    {
        "name": "read_file",
        "description": "Read the content of a text-based file. Use this to inspect code, logs, or documents.",
        "parameters": {
            "type": "object",
            "properties": {"path": {"type": "string", "description": "Absolute path to the file."}},
            "required": ["path"],
        },
    },
    {
        "name": "analyze_screen",
        "description": "Answer a specific question about what is currently visible on the screen.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The question about the screen content (e.g., 'What error is shown?').",
                }
            },
            "required": ["query"],
        },
    },
    {
        "name": "get_screen_summary",
        "description": "Get a high-level summary of what is currently on the screen.",
        "parameters": {},
    },
    {
        "name": "narrate_screen",
        "description": "Read out the content of the screen for accessibility.",
        "parameters": {},
    },
    {
        "name": "ocr_image",
        "description": "Extract text from an image or screenshot.",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Path to image. If omitted, takes a screenshot first."}
            },
        },
    },
    {"name": "get_clipboard", "description": "Get current text content from the system clipboard.", "parameters": {}},
    {
        "name": "set_clipboard",
        "description": "Copy specific text to the system clipboard.",
        "parameters": {
            "type": "object",
            "properties": {"text": {"type": "string", "description": "Text to copy."}},
            "required": ["text"],
        },
    },
    {"name": "get_time", "description": "Get the current time and date.", "parameters": {}},
    {
        "name": "save_memory",
        "description": "Save a persistent fact, note, or preference to JARVIS's neural memory.",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Short descriptive title (e.g., 'user_birthday')"},
                "content": {"type": "string", "description": "The information to remember."},
            },
            "required": ["title", "content"],
        },
    },
    {
        "name": "list_memories",
        "description": "List all stored memory nodes to see what JARVIS currently knows.",
        "parameters": {},
    },
]


def get_tools_prompt() -> str:
    """Format tools list for the LLM system prompt."""
    import json

    return json.dumps(AVAILABLE_TOOLS, indent=2)
