import httpx
from fastapi import APIRouter

from app.bot import verify_bot
from app.config import settings


router = APIRouter(prefix="/health", tags=["health"])


@router.get("/check")
async def check_health(verify: bool = False) -> dict:
    result = {
        "openai": _key_state(settings.openai_api_key),
        "xai": _key_state(settings.xai_api_key),
        "telegram": _key_state(settings.telegram_bot_token),
    }

    if verify:
        result["openai_verified"] = await _verify_openai()
        result["xai_verified"] = await _verify_xai()
        result["telegram_verified"] = await verify_bot()

    return result


def _key_state(value: str | None) -> str:
    return "configured" if value else "missing"


async def _verify_openai() -> str:
    if not settings.openai_api_key:
        return "missing"
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            response = await client.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            )
        return "ok" if response.status_code == 200 else f"error:{response.status_code}"
    except httpx.HTTPError:
        return "error:network"


async def _verify_xai() -> str:
    if not settings.xai_api_key:
        return "missing"
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            response = await client.get(
                "https://api.x.ai/v1/models",
                headers={"Authorization": f"Bearer {settings.xai_api_key}"},
            )
        return "ok" if response.status_code == 200 else f"error:{response.status_code}"
    except httpx.HTTPError:
        return "error:network"
