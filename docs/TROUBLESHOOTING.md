# JARVIS Troubleshooting Guide

Common issues and their solutions for JARVIS Bilingual AI Assistant.

---

## 🚀 Backend Issues

### Server fails to start (Port 8000 in use)

- **Windows**: `netstat -ano | findstr :8000` then `taskkill /PID <PID> /F`
- **macOS/Linux**: `lsof -ti:8000 | xargs kill -9`
- **Solution**: Change `BACKEND_PORT` in your `.env` file.

### ModuleNotFoundError

- Ensure your virtual environment is active.
- Run `pip install -r requirements.txt --force-reinstall`.

---

## 🎙️ Voice & Commands

### JARVIS doesn't hear me

- Check browser microphone permissions (Chrome/Edge recommended).
- Ensure no other application is holding the microphone.
- Check Internet Connection (Web Speech API requires it for some languages).

### "I don't understand that command"

- Use simple keywords: "Open Chrome" instead of "Can you start the browser please".
- Check the EN/हिंदी toggle in the UI.

---

## 🖼️ Media & OCR

### OCR/Text Extraction fails

- Ensure Tesseract OCR is installed.
- **Windows**: Add `C:\Program Files\Tesseract-OCR` to your System PATH.
- Restart the backend after installation.

---

## 📦 Build & Release

### Launcher (START_JARVIS.bat) fails

- Ensure the `release` folder structure is intact.
- Check `config.env` exists in the same folder as the launcher.
- Check logs in `backend/logs/`.

---

## 📞 Still need help?

- Open an issue on [GitHub](https://github.com/VIPHACKER100/jarvis-bilingual-adv-ai-assistant/issues).
- Visit [viphacker100.com](https://viphacker100.com) for updates.
