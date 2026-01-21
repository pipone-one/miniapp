from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.db import get_session
from app.models import Task, TaskLog, TaskStatus, UserProfile
from app.schemas import TaskCreate, TaskRead, TaskUpdate, TaskLogCreate, TaskLogResponse, UserProfileRead, StatsResponse


router = APIRouter(prefix="/tasks", tags=["tasks"])


def get_today_str() -> str:
    """Returns today's date string in the configured timezone."""
    tz = ZoneInfo(settings.timezone)
    return datetime.now(tz).strftime("%Y-%m-%d")


@router.post("/", response_model=TaskRead)
async def create_task(payload: TaskCreate, session: AsyncSession = Depends(get_session)) -> TaskRead:
    task = Task(**payload.model_dump())
    session.add(task)
    await session.commit()
    await session.refresh(task)
    # Eager load niche for response
    result = await session.execute(
        select(Task).where(Task.id == task.id).options(selectinload(Task.niche))
    )
    return result.scalar_one()


@router.get("/", response_model=list[TaskRead])
async def list_tasks(
    niche_id: int | None = None, 
    archived: bool = False,
    session: AsyncSession = Depends(get_session)
) -> list[TaskRead]:
    query = select(Task).options(selectinload(Task.niche))
    
    if niche_id:
        query = query.where(Task.niche_id == niche_id)
    
    if not archived:
        query = query.where(Task.is_archived == False)
        
    result = await session.execute(query.order_by(Task.created_at.desc()))
    tasks = list(result.scalars().all())

    # Calculate is_done_today for each task
    today_str = get_today_str()
    task_ids = [t.id for t in tasks]
    
    if not task_ids:
        return []

    logs_result = await session.execute(
        select(TaskLog.task_id)
        .where(TaskLog.task_id.in_(task_ids))
        .where(TaskLog.date == today_str)
        .where(TaskLog.status == TaskStatus.DONE)
    )
    done_task_ids = set(logs_result.scalars().all())

    # Map to schema manually since we have computed fields
    response = []
    for t in tasks:
        t_read = TaskRead.model_validate(t)
        t_read.is_done_today = t.id in done_task_ids
        response.append(t_read)

    return response


@router.get("/stats", response_model=StatsResponse)
async def get_stats(session: AsyncSession = Depends(get_session)) -> StatsResponse:
    today_str = get_today_str()
    
    # Total active tasks (not archived)
    total_active_query = select(func.count(Task.id)).where(Task.is_archived == False)
    total_active = (await session.execute(total_active_query)).scalar_one()
    
    # Completed today
    completed_today_query = select(func.count(TaskLog.id)).where(
        TaskLog.date == today_str,
        TaskLog.status == TaskStatus.DONE
    )
    completed_today = (await session.execute(completed_today_query)).scalar_one()
    
    # Completed last 7 days
    tz = ZoneInfo(settings.timezone)
    seven_days_ago = (datetime.now(tz) - timedelta(days=7)).strftime("%Y-%m-%d")
    completed_last_7_days_query = select(func.count(TaskLog.id)).where(
        TaskLog.date >= seven_days_ago,
        TaskLog.status == TaskStatus.DONE
    )
    completed_last_7_days = (await session.execute(completed_last_7_days_query)).scalar_one()
    
    # Streak
    profile = await get_profile(session)
    streak = profile.streak

    if profile.last_activity_date:
        last_date = datetime.strptime(profile.last_activity_date, "%Y-%m-%d").date()
        current_date = datetime.strptime(today_str, "%Y-%m-%d").date()
        if last_date < current_date - timedelta(days=1):
            streak = 0
    
    rate = 0.0
    if total_active > 0:
        rate = completed_today / total_active
        
    return StatsResponse(
        completed_today=completed_today,
        total_active_today=total_active,
        completion_rate_today=rate,
        completed_last_7_days=completed_last_7_days,
        streak=streak
    )


