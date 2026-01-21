from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_session
from app.models import Task
from app.schemas import TaskCreate, TaskRead, TaskUpdate


router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=list[TaskRead])
async def list_tasks(session: AsyncSession = Depends(get_session)) -> list[TaskRead]:
    result = await session.execute(select(Task).order_by(Task.created_at.desc()))
    return list(result.scalars().all())


@router.post("/", response_model=TaskRead)
async def create_task(
    payload: TaskCreate, session: AsyncSession = Depends(get_session)
) -> TaskRead:
    task = Task(title=payload.title)
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: int, payload: TaskUpdate, session: AsyncSession = Depends(get_session)
) -> TaskRead:
    task = await session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.is_done = payload.is_done
    await session.commit()
    await session.refresh(task)
    return task


@router.post("/voice", response_model=TaskRead)
async def create_task_from_voice(
    audio: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
) -> TaskRead:
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="OpenAI key missing")
    transcript = await _transcribe_audio(audio)
    if not transcript:
        raise HTTPException(status_code=502, detail="Transcription failed")
    task = Task(title=transcript)
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


async def _transcribe_audio(audio: UploadFile) -> str:
    headers = {"Authorization": f"Bearer {settings.openai_api_key}"}
    content = await audio.read()
    files = {
        "file": (audio.filename or "voice.wav", content, audio.content_type or "audio/wav"),
        "model": (None, settings.whisper_model),
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers=headers,
                files=files,
            )
        if response.status_code != 200:
            return ""
        data = response.json()
        return data.get("text", "").strip()
    except httpx.HTTPError:
        return ""
