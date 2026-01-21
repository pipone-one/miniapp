import asyncio
import logging

from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo, MenuButtonWebApp
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from openai import AsyncOpenAI

from app.config import settings
from app.db import SessionLocal
from app.services.ai_context import AIContextService
from sqlalchemy import select
from app.models import BotUser

# Configure logging
logging.basicConfig(level=logging.INFO)

# Initialize Bot and Dispatcher
bot = Bot(token=settings.telegram_bot_token) if settings.telegram_bot_token else None
dp = Dispatcher()
scheduler = AsyncIOScheduler()

# Initialize OpenAI
openai_client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None


def get_keyboard():
    # Use the link from settings
    web_app_url = settings.mini_app_link
    
    kb = [
        [KeyboardButton(text="📱 Открыть Life OS", web_app=WebAppInfo(url=web_app_url))],
        [KeyboardButton(text="📅 План на сегодня"), KeyboardButton(text="📊 Статистика")],
        [KeyboardButton(text="➕ Добавить задачу"), KeyboardButton(text="💡 Идея")]
    ]
    return ReplyKeyboardMarkup(keyboard=kb, resize_keyboard=True)


async def register_user(user: types.User):
    async with SessionLocal() as session:
        result = await session.execute(select(BotUser).where(BotUser.telegram_id == user.id))
        db_user = result.scalar_one_or_none()
        if not db_user:
            new_user = BotUser(
                telegram_id=user.id,
                username=user.username,
                first_name=user.first_name
            )
            session.add(new_user)
            await session.commit()
            logging.info(f"New user registered: {user.id} ({user.username})")


@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    await register_user(message.from_user)
    
    # Set persistent Menu Button
    web_app_url = settings.mini_app_link
    logging.info(f"Setting menu button with URL: {web_app_url}")
    
    await message.bot.set_chat_menu_button(
        chat_id=message.chat.id,
        menu_button=MenuButtonWebApp(text="📱 Life OS", web_app=WebAppInfo(url=web_app_url))
    )

    await message.answer(
        "Добро пожаловать в **Life OS**. Я твой персональный ассистент.\n"
        "Помогаю управлять Нишами и Задачами.",
        parse_mode="Markdown",
        reply_markup=get_keyboard()
    )


async def send_daily_prompt(prompt_type: str):
    """
    Sends morning plan prompt or evening reflection prompt to all users.
    """
    if not bot:
        return
        
    async with SessionLocal() as session:
        result = await session.execute(select(BotUser))
        users = result.scalars().all()
        
        for user in users:
            try:
                if prompt_type == "morning":
                    text = "☀️ **Доброе утро!**\n\nДавай спланируем день. Какие главные задачи на сегодня?"
                else:
                    text = "🌙 **Вечерняя рефлексия**\n\nКак прошел день? Что удалось сделать, а что перенесем?"
                
                await bot.send_message(user.telegram_id, text, parse_mode="Markdown", reply_markup=get_keyboard())
            except Exception as e:
                logging.error(f"Failed to send {prompt_type} prompt to {user.telegram_id}: {e}")


@dp.message()
async def handle_message(message: types.Message):
    # Ensure user is registered even if they didn't press start recently
    if message.from_user:
        await register_user(message.from_user)

    async with SessionLocal() as session:
        ai_service = AIContextService(session)
        system_prompt = await ai_service.get_system_prompt()
        
    if not openai_client:
        # Fallback if OpenAI key is missing
        response_text = (
            "⚠️ **AI Brain Missing**\n\n"
            "Я вижу твои задачи и ниши, но мне нужен OpenAI API Key, чтобы думать.\n"
            "Пожалуйста, установи `OPENAI_API_KEY` в файле `.env`.\n\n"
            "Current Context Preview:\n"
            f"```\n{system_prompt[:200]}...\n```"
        )
        await message.answer(response_text, parse_mode="Markdown", reply_markup=get_keyboard())
        return

    # Real AI Response
    try:
        completion = await openai_client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message.text}
            ],
            temperature=0.7,
        )
        response_text = completion.choices[0].message.content
        await message.answer(response_text, parse_mode="Markdown", reply_markup=get_keyboard())
    except Exception as e:
        logging.error(f"OpenAI Error: {e}")
        await message.answer("🤯 Мой мозг перегрелся. Что-то пошло не так с AI сервисом.", reply_markup=get_keyboard())


async def start_bot():
    if not bot:
        logging.warning("Telegram token not set. Bot will not run.")
        return
    
    logging.info("Starting Telegram Bot...")
    
    # Setup Scheduler
    scheduler.add_job(send_daily_prompt, 'cron', hour=9, minute=0, args=['morning'])
    scheduler.add_job(send_daily_prompt, 'cron', hour=21, minute=0, args=['evening'])
    scheduler.start()
    
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)
