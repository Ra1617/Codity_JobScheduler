"""DLQ service containing business logic for dead letter queue management."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import JobStatus
from app.core.exceptions import NotFoundException
from app.models.dead_letter_queue import DeadLetterQueueEntry
from app.models.job import Job
from app.models.job_execution import JobExecution
from app.models.user import User
from app.repositories.job_repository import JobRepository
from app.schemas.common import PaginatedResponse
from app.schemas.job import DLQEntryResponse
from app.utils.timestamps import utc_now


class DLQService:
    def __init__(self, session: AsyncSession, job_repo: JobRepository):
        self.session = session
        self.job_repo = job_repo

    async def move_to_dlq(self, job: Job, execution: JobExecution, reason: str) -> DeadLetterQueueEntry:
        job.status = JobStatus.DEAD
        entry = await self.job_repo.move_to_dlq(
            job_id=job.id,
            execution_id=execution.id if execution else None,
            reason=reason,
            attempt_count=job.attempt_count,
        )
        return entry

    async def resolve_entry(self, dlq_id: uuid.UUID, user: User) -> DeadLetterQueueEntry:
        # Simplification: Direct fetching without full repository method for brevity
        from sqlalchemy import select
        result = await self.session.execute(
            select(DeadLetterQueueEntry).where(DeadLetterQueueEntry.id == dlq_id)
        )
        entry = result.scalar_one_or_none()
        if not entry:
            raise NotFoundException("DLQEntry", str(dlq_id))
            
        entry.is_resolved = True
        entry.resolved_by = user.id
        entry.resolved_at = utc_now()
        await self.session.flush()
        
        return entry

    async def retry_from_dlq(self, dlq_id: uuid.UUID, user: User) -> Job:
        from sqlalchemy import select
        result = await self.session.execute(
            select(DeadLetterQueueEntry).where(DeadLetterQueueEntry.id == dlq_id)
        )
        entry = result.scalar_one_or_none()
        if not entry:
            raise NotFoundException("DLQEntry", str(dlq_id))
            
        job = await self.job_repo.get_by_id(entry.job_id)
        if not job:
            raise NotFoundException("Job", str(entry.job_id))
            
        job.status = JobStatus.QUEUED
        job.attempt_count = 0
        job.available_at = None
        
        entry.is_resolved = True
        entry.resolved_by = user.id
        entry.resolved_at = utc_now()
        
        await self.session.flush()
        return job
