@echo off
title Launch SANCHAY Full Stack
echo =======================================================
echo   Launching SANCHAY Platform (Backend + Frontend)
echo =======================================================
start "SANCHAY Backend Server" cmd /k "%~dp0run_backend.bat"
timeout /t 2 /nobreak >nul
start "SANCHAY Frontend Server" cmd /k "%~dp0run_frontend.bat"
echo.
echo Both servers are launching in dedicated console windows!
echo Backend: http://127.0.0.1:8000 (API Docs at http://127.0.0.1:8000/docs)
echo Frontend: http://localhost:3003 (Auto-opens in browser)
echo.
pause
