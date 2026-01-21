import logging
import asyncio
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import Message
from sqlalchemy import select
from app.config import settings
from app.db import SessionLocal
from app.models import UserProfile, Task, TaskType

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bot = Bot(token=settings.telegram_bot_token) if settings.telegram_bot_token else None
dp = Dispatcher()

@dp.message(CommandStart())
async def cmd_start(message: Message):
    chat_id = message.chat.id
    logger.info(f"New user started bot: {chat_id}")
    await message.answer(
        f"👋 **Welcome to Life OS Command!**\n\n"
        f"🆔 Your Chat ID is: `{chat_id}`\n\n"
        f"**Setup Instructions:**\n"
        f"1. Open Life OS Web App\n"
        f"2. Go to **Settings**\n"
        f"3. Enter this ID in the 'Telegram Chat ID' field\n\n"
        f"🚀 **How to use:**\n"
        f"Just send me any text, and I'll add it as a task to your inbox!",
        parse_mode="Markdown"
    )

@dp.message()
async def handle_message(message: Message):
    chat_id = str(message.chat.id)
    text = message.text
    
    if not text:
        return

    async with SessionLocal() as session:
        # Find user
        stmt = select(UserProfile).where(UserProfile.telegram_chat_id == chat_id)
        result = await session.execute(stmt)
        profile = result.scalar_one_or_none()
        
        if not profile:
            await message.answer(
                f"⚠️ **Profile Not Found**\n\n"
                f"I don't know who you are yet.\n"
                f"Please add your Chat ID `{chat_id}` to the Life OS Settings.",
                parse_mode="Markdown"
            )
            return

        # Create Task
        new_task = Task(
            title=text,
            task_type=TaskType.ONE_TIME,
            niche_id=None  # Will go to "Inbox" or uncategorized
        )
        session.add(new_task)
        await session.commit()
        
        await message.answer(f"✅ **Task Added:** {text}", parse_mode="Markdown")

async def start_bot():
    if not bot:
        logger.warning("Telegram token not set. Bot will not run.")
        return
    
    logger.info("Starting Telegram Bot...")
    # Drop pending updates to avoid flooding on startup
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)
