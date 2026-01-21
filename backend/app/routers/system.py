from fastapi import APIRouter, Depends
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session, seed_defaults
from app.models import TaskLog, Task, Niche, ModelStatus, AccountPlatform, BotUser

router = APIRouter(prefix="/system", tags=["system"])


@router.post("/reset")
async def reset_system(session: AsyncSession = Depends(get_session)):
    """
    DANGER: Wipes all data and reseeds defaults.
    """
    # Delete in order of dependencies (child first)
    await session.execute(delete(TaskLog))
    await session.execute(delete(Task))
    await session.execute(delete(Niche))
    
    # Delete legacy/other tables
    await session.execute(delete(ModelStatus))
    await session.execute(delete(AccountPlatform))
    await session.execute(delete(BotUser))
    
    await session.commit()
    
    # Re-seed
    await seed_defaults()
    
    return {"status": "system_reset_complete"}