@router.get("/profile", response_model=UserProfileRead)
async def get_profile_endpoint(session: AsyncSession = Depends(get_session)) -> UserProfileRead:
    return await get_profile(session)


class ProfileUpdate(TaskLogCreate): # Re-using pydantic model base? No, create new one.
    pass

from app.schemas import UserProfileRead
from pydantic import BaseModel

class UserProfileUpdate(BaseModel):
    xp: int | None = None
    inventory: str | None = None
    achievements: str | None = None
    telegram_chat_id: str | None = None

@router.patch("/profile", response_model=UserProfileRead)
async def update_profile(
    payload: UserProfileUpdate, 
    session: AsyncSession = Depends(get_session)
) -> UserProfileRead:
    profile = await get_profile(session)
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
        
    await session.commit()
    await session.refresh(profile)
    return profile


async def get_profile(session: AsyncSession) -> UserProfile:
    result = await session.execute(select(UserProfile).limit(1))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = UserProfile(level=1, xp=0, streak=0, inventory="[]", achievements="[]")
        session.add(profile)
        await session.commit()
        await session.refresh(profile)
    return profile


@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: int, 
    payload: TaskUpdate, 
    session: AsyncSession = Depends(get_session)
) -> TaskRead:
    task = await session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
        
    await session.commit()
    await session.refresh(task)
    
    # Eager load niche for response
    result = await session.execute(
        select(Task).where(Task.id == task.id).options(selectinload(Task.niche))
    )
    return result.scalar_one()


@router.delete("/{task_id}")
async def delete_task(task_id: int, session: AsyncSession = Depends(get_session)):
    task = await session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await session.delete(task)
    await session.commit()
    return {"status": "deleted"}


@router.post("/{task_id}/log", response_model=TaskLogResponse)
async def log_task(
    task_id: int,
    status: str,
    note: str | None = None,
    session: AsyncSession = Depends(get_session)
) -> TaskLogResponse:
    task = await session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    today_str = get_today_str()
    
    # Check existing log
    result = await session.execute(
        select(TaskLog)
        .where(TaskLog.task_id == task_id)
        .where(TaskLog.date == today_str)
    )
    existing_log = result.scalars().first()
    
    profile = None
    
    if status == TaskStatus.DONE:
        if not existing_log:
            # Create log
            log = TaskLog(
                task_id=task_id, 
                status=status, 
                date=today_str, 
                completed_at=datetime.utcnow()
            )
            session.add(log)
            
            # Gamification
            result = await session.execute(select(UserProfile).limit(1))
            profile = result.scalar_one_or_none()
            if not profile:
                profile = UserProfile(level=1, xp=0, streak=0)
                session.add(profile)
            
            # XP Logic (+10 per task)
            profile.xp += 10
            
            # Level Logic (100 XP per level)
            required_xp = profile.level * 100
            while profile.xp >= required_xp:
                profile.xp -= required_xp
                profile.level += 1
                required_xp = profile.level * 100
            
            # Streak Logic
            if profile.last_activity_date != today_str:
                current_date = datetime.strptime(today_str, "%Y-%m-%d").date()
                if profile.last_activity_date:
                    last_date = datetime.strptime(profile.last_activity_date, "%Y-%m-%d").date()
                    if last_date == current_date - timedelta(days=1):
                        profile.streak += 1
                    elif last_date < current_date - timedelta(days=1):
                        profile.streak = 1
                else:
                    profile.streak = 1
                profile.last_activity_date = today_str
        else:
            # Already logged, just ensure status is done
            existing_log.status = status
            
            # Fetch profile for response
            result = await session.execute(select(UserProfile).limit(1))
            profile = result.scalar_one_or_none()

    else: # Undo/Pending
        if existing_log:
            await session.delete(existing_log)
        
        # Fetch profile for response
        result = await session.execute(select(UserProfile).limit(1))
        profile = result.scalar_one_or_none()

    await session.commit()
    
    if profile:
        await session.refresh(profile)
        
    return TaskLogResponse(status=status, profile=profile)
