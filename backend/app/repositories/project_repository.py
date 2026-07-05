"""Project repository for database operations."""

import uuid

from sqlalchemy import delete as sql_delete
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project


class ProjectRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, project_id: uuid.UUID) -> Project | None:
        result = await self.session.execute(
            select(Project).where(Project.id == project_id)
        )
        return result.scalar_one_or_none()

    async def create(self, project: Project) -> Project:
        self.session.add(project)
        await self.session.flush()
        await self.session.refresh(project)
        return project

    async def update(self, project: Project) -> Project:
        self.session.add(project)
        await self.session.flush()
        await self.session.refresh(project)
        return project

    async def delete(self, project_id: uuid.UUID) -> None:
        await self.session.execute(sql_delete(Project).where(Project.id == project_id))
        await self.session.flush()

    async def list_by_org(
        self, org_id: uuid.UUID, page: int, page_size: int
    ) -> tuple[list[Project], int]:
        stmt = select(Project).where(Project.organization_id == org_id)

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar_one()

        # Paginated items
        offset = (page - 1) * page_size
        items_stmt = stmt.order_by(Project.created_at.desc()).offset(offset).limit(page_size)
        items_result = await self.session.execute(items_stmt)
        items = list(items_result.scalars().all())

        return items, total
