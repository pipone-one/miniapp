from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Query

from app.bot import send_alert
from app.config import settings


router = APIRouter(prefix="/scheduler", tags=["scheduler"])

WINDOWS = [
    {"label": "US Morning", "start": time(15, 0), "end": time(17, 0)},
    {"label": "US Prime", "start": time(19, 0), "end": time(22, 0)},
]


@router.get("/windows")
async def get_windows() -> dict:
    tz = ZoneInfo(settings.posting_timezone)
    now = datetime.now(tz)
    payload = []
    for window in WINDOWS:
        start_dt = datetime.combine(now.date(), window["start"], tzinfo=tz)
        end_dt = datetime.combine(now.date(), window["end"], tzinfo=tz)
        if now > end_dt:
            start_dt += timedelta(days=1)
            end_dt += timedelta(days=1)
        alert_dt = start_dt - timedelta(minutes=15)
        payload.append(
            {
                "label": window["label"],
                "start": start_dt.isoformat(),
                "end": end_dt.isoformat(),
                "alert_at": alert_dt.isoformat(),
            }
        )
    payload.sort(key=lambda item: item["start"])
    return {"timezone": settings.posting_timezone, "windows": payload}


@router.post("/notify")
async def notify_next_window(
    deep_link: str | None = Query(default=None, description="Marketing Lab deep link"),
) -> dict:
    windows = (await get_windows())["windows"]
    next_window = windows[0]
    message = f"Next window: {next_window['label']} ({next_window['start']} - {next_window['end']})"
    sent = await send_alert(message, deep_link=deep_link or settings.mini_app_link)
    return {"sent": sent, "window": next_window}
