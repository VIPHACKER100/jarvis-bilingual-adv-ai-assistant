@echo off
chcp 65001 >nul
title JARVIS AI Assistant
echo.
echo ╔═══════════════════════════════════════╗
echo ║     JARVIS AI Assistant v2.0          ║
echo ║     Made by VIPHACKER100              ║
echo ╚═══════════════════════════════════════╝
echo.
echo Starting JARVIS Backend...
start "" "%~dp0backend\JARVIS_Backend.exe"
echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend...
start "" "http://localhost:8000"
echo.
echo JARVIS is starting in your browser!
echo.
echo Press any key to stop JARVIS...
pause >nul
taskkill /F /IM JARVIS_Backend.exe 2>nul
echo.
echo JARVIS stopped. Goodbye!
timeout /t 2 >nul
