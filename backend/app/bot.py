from aiogram import Bot
from aiogram.exceptions import TelegramAPIError

from app.config import settings


def get_bot() -> Bot | None:
    if not settings.telegram_bot_token:
        return None
    return Bot(token=settings.telegram_bot_token)


async def send_alert(message: str, deep_link: str | None = None) -> bool:
    bot = get_bot()
    if not bot or not settings.admin_chat_id:
        return False
    text = message if not deep_link else f"{message}\n{deep_link}"
    await bot.send_message(chat_id=settings.admin_chat_id, text=text)
    return True


async def verify_bot() -> str:
    bot = get_bot()
    if not bot:
        return "missing"
    try:
        await bot.get_me()
        return "ok"
    except TelegramAPIError:
        return "error:api"
