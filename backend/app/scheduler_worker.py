import asyncio
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from app.bot import send_alert
from app.config import settings
from app.routers.scheduler import WINDOWS


class SchedulerWorker:
    def __init__(self) -> None:
        self._task: asyncio.Task | None = None
        self._sent: set[str] = set()
        self._current_date: str | None = None

    def start(self) -> None:
        if self._task:
            return
        self._task = asyncio.create_task(self._run_loop())

    async def _run_loop(self) -> None:
        while True:
            await self._check_windows()
            await asyncio.sleep(60)

    async def _check_windows(self) -> None:
        tz = ZoneInfo(settings.posting_timezone)
        now = datetime.now(tz)
        today = now.date().isoformat()
        if self._current_date != today:
            self._sent.clear()
            self._current_date = today

        for window in WINDOWS:
            start_dt = datetime.combine(now.date(), window["start"], tzinfo=tz)
            end_dt = datetime.combine(now.date(), window["end"], tzinfo=tz)
            if now > start_dt:
                start_dt += timedelta(days=1)
                end_dt += timedelta(days=1)
            alert_dt = start_dt - timedelta(minutes=15)

            key = f"{window['label']}:{alert_dt.date().isoformat()}"
            if key in self._sent:
                continue

            if alert_dt <= now < alert_dt + timedelta(minutes=1):
                message = f"Next window: {window['label']} ({start_dt.isoformat()} - {end_dt.isoformat()})"
                sent = await send_alert(message, deep_link=settings.mini_app_link)
                if sent:
                    self._sent.add(key)


scheduler_worker = SchedulerWorker()
