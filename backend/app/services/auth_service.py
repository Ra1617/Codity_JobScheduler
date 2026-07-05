"""Auth service containing business logic for registration and login."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import UserRole
from app.core.exceptions import ConflictException, NotFoundException
from app.core.security import create_access_token, hash_password, verify_password
from app.models.organization import Organization
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse


class AuthService:
    def __init__(self, session: AsyncSession, user_repo: UserRepository):
        self.session = session
        self.user_repo = user_repo

    async def register(self, data: RegisterRequest) -> TokenResponse:
        existing_user = await self.user_repo.get_by_email(data.email)
        if existing_user:
            raise ConflictException("Email already registered")

        # Create Org + User in a single transaction
        org_slug = data.organization_name.lower().replace(" ", "-")
        org = Organization(name=data.organization_name, slug=org_slug)
        self.session.add(org)
        await self.session.flush()

        user = User(
            organization_id=org.id,
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            role=UserRole.ADMIN,
        )
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)

        return self._generate_token_response(user)

    async def login(self, data: LoginRequest) -> TokenResponse:
        user = await self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise NotFoundException("User", "Invalid credentials")

        if not user.is_active:
            raise ConflictException("User account is disabled")

        return self._generate_token_response(user)

    def _generate_token_response(self, user: User) -> TokenResponse:
        token_payload = {
            "sub": str(user.id),
            "org_id": str(user.organization_id),
            "role": user.role,
        }
        access_token = create_access_token(token_payload)
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            organization_id=user.organization_id,
            is_active=user.is_active,
            created_at=user.created_at,
        )
        return TokenResponse(access_token=access_token, user=user_response)
