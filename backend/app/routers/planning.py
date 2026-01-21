from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

from app.config import settings


router = APIRouter(prefix="/planning", tags=["planning"])


class PlanRequest(BaseModel):
    brief: str


class PlanResponse(BaseModel):
    brief: str
    plan: str
    formatted: str


@router.post("/brief", response_model=PlanResponse)
async def create_plan(payload: PlanRequest) -> PlanResponse:
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="OpenAI key missing")

    plan = await _call_openai(payload.brief)
    if not plan:
        raise HTTPException(status_code=502, detail="OpenAI returned no plan")
    formatted = f"```\n{plan}\n```"
    return PlanResponse(brief=payload.brief, plan=plan, formatted=formatted)


async def _call_openai(brief: str) -> str:
    headers = {"Authorization": f"Bearer {settings.openai_api_key}"}
    payload = {
        "model": settings.openai_model,
        "messages": [
            {"role": "system", "content": "You produce concise execution plans."},
            {"role": "user", "content": brief},
        ],
        "temperature": 0.3,
        "max_tokens": 240,
    }
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)
        if response.status_code != 200:
            return ""
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    except httpx.HTTPError:
        return ""
