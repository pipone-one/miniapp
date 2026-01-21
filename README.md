# AI CARTEL COMMAND

Premium Telegram Mini App dashboard for AI model management.

## Structure

- backend: FastAPI + Aiogram service
- frontend: React + Vite + Tailwind + Framer Motion

## Quick Start

- Backend: `cd backend && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload`
- Frontend: `cd frontend && npm install && npm run dev`

## Environment

- Backend: copy `backend/.env.example` to `backend/.env`
- Frontend: copy `frontend/.env.example` to `frontend/.env` (можно оставить `VITE_API_BASE_URL` пустым)

## Telegram Mini App

- Telegram WebApp SDK подключен в `frontend/index.html`
- В WebView автоматически вызываются `tg.ready()` и `tg.expand()`
- Safe-area отступы включены через класс `tma-shell`
- Для локального теста через один публичный URL используется proxy `/api` → `http://localhost:8000`

## API Endpoints

- `GET /health/check?verify=true` key health check
- `POST /marketing/hooks` generate Grok hooks
- `POST /planning/brief` generate GPT-4o plans
- `GET /scheduler/windows` US windows in Kyiv time
- `POST /scheduler/notify` Telegram alert
- `GET/POST/PATCH /tasks` task CRUD
- `POST /tasks/voice` whisper voice task
- `GET/PATCH /models` model progress + status
- `GET/PATCH /accounts` platform account tracking
