"""Queue service containing business logic for queue management."""

import uuid
import math

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException
from app.models.queue import Queue
from app.models.user import User
from app.repositories.project_repository import ProjectRepository
from app.repositories.queue_repository import QueueRepository
from app.schemas.common import PaginatedResponse
from app.schemas.queue import QueueCreate, QueueResponse, QueueStatsResponse, QueueUpdate


class QueueService:
    def __init__(
        self,
        session: AsyncSession,
        queue_repo: QueueRepository,
        project_repo: ProjectRepository,
    ):
        self.session = session
        self.queue_repo = queue_repo
        self.project_repo = project_repo

    async def create_queue(self, project_id: uuid.UUID, data: QueueCreate, user: User) -> QueueResponse:
        project = await self.project_repo.get_by_id(project_id)
        if not project or project.organization_id != user.organization_id:
            raise NotFoundException("Project", str(project_id))

        queue = Queue(
            project_id=project_id,
            name=data.name,
            description=data.description,
            priority=data.priority,
            max_concurrency=data.max_concurrency,
            timeout_seconds=data.timeout_seconds,
            default_retry_policy_id=data.default_retry_policy_id,
        )
        
        try:
            queue = await self.queue_repo.create(queue)
        except Exception:
            raise ConflictException(f"Queue '{data.name}' already exists in this project.")
            
        return self._to_response(queue)

    async def update_queue(self, queue_id: uuid.UUID, data: QueueUpdate, user: User) -> QueueResponse:
        queue = await self._get_queue_for_org(queue_id, user.organization_id)
        
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(queue, key, value)
            
        queue = await self.queue_repo.update(queue)
        return self._to_response(queue)

    async def delete_queue(self, queue_id: uuid.UUID, user: User) -> None:
        queue = await self._get_queue_for_org(queue_id, user.organization_id)
        # To strictly comply with instructions: only if queue has no running jobs.
        # Check active jobs logic could be added here, for now simple delete is implemented.
        stats = await self.queue_repo.get_stats(queue_id)
        if stats.running > 0:
            raise ConflictException("Cannot delete queue with running jobs.")
            
        await self.queue_repo.delete(queue_id)

    async def pause_queue(self, queue_id: uuid.UUID, user: User) -> QueueResponse:
        queue = await self._get_queue_for_org(queue_id, user.organization_id)
        queue.is_paused = True
        queue = await self.queue_repo.update(queue)
        return self._to_response(queue)

    async def resume_queue(self, queue_id: uuid.UUID, user: User) -> QueueResponse:
        queue = await self._get_queue_for_org(queue_id, user.organization_id)
        queue.is_paused = False
        queue = await self.queue_repo.update(queue)
        return self._to_response(queue)

    async def get_queue_stats(self, queue_id: uuid.UUID, user: User) -> QueueStatsResponse:
        await self._get_queue_for_org(queue_id, user.organization_id)
        return await self.queue_repo.get_stats(queue_id)

    async def list_queues(self, project_id: uuid.UUID, user: User, page: int, page_size: int) -> PaginatedResponse[QueueResponse]:
        project = await self.project_repo.get_by_id(project_id)
        if not project or project.organization_id != user.organization_id:
            raise NotFoundException("Project", str(project_id))
            
        items, total = await self.queue_repo.list_by_project(project_id, page, page_size)
        return PaginatedResponse(
            items=[self._to_response(q) for q in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if page_size > 0 else 1,
        )

    async def _get_queue_for_org(self, queue_id: uuid.UUID, org_id: uuid.UUID) -> Queue:
        queue = await self.queue_repo.get_by_id(queue_id)
        if not queue:
            raise NotFoundException("Queue", str(queue_id))
        
        # Verify access via project
        project = await self.project_repo.get_by_id(queue.project_id)
        if not project or project.organization_id != org_id:
            raise NotFoundException("Queue", str(queue_id))
            
        return queue

    def _to_response(self, queue: Queue) -> QueueResponse:
        return QueueResponse(
            id=queue.id,
            project_id=queue.project_id,
            name=queue.name,
            description=queue.description,
            priority=queue.priority,
            max_concurrency=queue.max_concurrency,
            timeout_seconds=queue.timeout_seconds,
            is_paused=queue.is_paused,
            default_retry_policy_id=queue.default_retry_policy_id,
            created_at=queue.created_at,
            updated_at=queue.updated_at,
        )
