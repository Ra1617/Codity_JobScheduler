"""Metrics repository for aggregate database queries."""

import uuid
from datetime import timedelta

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import JobStatus, WorkerStatus
from app.models.dead_letter_queue import DeadLetterQueueEntry
from app.models.job import Job
from app.models.queue import Queue
from app.models.worker import Worker
from app.utils.timestamps import utc_now


class MetricsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_system_metrics(self, org_id: uuid.UUID) -> dict:
        """Aggregate counts across all entities for a given organization."""
        # This is a simplified version; in a real app, we'd join with projects/queues
        # to ensure we only count jobs for the given org.
        # For brevity, assuming the provided org_id scoping is handled via joins.

        # Total workers
        workers_stmt = select(func.count(Worker.id)).where(Worker.organization_id == org_id)
        total_workers = (await self.session.execute(workers_stmt)).scalar_one()

        # Active workers
        active_workers_stmt = select(func.count(Worker.id)).where(
            Worker.organization_id == org_id,
            Worker.status == WorkerStatus.ONLINE,
        )
        active_workers = (await self.session.execute(active_workers_stmt)).scalar_one()

        # Total queues (join through project)
        from app.models.project import Project
        queues_stmt = (
            select(func.count(Queue.id))
            .join(Project, Queue.project_id == Project.id)
            .where(Project.organization_id == org_id)
        )
        total_queues = (await self.session.execute(queues_stmt)).scalar_one()

        paused_queues_stmt = queues_stmt.where(Queue.is_paused == True)
        paused_queues = (await self.session.execute(paused_queues_stmt)).scalar_one()

        # DLQ Unresolved
        dlq_stmt = (
            select(func.count(DeadLetterQueueEntry.id))
            .join(Job, DeadLetterQueueEntry.job_id == Job.id)
            .join(Queue, Job.queue_id == Queue.id)
            .join(Project, Queue.project_id == Project.id)
            .where(Project.organization_id == org_id, DeadLetterQueueEntry.is_resolved == False)
        )
        dlq_unresolved = (await self.session.execute(dlq_stmt)).scalar_one()

        # Job distribution
        jobs_stmt = (
            select(Job.status, func.count(Job.id).label("count"))
            .join(Queue, Job.queue_id == Queue.id)
            .join(Project, Queue.project_id == Project.id)
            .where(Project.organization_id == org_id)
            .group_by(Job.status)
        )
        jobs_result = await self.session.execute(jobs_stmt)
        jobs_by_status = {row.status: row.count for row in jobs_result.all()}
        total_jobs = sum(jobs_by_status.values())

        # Throughput last hour
        one_hour_ago = utc_now() - timedelta(hours=1)
        throughput_stmt = (
            select(func.count(Job.id))
            .join(Queue, Job.queue_id == Queue.id)
            .join(Project, Queue.project_id == Project.id)
            .where(
                Project.organization_id == org_id,
                Job.status == JobStatus.COMPLETED,
                Job.completed_at >= one_hour_ago,
            )
        )
        throughput_last_hour = (await self.session.execute(throughput_stmt)).scalar_one()

        return {
            "total_jobs": total_jobs,
            "jobs_by_status": jobs_by_status,
            "total_workers": total_workers,
            "active_workers": active_workers,
            "total_queues": total_queues,
            "paused_queues": paused_queues,
            "dlq_unresolved": dlq_unresolved,
            "throughput_last_hour": throughput_last_hour,
            "avg_execution_time_seconds": 0.0,  # Placeholder
            "failure_rate_percent": 0.0,       # Placeholder
        }

    async def get_queue_throughput(self, queue_id: uuid.UUID, interval_hours: int) -> dict:
        interval_start = utc_now() - timedelta(hours=interval_hours)
        
        stmt = (
            select(
                func.sum(case((Job.status == JobStatus.COMPLETED, 1), else_=0)).label("completed"),
                func.sum(case((Job.status == JobStatus.FAILED, 1), else_=0)).label("failed"),
                func.avg(
                    func.extract('epoch', Job.completed_at) - func.extract('epoch', Job.started_at)
                ).label("avg_duration")
            )
            .where(
                Job.queue_id == queue_id,
                Job.status.in_([JobStatus.COMPLETED, JobStatus.FAILED]),
                Job.completed_at >= interval_start
            )
        )
        
        result = await self.session.execute(stmt)
        row = result.first()
        
        return {
            "completed": int(row.completed or 0),
            "failed": int(row.failed or 0),
            "avg_duration_seconds": float(row.avg_duration) if row.avg_duration else None,
        }

    async def get_job_status_distribution(self, org_id: uuid.UUID) -> dict[str, int]:
        from app.models.project import Project
        stmt = (
            select(Job.status, func.count(Job.id).label("count"))
            .join(Queue, Job.queue_id == Queue.id)
            .join(Project, Queue.project_id == Project.id)
            .where(Project.organization_id == org_id)
            .group_by(Job.status)
        )
        result = await self.session.execute(stmt)
        return {row.status: row.count for row in result.all()}

    async def get_avg_execution_time(self, queue_id: uuid.UUID) -> float | None:
        stmt = (
            select(
                func.avg(
                    func.extract('epoch', Job.completed_at) - func.extract('epoch', Job.started_at)
                )
            )
            .where(
                Job.queue_id == queue_id,
                Job.status == JobStatus.COMPLETED,
            )
        )
        result = await self.session.execute(stmt)
        val = result.scalar_one_or_none()
        return float(val) if val else None

    async def get_failure_rate(self, queue_id: uuid.UUID) -> float | None:
        stmt = (
            select(
                func.sum(case((Job.status == JobStatus.FAILED, 1), else_=0)).label("failed"),
                func.count(Job.id).label("total")
            )
            .where(
                Job.queue_id == queue_id,
                Job.status.in_([JobStatus.COMPLETED, JobStatus.FAILED]),
            )
        )
        result = await self.session.execute(stmt)
        row = result.first()
        if not row or not row.total:
            return None
        return (row.failed / row.total) * 100.0

    async def get_throughput_per_minute(self, queue_id: uuid.UUID, last_minutes: int) -> float:
        interval_start = utc_now() - timedelta(minutes=last_minutes)
        stmt = (
            select(func.count(Job.id))
            .where(
                Job.queue_id == queue_id,
                Job.status == JobStatus.COMPLETED,
                Job.completed_at >= interval_start,
            )
        )
        result = await self.session.execute(stmt)
        count = result.scalar_one()
        return count / last_minutes
