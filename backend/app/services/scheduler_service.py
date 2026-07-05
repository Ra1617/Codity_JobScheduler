"""Scheduler service for background cron and delayed jobs."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import JobStatus, JobType
from app.models.job import Job
from app.models.scheduled_job import ScheduledJob
from app.utils.cron_parser import get_next_run
from app.utils.timestamps import utc_now


class SchedulerService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def process_cron_jobs(self) -> int:
        now = utc_now()
        stmt = (
            select(ScheduledJob)
            .where(
                ScheduledJob.is_active == True,
                ScheduledJob.next_run_at <= now,
            )
        )
        result = await self.session.execute(stmt)
        scheduled_jobs = result.scalars().all()
        
        created_count = 0
        for s_job in scheduled_jobs:
            new_job = Job(
                queue_id=s_job.queue_id,
                scheduled_job_id=s_job.id,
                retry_policy_id=s_job.retry_policy_id,
                created_by=s_job.created_by,
                job_type=JobType.SCHEDULED,
                payload=s_job.payload_template,
                status=JobStatus.QUEUED,
                # Simple inherit for other fields...
            )
            self.session.add(new_job)
            
            s_job.last_run_at = now
            s_job.next_run_at = get_next_run(s_job.cron_expression, base_time=now)
            
            created_count += 1
            
        await self.session.flush()
        return created_count

    async def process_delayed_jobs(self) -> int:
        now = utc_now()
        stmt = (
            select(Job)
            .where(
                Job.status == JobStatus.SCHEDULED,
                Job.available_at <= now,
            )
        )
        result = await self.session.execute(stmt)
        delayed_jobs = result.scalars().all()
        
        updated_count = 0
        for job in delayed_jobs:
            job.status = JobStatus.QUEUED
            updated_count += 1
            
        await self.session.flush()
        return updated_count
