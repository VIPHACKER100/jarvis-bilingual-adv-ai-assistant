# Security Policy

## Supported Versions

The JARVIS Advanced AI Assistant team is committed to addressing security vulnerabilities in our active releases.

| Version | Supported          | Notes |
| ------- | ------------------ | ----- |
| 4.0.0-alpha.x | :white_check_mark: | Latest development release (219/219 tests passing) |
| 3.9.x   | :white_check_mark: | Latest stable production release |
| 3.8.x   | :white_check_mark: | Maintained |
| 3.7.x   | :x:                | Deprecated |
| < 3.7   | :x:                | Deprecated |

## Reporting a Vulnerability

We take the security of JARVIS and our users very seriously. If you discover a security vulnerability in JARVIS, please do NOT create a public issue.

Instead, please send an email to **<viphacker.100.org@gmail.com>**.

### What to include

Please provide the following details in your report:

* Description of the vulnerability
* Steps to reproduce the vulnerability
* Potential impact of the vulnerability
* Your JARVIS version (e.g., `4.0.0-alpha.4`) and operating system

### Response Time

You can expect an initial acknowledgement within 48 hours. We will keep you updated as we investigate and develop a remediation plan.

## API Key Security

JARVIS uses external API keys (OpenAI, NVIDIA NIM, OpenRouter) for its Language Learning Models.

**Never commit your `config.env` or `config.json` files containing live API keys to a public repository.** We have configured the `.gitignore` to prevent this, but please remain vigilant. If your API keys are compromised, revoke them immediately from your provider's dashboard.
