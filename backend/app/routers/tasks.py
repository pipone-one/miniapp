from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_session
from app.models import Task, TaskLog, TaskStatus
from app.schemas import TaskCreate, TaskRead, TaskUpdate, TaskLogCreate

router = APIRouter(prefix="/tasks", tags=["tasks"])


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
    today_str = datetime.now().strftime("%Y-%m-%d")
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
    
    # Reload with niche
    result = await session.execute(
        select(Task).where(Task.id == task.id).options(selectinload(Task.niche))
    )
    return result.scalar_one()


@router.post("/{task_id}/log")
async def log_task_status(
    task_id: int,
    status: str,
    note: str | None = None,
    session: AsyncSession = Depends(get_session)
) -> dict:
    task = await session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    log = TaskLog(
        task_id=task_id,
        status=status,
        note=note,
        completed_at=datetime.utcnow(),
        date=datetime.now().strftime("%Y-%m-%d")
    )
    session.add(log)
    
    # Logic for task completion
    if status == TaskStatus.DONE:
        if task.task_type == "one_time":
            task.is_archived = True
        # Recurring tasks: we don't archive them, they just get a log entry for today
    
    await session.commit()
    return {"status": "logged"}
