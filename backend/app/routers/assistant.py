from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import httpx
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from zoneinfo import ZoneInfo

from app.config import settings
from app.db import get_session
from app.models import Task, TaskLog, TaskStatus

router = APIRouter(prefix="/assistant", tags=["assistant"])

class ParseRequest(BaseModel):
    text: str

class ParseResponse(BaseModel):
    title: str
    niche_suggested: str | None = None
    is_recurring: bool = False
    scheduled_time: str | None = None  # HH:MM
    due_date: str | None = None  # YYYY-MM-DD

class BreakdownRequest(BaseModel):
    goal: str

class Subtask(BaseModel):
    title: str
    niche: str | None

class BreakdownResponse(BaseModel):
    subtasks: list[Subtask]

class SummaryResponse(BaseModel):
    summary: str
    grade: str

@router.post("/breakdown", response_model=BreakdownResponse)
async def break_down_goal(payload: BreakdownRequest):
    if not settings.xai_api_key:
        raise HTTPException(status_code=503, detail="AI not configured")
        
    prompt = (
        "Break down the following goal into 3-5 actionable subtasks. "
        "For each subtask, suggest a niche (Work, Sport, Rest, Learn, Health, Hobby, etc.). "
        f"Goal: {payload.goal} "
        "Output JSON: { \"subtasks\": [ { \"title\": string, \"niche\": string } ] }"
    )

    headers = {"Authorization": f"Bearer {settings.xai_api_key}"}
    data = {
        "model": settings.grok_model,
        "messages": [
            {"role": "system", "content": "You are a JSON generator. Output ONLY valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post("https://api.x.ai/v1/chat/completions", json=data, headers=headers)
        
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="AI Service Error")
            
        content = resp.json()["choices"][0]["message"]["content"]
        content = content.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(content)
        
        return BreakdownResponse(**parsed)
    except Exception as e:
        print(f"Breakdown Error: {e}")
        return BreakdownResponse(subtasks=[])


@router.get("/daily-summary", response_model=SummaryResponse)
async def get_daily_summary(session: AsyncSession = Depends(get_session)):
    if not settings.xai_api_key:
        return SummaryResponse(summary="AI not configured.", grade="N/A")

    # Get today's date
    tz = ZoneInfo(settings.timezone)
    today_str = datetime.now(tz).strftime("%Y-%m-%d")

    # Fetch completed tasks today
    completed_query = select(Task.title).join(TaskLog).where(
        TaskLog.date == today_str,
        TaskLog.status == TaskStatus.DONE
    )
    completed_tasks = (await session.execute(completed_query)).scalars().all()

    # Fetch pending tasks (active, not archived, not done today)
    # This is a bit complex to query efficiently in one go without a subquery, 
    # but let's just fetch all active tasks and filter roughly or just assume 'pending' 
    # implies tasks that are active and not in the completed list.
    # Simpler: Just focus on what was DONE for the summary to keep it positive/focused.
    # Or fetch all active tasks to see what remains.
    
    # Let's fetch all active tasks to compare
    active_query = select(Task).where(Task.is_archived == False)
    active_tasks = (await session.execute(active_query)).scalars().all()
    
    pending_titles = []
    completed_titles = list(completed_tasks)
    
    # Simple logic: if task id not in completed_ids (which we'd need to fetch), it's pending.
    # Let's re-fetch completed with IDs to filter
    completed_ids_query = select(TaskLog.task_id).where(
        TaskLog.date == today_str,
        TaskLog.status == TaskStatus.DONE
    )
    completed_ids = (await session.execute(completed_ids_query)).scalars().all()
    
    for t in active_tasks:
        if t.id not in completed_ids:
            pending_titles.append(t.title)

    prompt = (
        "You are a Tactical Life OS Advisor. "
        "Analyze my day and give a brief summary (max 2 sentences) and a Grade (S, A, B, C, D). "
        "Be motivating but strict. "
        f"Completed: {', '.join(completed_titles) if completed_titles else 'Nothing yet'}. "
        f"Pending: {', '.join(pending_titles) if pending_titles else 'Nothing'}. "
        "Output JSON: { \"summary\": string, \"grade\": string }"
    )

    headers = {"Authorization": f"Bearer {settings.xai_api_key}"}
    data = {
        "model": settings.grok_model,
        "messages": [
            {"role": "system", "content": "You are a JSON generator. Output ONLY valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post("https://api.x.ai/v1/chat/completions", json=data, headers=headers)
        
        if resp.status_code != 200:
            return SummaryResponse(summary="AI Service Unavailable", grade="?")
            
        content = resp.json()["choices"][0]["message"]["content"]
        content = content.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(content)
        
        return SummaryResponse(
            summary=parsed.get("summary", "No summary generated."),
            grade=parsed.get("grade", "C")
        )
    except Exception as e:
        print(f"AI Summary Error: {e}")
        return SummaryResponse(summary="Failed to generate summary.", grade="E")


@router.post("/parse", response_model=ParseResponse)
async def parse_task(payload: ParseRequest):
    if not settings.xai_api_key:
        return ParseResponse(title=payload.text)

    prompt = (
        "You are a helper API. Output ONLY raw JSON (no markdown). "
        "Parse user input into: "
        "{ \"title\": string, \"niche_suggested\": string|null, \"is_recurring\": bool, \"scheduled_time\": \"HH:MM\"|null, \"due_date\": \"YYYY-MM-DD\"|null }. "
        "Niches: Sport, Work, Rest, Learn, Health. "
        "Get today's date from context if needed, but for now relative dates are fine or return null if unsure. "
        f"Input: \"{payload.text}\""
    )

    headers = {"Authorization": f"Bearer {settings.xai_api_key}"}
    data = {
        "model": settings.grok_model,
        "messages": [
            {"role": "system", "content": "You are a JSON parser."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post("https://api.x.ai/v1/chat/completions", json=data, headers=headers)
        
        if resp.status_code != 200:
            return ParseResponse(title=payload.text)
            
        content = resp.json()["choices"][0]["message"]["content"]
        # Clean markdown if present
        content = content.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(content)
        
        return ParseResponse(
            title=parsed.get("title", payload.text),
            niche_suggested=parsed.get("niche_suggested"),
            is_recurring=parsed.get("is_recurring", False),
            scheduled_time=parsed.get("scheduled_time"),
            due_date=parsed.get("due_date")
        )
    except Exception as e:
        print(f"AI Parse Error: {e}")
        return ParseResponse(title=payload.text)
