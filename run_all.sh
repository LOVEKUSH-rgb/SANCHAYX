#!/usr/bin/env bash
# SANCHAY Full Stack Runner for Bash (Git Bash / WSL / Linux / macOS)

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================================="
echo "  Launching SANCHAY Platform (Backend + Frontend)"
echo "======================================================="

cleanup() {
    echo ""
    echo "Shutting down SANCHAY servers..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Detect Python in venv
PYTHON_CMD="python"
if [ -f "$PROJECT_ROOT/.venv/Scripts/python.exe" ]; then
    PYTHON_CMD="$PROJECT_ROOT/.venv/Scripts/python.exe"
elif [ -f "$PROJECT_ROOT/.venv/bin/python" ]; then
    PYTHON_CMD="$PROJECT_ROOT/.venv/bin/python"
elif [ -f "$PROJECT_ROOT/backend/venv/Scripts/python.exe" ]; then
    PYTHON_CMD="$PROJECT_ROOT/backend/venv/Scripts/python.exe"
elif [ -f "$PROJECT_ROOT/backend/venv/bin/python" ]; then
    PYTHON_CMD="$PROJECT_ROOT/backend/venv/bin/python"
fi

echo "Using Python: $PYTHON_CMD"

# Verify uvicorn is installed, else install
if ! "$PYTHON_CMD" -c "import uvicorn" 2>/dev/null; then
    echo "Uvicorn not found. Installing requirements..."
    if [ -f "$PROJECT_ROOT/backend/venv/Scripts/pip.exe" ]; then
        "$PROJECT_ROOT/backend/venv/Scripts/pip.exe" install -r "$PROJECT_ROOT/backend/requirements.txt"
    else
        pip install -r "$PROJECT_ROOT/backend/requirements.txt"
    fi
fi

# Start Backend
echo "Starting Backend (FastAPI on http://127.0.0.1:8000)..."
cd "$PROJECT_ROOT/backend"
"$PYTHON_CMD" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &

# Wait briefly for backend to initialize
sleep 2

# Start Frontend
echo "Starting Frontend (Vite on http://localhost:3003)..."
cd "$PROJECT_ROOT"
npm run dev &

echo ""
echo "======================================================="
echo "  SANCHAY is running!"
echo "  Frontend: http://localhost:3003"
echo "  Backend:  http://127.0.0.1:8000"
echo "  API Docs: http://127.0.0.1:8000/docs"
echo "  Press Ctrl+C to stop both servers."
echo "======================================================="

wait
