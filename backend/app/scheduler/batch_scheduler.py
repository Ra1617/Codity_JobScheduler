"""Batch scheduler loop."""

import asyncio

from sqlalchemy import func, select

from app.core.constants import BatchStatus, JobStatus
from app.database.session import AsyncSessionLocal
from app.models.batch import Batch
from app.models.job import Job
from app.core.logger import get_logger

logger = get_logger("batch_scheduler")


async def batch_loop(shutdown_event: asyncio.Event):
    logger.info("Starting batch scheduler")
    while not shutdown_event.is_set():
        try:
            async with AsyncSessionLocal() as session:
                # Find incomplete batches
                stmt = select(Batch).where(Batch.status.in_([BatchStatus.PENDING, BatchStatus.PROCESSING]))
                result = await session.execute(stmt)
                batches = result.scalars().all()
                
                for batch in batches:
                    # Count completed and failed jobs
                    count_stmt = (
                        select(Job.status, func.count(Job.id).label("count"))
                        .where(Job.batch_id == batch.id)
                        .group_by(Job.status)
                    )
                    count_result = await session.execute(count_stmt)
                    counts = {row.status: row.count for row in count_result.all()}
                    
                    completed = counts.get(JobStatus.COMPLETED, 0)
                    failed = counts.get(JobStatus.FAILED, 0)
                    dead = counts.get(JobStatus.DEAD, 0)
                    total_failed = failed + dead
                    
                    batch.completed_jobs = completed
                    batch.failed_jobs = total_failed
                    
                    if completed + total_failed >= batch.total_jobs:
                        if total_failed == 0:
                            batch.status = BatchStatus.COMPLETED
                        elif completed == 0:
                            batch.status = BatchStatus.FAILED
                        else:
                            batch.status = BatchStatus.PARTIAL_FAILURE
                    elif completed + total_failed > 0:
                        batch.status = BatchStatus.PROCESSING
                        
                await session.commit()
        except Exception as e:
            logger.error("Batch scheduler error", error=str(e))
            
        # Run every 30 seconds
        await asyncio.sleep(30)
