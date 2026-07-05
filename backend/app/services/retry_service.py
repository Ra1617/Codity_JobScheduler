"""Retry service containing business logic for job retries and backoff."""

from datetime import timedelta
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import JobStatus
from app.models.job import Job
from app.models.job_execution import JobExecution
from app.models.retry_policy import RetryPolicy
from app.models.queue import Queue
from app.repositories.job_repository import JobRepository
from app.services.dlq_service import DLQService
from app.utils.backoff import calculate_backoff
from app.utils.timestamps import utc_now


class RetryService:
    def __init__(self, session: AsyncSession, job_repo: JobRepository, dlq_service: DLQService):
        self.session = session
        self.job_repo = job_repo
        self.dlq_service = dlq_service

    async def handle_failure(self, job: Job, execution: JobExecution, error: str) -> None:
        retry_policy = None
        
        # Determine retry policy
        if job.retry_policy_id:
            policy_result = await self.session.execute(
                select(RetryPolicy).where(RetryPolicy.id == job.retry_policy_id)
            )
            retry_policy = policy_result.scalar_one_or_none()
        
        if not retry_policy:
            queue_result = await self.session.execute(
                select(Queue).where(Queue.id == job.queue_id)
            )
            queue = queue_result.scalar_one_or_none()
            if queue and queue.default_retry_policy_id:
                policy_result = await self.session.execute(
                    select(RetryPolicy).where(RetryPolicy.id == queue.default_retry_policy_id)
                )
                retry_policy = policy_result.scalar_one_or_none()

        max_attempts = retry_policy.max_attempts if retry_policy else 0
        
        if job.attempt_count < max_attempts:
            delay = 0
            if retry_policy:
                delay = calculate_backoff(
                    strategy=retry_policy.backoff_strategy,
                    attempt=job.attempt_count + 1,
                    base_delay=retry_policy.base_delay_seconds,
                    max_delay=retry_policy.max_delay_seconds,
                )
            
            job.status = JobStatus.QUEUED
            job.available_at = utc_now() + timedelta(seconds=delay)
            job.attempt_count += 1
            execution.next_retry_at = job.available_at
            
            await self.session.flush()
        else:
            await self.dlq_service.move_to_dlq(job, execution, error)
