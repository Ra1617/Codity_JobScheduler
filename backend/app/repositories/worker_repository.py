"""Worker repository for database operations."""

import uuid
from datetime import timedelta
from typing import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import WorkerStatus
from app.core.utils.timestamps import utc_now
from app.models.heartbeat import WorkerHeartbeat
from app.models.worker import Worker


class WorkerRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def register(self, worker: Worker) -> Worker:
        self.session.add(worker)
        await self.session.flush()
        await self.session.refresh(worker)
        return worker

    async def get_by_id(self, worker_id: uuid.UUID) -> Worker | None:
        result = await self.session.execute(
            select(Worker).where(Worker.id == worker_id)
        )
        return result.scalar_one_or_none()

    async def update_status(self, worker_id: uuid.UUID, status: WorkerStatus) -> Worker | None:
        worker = await self.get_by_id(worker_id)
        if worker:
            worker.status = status
            await self.session.flush()
            await self.session.refresh(worker)
        return worker

    async def record_heartbeat(self, worker_id: uuid.UUID, heartbeat: WorkerHeartbeat) -> None:
        self.session.add(heartbeat)
        
        worker = await self.get_by_id(worker_id)
        if worker:
            worker.last_heartbeat_at = heartbeat.reported_at
            # Update status based on heartbeat data or just keep it ONLINE if healthy
            if worker.status in (WorkerStatus.OFFLINE, WorkerStatus.DRAINING):
                # If they were offline but reported a heartbeat, they are back
                worker.status = WorkerStatus.ONLINE
                
        await self.session.flush()

    async def list_by_org(
        self, org_id: uuid.UUID, page: int, page_size: int
    ) -> tuple[Sequence[Worker], int]:
        stmt = select(Worker).where(Worker.organization_id == org_id)

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar_one()

        # Paginated items
        offset = (page - 1) * page_size
        items_stmt = stmt.order_by(Worker.created_at.desc()).offset(offset).limit(page_size)
        items_result = await self.session.execute(items_stmt)
        items = items_result.scalars().all()

        return items, total

    async def get_stale_workers(self, threshold_seconds: int) -> Sequence[Worker]:
        """Find workers with no heartbeat in the last `threshold_seconds`."""
        threshold_time = utc_now() - timedelta(seconds=threshold_seconds)
        stmt = select(Worker).where(
            Worker.status != WorkerStatus.OFFLINE,
            Worker.last_heartbeat_at < threshold_time,
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def deactivate_worker(self, worker_id: uuid.UUID) -> None:
        await self.update_status(worker_id, WorkerStatus.OFFLINE)
