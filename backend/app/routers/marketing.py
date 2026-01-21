from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

from app.config import settings


router = APIRouter(prefix="/marketing", tags=["marketing"])


class HookRequest(BaseModel):
    model_name: str

    model_config = {"protected_namespaces": ()}


class HookResponse(BaseModel):
    model_name: str
    hooks: list[str]
    formatted: str

    model_config = {"protected_namespaces": ()}


@router.post("/hooks", response_model=HookResponse)
async def generate_hooks(payload: HookRequest) -> HookResponse:
    if not settings.xai_api_key:
        raise HTTPException(status_code=503, detail="xAI key missing")

    prompt = _build_prompt(payload.model_name)
    hooks = await _call_xai(prompt)
    if not hooks:
        raise HTTPException(status_code=502, detail="xAI returned no hooks")
    formatted = _format_hooks(hooks)
    return HookResponse(model_name=payload.model_name, hooks=hooks, formatted=formatted)


def _build_prompt(model_name: str) -> str:
    return (
        "You are a growth strategist for a premium AI model agency. "
        "Generate 3 aggressive viral hooks. "
        "Apply Loop Trap logic: 5s video, 7s text reading time. "
        "Use triggers like 'Red Flag', 'Therapist warned you', and 'Main Character Energy'. "
        f"Model: {model_name}. Return each hook as a single line."
    )


async def _call_xai(prompt: str) -> list[str]:
    headers = {"Authorization": f"Bearer {settings.xai_api_key}"}
    payload = {
        "model": settings.grok_model,
        "messages": [
            {"role": "system", "content": "You write high-converting US-market hooks."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 260,
    }
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post("https://api.x.ai/v1/chat/completions", json=payload, headers=headers)
        if response.status_code != 200:
            return []
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        return _extract_hooks(content)
    except httpx.HTTPError:
        return []


def _extract_hooks(text: str) -> list[str]:
    lines = [line.strip(" -") for line in text.splitlines() if line.strip()]
    hooks = [line.lstrip("0123456789.").strip() for line in lines]
    return hooks[:3]


def _format_hooks(hooks: list[str]) -> str:
    numbered = [f"{idx + 1}. {hook}" for idx, hook in enumerate(hooks)]
    return "```\n" + "\n".join(numbered) + "\n```"
