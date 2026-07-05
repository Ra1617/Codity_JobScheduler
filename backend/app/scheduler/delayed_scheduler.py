"""Delayed scheduler loop."""

import asyncio

from app.database.session import AsyncSessionLocal
from app.services.scheduler_service import SchedulerService
from app.core.logger import get_logger

logger = get_logger("delayed_scheduler")


async def delayed_loop(shutdown_event: asyncio.Event):
    logger.info("Starting delayed scheduler")
    while not shutdown_event.is_set():
        try:
            async with AsyncSessionLocal() as session:
                scheduler = SchedulerService(session)
                count = await scheduler.process_delayed_jobs()
                await session.commit()
                if count > 0:
                    logger.info(f"Queued {count} delayed jobs")
        except Exception as e:
            logger.error("Delayed scheduler error", error=str(e))
            
        # Run every 10 seconds
        await asyncio.sleep(10)
