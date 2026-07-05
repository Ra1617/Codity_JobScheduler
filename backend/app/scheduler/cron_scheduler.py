"""Cron scheduler loop."""

import asyncio

from app.core.config import settings
from app.database.session import AsyncSessionLocal
from app.services.scheduler_service import SchedulerService
from app.core.logger import get_logger

logger = get_logger("cron_scheduler")


async def cron_loop(shutdown_event: asyncio.Event):
    logger.info("Starting cron scheduler")
    while not shutdown_event.is_set():
        try:
            async with AsyncSessionLocal() as session:
                scheduler = SchedulerService(session)
                count = await scheduler.process_cron_jobs()
                await session.commit()
                if count > 0:
                    logger.info(f"Scheduled {count} cron jobs")
        except Exception as e:
            logger.error("Cron scheduler error", error=str(e))
            
        # Run every 60 seconds
        await asyncio.sleep(60)
