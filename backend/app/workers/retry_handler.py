"""Retry handler."""

from app.database.session import AsyncSessionLocal
from app.models.job import Job
from app.models.job_execution import JobExecution
from app.repositories.job_repository import JobRepository
from app.services.dlq_service import DLQService
from app.services.retry_service import RetryService


async def handle_worker_failure(job: Job, execution: JobExecution, error_message: str):
    async with AsyncSessionLocal() as session:
        job_repo = JobRepository(session)
        dlq_service = DLQService(session, job_repo)
        retry_service = RetryService(session, job_repo, dlq_service)
        
        job = await session.merge(job)
        execution = await session.merge(execution)
        
        await retry_service.handle_failure(job, execution, error_message)
        await session.commit()
