#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/dono-termux.sh" ] && [ -d "$SCRIPT_DIR/frontend" ]; then
  ROOT_DIR="$SCRIPT_DIR"
elif [ -f "$HOME/dono-school-erp/dono-termux.sh" ] && [ -d "$HOME/dono-school-erp/frontend" ]; then
  ROOT_DIR="$HOME/dono-school-erp"
else
  echo "Could not locate the DOONO project directory. Expected this script in the project root or ~/dono-school-erp."
  exit 1
fi
BACKEND_STARTED=0
FRONTEND_STARTED=0
BACKEND_LOG="${TMPDIR:-/tmp}/dono-laravel.log"
FRONTEND_LOG="${TMPDIR:-/tmp}/dono-vite.log"

cleanup() {
  if [ "$FRONTEND_STARTED" -eq 1 ] && [ -n "${FRONTEND_PID:-}" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [ "$BACKEND_STARTED" -eq 1 ] && [ -n "${BACKEND_PID:-}" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared is not available in this Termux environment."
  exit 1
fi

if curl -fsS --max-time 2 http://127.0.0.1:8000/up >/dev/null 2>&1; then
  echo "Laravel is already running on port 8000."
else
  echo "Starting Laravel through Debian PHP on port 8000..."
  (cd "$ROOT_DIR" && bash dono-termux.sh artisan serve --host=0.0.0.0 --port=8000) >"$BACKEND_LOG" 2>&1 &
  BACKEND_PID=$!
  BACKEND_STARTED=1
fi

if curl -fsS --max-time 2 http://127.0.0.1:5173 >/dev/null 2>&1; then
  echo "Vite is already running on port 5173."
else
  echo "Starting Vite on port 5173..."
  (cd "$ROOT_DIR/frontend" && npm run dev -- --host 0.0.0.0 --port 5173) >"$FRONTEND_LOG" 2>&1 &
  FRONTEND_PID=$!
  FRONTEND_STARTED=1
fi

for attempt in $(seq 1 40); do
  backend_ready=0
  frontend_ready=0
  curl -fsS --max-time 2 http://127.0.0.1:8000/up >/dev/null 2>&1 && backend_ready=1 || true
  curl -fsS --max-time 2 http://127.0.0.1:5173 >/dev/null 2>&1 && frontend_ready=1 || true
  if [ "$backend_ready" -eq 1 ] && [ "$frontend_ready" -eq 1 ]; then
    break
  fi
  if [ "$attempt" -eq 40 ]; then
    echo "The local servers did not become ready."
    echo "Laravel log: $BACKEND_LOG"
    echo "Vite log: $FRONTEND_LOG"
    tail -30 "$BACKEND_LOG" 2>/dev/null || true
    tail -30 "$FRONTEND_LOG" 2>/dev/null || true
    exit 1
  fi
  sleep 1
done

echo "Frontend and backend are running. Keep this Termux session open."
echo "Starting the temporary public Cloudflare tunnel..."
cloudflared tunnel --url http://127.0.0.1:5173
