---
description: Update persistent memory files at the end of a session
---

# Update Memory Hook

Run this workflow at the **end of every conversation session** to keep the persistent memory up to date.

// turbo-all

## Steps

1. **Read current memory files** to understand what's already stored:
   - `memory/personality.md` ← read first (your operating soul)
   - `memory/user.md`
   - `memory/preferences.md`
   - `memory/decisions.md`
   - `memory/people.md`

2. **Review the conversation** for new information:
   - Were any architectural or design decisions made? → Update `memory/decisions.md`
   - Were any new people or collaborators mentioned? → Update `memory/people.md`
   - Did the user express new preferences (coding style, tooling, workflow)? → Update `memory/preferences.md`
   - Did the user share new personal info, projects, or skills? → Update `memory/user.md`
   - Did new behavioral patterns or decision-making tendencies emerge? → Update `memory/personality.md`

3. **Append new entries** using the templates defined in each file. Follow these rules:
   - **Never delete** existing entries unless the user explicitly asks
   - Use the date format `YYYY-MM-DD` for decision entries
   - Keep entries concise — bullet points over paragraphs
   - Only update files that have genuinely new information to add

4. **Confirm the update** by briefly telling the user what was updated (or that no updates were needed).
