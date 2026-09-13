@echo off
title SANCHAY Backend (FastAPI)
cd /d "%~dp0backend"

echo =======================================================
echo   SANCHAY Master Backend Server (FastAPI + Mongo Engine)
echo   Listening on: http://127.0.0.1:8000
echo   API Docs: http://127.0.0.1:8000/docs
echo =======================================================

REM 1. Try root .venv if it exists
if exist "..\.venv\Scripts\python.exe" (
    echo Using root .venv Python environment...
    "..\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
    pause
    exit /b
)

REM 2. Try backend/venv if it exists
if exist "venv\Scripts\python.exe" (
    echo Using backend/venv Python environment...
    "venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
    if %errorlevel% neq 0 (
        echo Installing dependencies into venv...
        "venv\Scripts\pip.exe" install -r requirements.txt
        "venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
    )
    pause
    exit /b
)

REM 2. Try global python
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Uvicorn is not installed in global python.
    echo Installing requirements.txt now...
    pip install -r requirements.txt
    echo.
    echo Restarting backend...
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
)
pause
