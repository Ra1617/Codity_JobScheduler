"""User repository for database operations."""

import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def create(self, user: User) -> User:
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def list_by_org(
        self, org_id: uuid.UUID, page: int, page_size: int
    ) -> tuple[list[User], int]:
        stmt = select(User).where(User.organization_id == org_id)
        
        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar_one()

        # Paginated items
        offset = (page - 1) * page_size
        items_stmt = stmt.order_by(User.created_at.desc()).offset(offset).limit(page_size)
        items_result = await self.session.execute(items_stmt)
        items = list(items_result.scalars().all())

        return items, total
