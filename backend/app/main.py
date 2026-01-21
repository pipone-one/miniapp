from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.config import settings
from app.db import init_db, seed_defaults
from app.routers.health import router as health_router
from app.routers.accounts import router as accounts_router
from app.routers.marketing import router as marketing_router
from app.routers.models import router as models_router
from app.routers.planning import router as planning_router
from app.routers.scheduler import router as scheduler_router
from app.routers.tasks import router as tasks_router
from app.routers.niches import router as niches_router
from app.routers.banana import router as banana_router
from app.scheduler_worker import scheduler_worker


app = FastAPI(title=settings.app_name)

REPO_ROOT = Path(__file__).resolve().parents[2]
FRONTEND_DIST = REPO_ROOT / "frontend" / "dist"
INDEX_FILE = FRONTEND_DIST / "index.html"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(niches_router)  # New
app.include_router(tasks_router)
app.include_router(accounts_router)
app.include_router(marketing_router)
app.include_router(models_router)
app.include_router(planning_router)
app.include_router(scheduler_router)
app.include_router(banana_router)


@app.get("/", include_in_schema=False)
async def root():
    if INDEX_FILE.is_file():
        return FileResponse(INDEX_FILE)
    return {"status": "online", "service": settings.app_name}


@app.get("/{full_path:path}", include_in_schema=False)
async def spa_fallback(full_path: str):
    if not INDEX_FILE.is_file():
        raise HTTPException(status_code=404, detail="Not Found")

    requested = (FRONTEND_DIST / full_path).resolve()
    if FRONTEND_DIST in requested.parents and requested.is_file():
        return FileResponse(requested)

    return FileResponse(INDEX_FILE)


@app.on_event("startup")
async def startup() -> None:
    await init_db()
    await seed_defaults()
    # scheduler_worker.start() # Disabled for now as we rebuild logic
    
    # Start Telegram Bot in background
    import asyncio
    from app.bot_runner import start_bot
    asyncio.create_task(start_bot())
