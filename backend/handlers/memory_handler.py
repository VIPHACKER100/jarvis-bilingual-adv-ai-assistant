import re
from typing import Dict, Any, Optional
from modules.memory import memory_manager


class MemoryHandler:

    async def handle(self, command_key: str, params: Any, current_lang: str) -> Optional[Dict[str, Any]]:
        if command_key == 'save_memory':
            if isinstance(params, dict):
                title, content = params.get('title', ''), params.get('content', '')
                if title and content:
                    await memory_manager.save_node(title, content)
                    return {
                        'success': True, 'action_type': 'MEMORY_SAVE',
                        'response': f"I've saved that to my neural memory under '{title}', Sir." if current_lang == 'en'
                                    else f"मैंने इसे '{title}' के तहत अपनी याददाश्त में सहेज लिया है, सर।"
                    }

        if command_key == 'list_memories':
            nodes = await memory_manager.list_nodes()
            names = ", ".join(n['name'] for n in nodes)
            return {
                'success': True, 'action_type': 'MEMORY_LIST',
                'response': f"Here are the memory nodes I have: {names}" if names else "My neural memory is currently empty.",
                'data': nodes
            }

        if command_key == 'command_insights':
            days = 30
            if params:
                nums = re.findall(r'\d+', str(params))
                if nums:
                    days = min(int(nums[0]), 365)
            data = await memory_manager.get_command_insights(days)
            top = data.get('top_commands') or []
            if top:
                summary = ", ".join(f"{c['command_type']} ({c['count']})" for c in top[:3])
                response = (
                    f"Your top commands in the last {days} days: {summary}."
                    if current_lang == 'en'
                    else f"पिछले {days} दिनों में सबसे ज़्यादा: {summary}।"
                )
            else:
                response = (
                    "No command usage data yet, Sir."
                    if current_lang == 'en'
                    else "अभी कोई कमांड डेटा नहीं है, सर।"
                )
            return {'success': True, 'action_type': 'COMMAND_INSIGHTS', 'response': response, 'data': data}

        return None
