"""Claim jobs logic."""

import uuid

from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.models.job import Job
from app.models.queue import Queue
from app.repositories.job_repository import JobRepository
from app.utils.queue_priority import sort_queues_by_priority


async def claim_jobs(worker_id: uuid.UUID) -> list[Job]:
    """Claims jobs from queues, respecting priorities and concurrency limits."""
    async with AsyncSessionLocal() as session:
        # Fetch queues (active)
        queues_result = await session.execute(
            select(Queue).where(Queue.is_paused == False)
        )
        queues = queues_result.scalars().all()
        sorted_queues = sort_queues_by_priority(list(queues))
        
        claimed = []
        job_repo = JobRepository(session)
        
        for queue in sorted_queues:
            # Check how many are currently running (placeholder logic for demo)
            # In real life, we check how many jobs this worker is running or total running
            available_slots = queue.max_concurrency
            if available_slots > 0:
                jobs = await job_repo.claim_jobs(queue.id, limit=available_slots)
                claimed.extend(jobs)
                
            if len(claimed) > 0:
                # To simplify demo, break after finding jobs in highest priority queue
                break
                
        await session.commit()
        return claimed
