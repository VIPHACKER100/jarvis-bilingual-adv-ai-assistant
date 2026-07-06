# Security Policy

ponytail: trimmed from 38 to ~18 lines — removed version table and detailed response timeline

## Reporting a Vulnerability

Do **not** create a public issue. Email **<viphacker.100.org@gmail.com>** with:
- Description and steps to reproduce
- Potential impact
- JARVIS version and OS

You'll receive an acknowledgement within 48 hours.

## API Key Security

Never commit `.env` files containing live API keys. We've configured `.gitignore` to prevent this, but remain vigilant. Revoke compromised keys immediately.
