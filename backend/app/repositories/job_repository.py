"""Job repository for database operations, featuring atomic claiming."""

import uuid
from typing import Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import JobStatus
from app.models.dead_letter_queue import DeadLetterQueueEntry
from app.models.job import Job


class JobRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, job: Job) -> Job:
        self.session.add(job)
        await self.session.flush()
        await self.session.refresh(job)
        return job

    async def create_batch(self, jobs: list[Job]) -> list[Job]:
        self.session.add_all(jobs)
        await self.session.flush()
        return jobs

    async def get_by_id(self, job_id: uuid.UUID) -> Job | None:
        result = await self.session.execute(select(Job).where(Job.id == job_id))
        return result.scalar_one_or_none()

    async def get_detail(self, job_id: uuid.UUID) -> Job | None:
        stmt = (
            select(Job)
            .options(
                selectinload(Job.executions),
                selectinload(Job.dlq_entry),
            )
            .where(Job.id == job_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_idempotency_key(self, key: str) -> Job | None:
        result = await self.session.execute(
            select(Job).where(Job.idempotency_key == key)
        )
        return result.scalar_one_or_none()

    async def list_by_queue(
        self, queue_id: uuid.UUID, status_filter: JobStatus | None, page: int, page_size: int
    ) -> tuple[Sequence[Job], int]:
        stmt = select(Job).where(Job.queue_id == queue_id)
        
        if status_filter:
            stmt = stmt.where(Job.status == status_filter)

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar_one()

        # Paginated items
        offset = (page - 1) * page_size
        items_stmt = stmt.order_by(Job.created_at.desc()).offset(offset).limit(page_size)
        items_result = await self.session.execute(items_stmt)
        items = items_result.scalars().all()

        return items, total

    async def claim_jobs(self, queue_id: uuid.UUID, limit: int) -> Sequence[Job]:
        """
        Atomically claims jobs using SELECT FOR UPDATE SKIP LOCKED.
        This prevents duplicate claims across multiple workers.
        """
        stmt = (
            select(Job)
            .where(
                Job.queue_id == queue_id,
                Job.status == JobStatus.QUEUED,
                or_(Job.available_at <= func.now(), Job.available_at.is_(None)),
            )
            .order_by(Job.priority.desc(), Job.created_at.asc())
            .limit(limit)
            .with_for_update(skip_locked=True)
        )
        result = await self.session.execute(stmt)
        jobs = result.scalars().all()
        
        for job in jobs:
            job.status = JobStatus.CLAIMED
            job.started_at = func.now()
        
        await self.session.flush()
        return jobs

    async def update_status(self, job_id: uuid.UUID, status: JobStatus, **kwargs) -> Job | None:
        job = await self.get_by_id(job_id)
        if job:
            job.status = status
            for key, value in kwargs.items():
                setattr(job, key, value)
            await self.session.flush()
            await self.session.refresh(job)
        return job

    async def move_to_dlq(
        self, job_id: uuid.UUID, execution_id: uuid.UUID, reason: str, attempt_count: int
    ) -> DeadLetterQueueEntry:
        entry = DeadLetterQueueEntry(
            job_id=job_id,
            last_execution_id=execution_id,
            failure_reason=reason,
            attempt_count=attempt_count,
        )
        self.session.add(entry)
        await self.session.flush()
        return entry
