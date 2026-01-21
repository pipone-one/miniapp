from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Niche, Task, TaskStatus


class AIContextService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_system_prompt(self) -> str:
        """Builds the dynamic system prompt with Life OS context."""
        now = datetime.now()
        date_str = now.strftime("%A, %d %B %Y")
        time_str = now.strftime("%H:%M")

        niches_text = await self._get_niches_context()
        tasks_text = await self._get_tasks_context()

        prompt = (
            f"You are the Life OS Assistant. Current time: {time_str} on {date_str}.\n\n"
            "Your Goal: Help the user manage their life, tasks, and goals. Be proactive, concise, and supportive.\n"
            "You have access to the user's Niches (Life Areas) and Tasks.\n"
            "IMPORTANT: ALWAYS respond in Russian.\n\n"
            f"=== ACTIVE NICHES ===\n{niches_text}\n\n"
            f"=== PENDING TASKS ===\n{tasks_text}\n\n"
            "INSTRUCTIONS:\n"
            "1. Speak Russian. Be cool, modern, and concise.\n"
            "2. If the user wants to add a task, ask for clarification if the Niche is unclear.\n"
            "3. If the user reports completing a task, congratulate them and ask if they want to log it.\n"
            "4. Provide brief, actionable advice based on their Niches.\n"
            "5. You are a 'Second Pilot'. Be helpful but not annoying.\n"
        )
        return prompt

    async def _get_niches_context(self) -> str:
        result = await self.session.execute(select(Niche).where(Niche.is_active == True))
        niches = result.scalars().all()
        if not niches:
            return "No niches defined yet."
        
        lines = []
        for n in niches:
            lines.append(f"- {n.name}: {n.description or ''}")
        return "\n".join(lines)

    async def _get_tasks_context(self) -> str:
        # Get pending tasks
        result = await self.session.execute(
            select(Task).where(
                Task.is_archived == False,
                # We could filter by status but Task table doesn't have status, TaskLog does.
                # Actually, our new model logic: Task is the definition. 
                # We need to know if it's 'due' today. 
                # For now, just list all non-archived tasks.
            ).limit(10)
        )
        tasks = result.scalars().all()
        if not tasks:
            return "Нет активных задач."

        lines = []
        for t in tasks:
            niche_name = "Unknown"
            # Simple lookup if we loaded relationship, but here we just have ID
            # In a real app we'd join Niche. For now, prompt is fine with ID.
            lines.append(f"- [{t.task_type}] {t.title} (Niche ID: {t.niche_id})")
        return "\n".join(lines)
