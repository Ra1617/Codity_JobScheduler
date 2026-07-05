"""Worker service containing business logic for worker management."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import WorkerStatus
from app.core.exceptions import NotFoundException
from app.models.user import User
from app.models.worker import Worker
from app.repositories.worker_repository import WorkerRepository
from app.schemas.worker import WorkerRegisterRequest, WorkerResponse


class WorkerService:
    def __init__(self, session: AsyncSession, worker_repo: WorkerRepository):
        self.session = session
        self.worker_repo = worker_repo

    async def register_worker(self, data: WorkerRegisterRequest, user: User) -> WorkerResponse:
        worker = Worker(
            organization_id=user.organization_id,
            hostname=data.hostname,
            version=data.version,
            status=WorkerStatus.ONLINE,
        )
        worker = await self.worker_repo.register(worker)
        return self._to_response(worker)

    async def deregister_worker(self, worker_id: uuid.UUID, user: User) -> None:
        worker = await self.worker_repo.get_by_id(worker_id)
        if not worker or worker.organization_id != user.organization_id:
            raise NotFoundException("Worker", str(worker_id))

        await self.worker_repo.deactivate_worker(worker_id)

    def _to_response(self, worker: Worker) -> WorkerResponse:
        return WorkerResponse(
            id=worker.id,
            organization_id=worker.organization_id,
            hostname=worker.hostname,
            version=worker.version,
            status=worker.status,
            last_heartbeat_at=worker.last_heartbeat_at,
            created_at=worker.created_at,
            updated_at=worker.updated_at,
        )
