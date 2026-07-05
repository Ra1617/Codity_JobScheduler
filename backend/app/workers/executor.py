"""Executor logic for jobs."""

import asyncio
import random
import uuid

from app.core.constants import ExecutionStatus, JobStatus
from app.database.session import AsyncSessionLocal
from app.models.job import Job
from app.models.job_execution import JobExecution
from app.repositories.job_repository import JobRepository
from app.services.dlq_service import DLQService
from app.services.retry_service import RetryService
from app.utils.timestamps import utc_now
from app.core.logger import get_logger

logger = get_logger("executor")


async def run_payload(payload: dict) -> dict:
    """Simulates job execution."""
    logger.info("Executing job payload", payload=payload)
    await asyncio.sleep(random.uniform(0.5, 2.0))
    if payload.get("simulate_error"):
        raise RuntimeError(payload.get("simulate_error"))
    return {"result": "success", "processed_data": payload}


def create_job_execution(job: Job, worker_id: uuid.UUID) -> JobExecution:
    return JobExecution(
        job_id=job.id,
        worker_id=worker_id,
        attempt_number=job.attempt_count + 1,
        status=ExecutionStatus.RUNNING,
    )


async def execute_job(job: Job, worker_id: uuid.UUID):
    execution = create_job_execution(job, worker_id)
    
    async with AsyncSessionLocal() as session:
        job_repo = JobRepository(session)
        dlq_service = DLQService(session, job_repo)
        retry_service = RetryService(session, job_repo, dlq_service)
        
        # Merge job into current session
        job = await session.merge(job)
        session.add(execution)
        await session.flush()
        
        try:
            job.status = JobStatus.RUNNING
            await session.commit()
            
            # Execute with timeout
            timeout = job.timeout_seconds or 3600
            result = await asyncio.wait_for(
                run_payload(job.payload),
                timeout=timeout
            )
            
            # Re-attach to session after await
            session.add(job)
            session.add(execution)
            
            # Mark completed
            job.status = JobStatus.COMPLETED
            job.completed_at = utc_now()
            execution.status = ExecutionStatus.COMPLETED
            execution.result = result
            
        except asyncio.TimeoutError:
            session.add(job)
            session.add(execution)
            execution.status = ExecutionStatus.TIMED_OUT
            execution.error_message = f"Job timed out after {job.timeout_seconds}s"
            await retry_service.handle_failure(job, execution, execution.error_message)
            
        except Exception as e:
            session.add(job)
            session.add(execution)
            execution.status = ExecutionStatus.FAILED
            execution.error_message = str(e)
            await retry_service.handle_failure(job, execution, str(e))
        
        finally:
            execution.completed_at = utc_now()
            await session.commit()
