from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db, seed_defaults
from app.routers.health import router as health_router
from app.routers.accounts import router as accounts_router
from app.routers.marketing import router as marketing_router
from app.routers.models import router as models_router
from app.routers.planning import router as planning_router
from app.routers.scheduler import router as scheduler_router
from app.routers.tasks import router as tasks_router
from app.scheduler_worker import scheduler_worker


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(accounts_router)
app.include_router(marketing_router)
app.include_router(models_router)
app.include_router(planning_router)
app.include_router(scheduler_router)
app.include_router(tasks_router)


@app.get("/")
async def root() -> dict:
    return {"status": "online", "service": settings.app_name}


@app.on_event("startup")
async def startup() -> None:
    await init_db()
    await seed_defaults()
    scheduler_worker.start()
