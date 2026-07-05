"""Queue repository for database operations."""

import uuid

from sqlalchemy import delete as sql_delete
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import JobStatus
from app.models.job import Job
from app.models.queue import Queue
from app.schemas.queue import QueueStatsResponse


class QueueRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, queue_id: uuid.UUID) -> Queue | None:
        result = await self.session.execute(
            select(Queue).where(Queue.id == queue_id)
        )
        return result.scalar_one_or_none()

    async def create(self, queue: Queue) -> Queue:
        self.session.add(queue)
        await self.session.flush()
        await self.session.refresh(queue)
        return queue

    async def update(self, queue: Queue) -> Queue:
        self.session.add(queue)
        await self.session.flush()
        await self.session.refresh(queue)
        return queue

    async def delete(self, queue_id: uuid.UUID) -> None:
        await self.session.execute(sql_delete(Queue).where(Queue.id == queue_id))
        await self.session.flush()

    async def list_by_project(
        self, project_id: uuid.UUID, page: int, page_size: int
    ) -> tuple[list[Queue], int]:
        stmt = select(Queue).where(Queue.project_id == project_id)

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar_one()

        # Paginated items
        offset = (page - 1) * page_size
        items_stmt = stmt.order_by(Queue.priority.desc(), Queue.created_at.desc()).offset(offset).limit(page_size)
        items_result = await self.session.execute(items_stmt)
        items = list(items_result.scalars().all())

        return items, total

    async def get_stats(self, queue_id: uuid.UUID) -> QueueStatsResponse:
        queue = await self.get_by_id(queue_id)
        if not queue:
            raise ValueError(f"Queue {queue_id} not found")

        stmt = (
            select(Job.status, func.count(Job.id).label("count"))
            .where(Job.queue_id == queue_id)
            .group_by(Job.status)
        )
        result = await self.session.execute(stmt)
        status_counts = {row.status: row.count for row in result.all()}

        total = sum(status_counts.values())

        return QueueStatsResponse(
            queue_id=queue.id,
            queue_name=queue.name,
            total_jobs=total,
            queued=status_counts.get(JobStatus.QUEUED, 0),
            running=status_counts.get(JobStatus.RUNNING, 0),
            completed=status_counts.get(JobStatus.COMPLETED, 0),
            failed=status_counts.get(JobStatus.FAILED, 0),
            dead=status_counts.get(JobStatus.DEAD, 0),
            avg_execution_time_seconds=None,  # Placeholder, handled by metrics repo
            throughput_per_minute=None,       # Placeholder, handled by metrics repo
        )
