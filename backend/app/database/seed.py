"""Idempotent seed script.

Creates default organization, admin user, sample project, queue,
and retry policy if they do not already exist.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import BackoffStrategy, UserRole
from app.core.logger import get_logger
from app.core.security import hash_password

logger = get_logger("seed")

# Deterministic UUIDs so the script is truly idempotent
DEFAULT_ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEFAULT_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")
DEFAULT_PROJECT_ID = uuid.UUID("00000000-0000-0000-0000-000000000003")
DEFAULT_POLICY_ID = uuid.UUID("00000000-0000-0000-0000-000000000004")
DEFAULT_QUEUE_ID = uuid.UUID("00000000-0000-0000-0000-000000000005")


async def seed(session: AsyncSession) -> None:
    """Insert seed data if it does not already exist."""
    from app.models.organization import Organization
    from app.models.user import User
    from app.models.project import Project
    from app.models.retry_policy import RetryPolicy
    from app.models.queue import Queue

    # 1. Organization
    existing_org = await session.get(Organization, DEFAULT_ORG_ID)
    if not existing_org:
        org = Organization(
            id=DEFAULT_ORG_ID,
            name="Default Org",
            slug="default-org",
        )
        session.add(org)
        logger.info("Seeded default organization")

    # 2. Admin user
    existing_user = await session.get(User, DEFAULT_USER_ID)
    if not existing_user:
        user = User(
            id=DEFAULT_USER_ID,
            organization_id=DEFAULT_ORG_ID,
            email="admin@example.com",
            password_hash=hash_password("password123"),
            full_name="Admin User",
            role=UserRole.ADMIN,
            is_active=True,
        )
        session.add(user)
        logger.info("Seeded admin user (admin@example.com)")

    # 3. Retry policy
    existing_policy = await session.get(RetryPolicy, DEFAULT_POLICY_ID)
    if not existing_policy:
        policy = RetryPolicy(
            id=DEFAULT_POLICY_ID,
            organization_id=DEFAULT_ORG_ID,
            name="Default Exponential",
            max_attempts=3,
            backoff_strategy=BackoffStrategy.EXPONENTIAL,
            base_delay_seconds=60,
            max_delay_seconds=3600,
        )
        session.add(policy)
        logger.info("Seeded default retry policy")

    # 4. Project
    existing_project = await session.get(Project, DEFAULT_PROJECT_ID)
    if not existing_project:
        project = Project(
            id=DEFAULT_PROJECT_ID,
            organization_id=DEFAULT_ORG_ID,
            created_by=DEFAULT_USER_ID,
            name="Sample Project",
            description="Auto-generated sample project for quick-start.",
        )
        session.add(project)
        logger.info("Seeded sample project")

    # 5. Queue
    existing_queue = await session.get(Queue, DEFAULT_QUEUE_ID)
    if not existing_queue:
        queue = Queue(
            id=DEFAULT_QUEUE_ID,
            project_id=DEFAULT_PROJECT_ID,
            default_retry_policy_id=DEFAULT_POLICY_ID,
            name="default",
            description="Default job queue",
            priority=0,
            max_concurrency=10,
            timeout_seconds=3600,
            is_paused=False,
        )
        session.add(queue)
        logger.info("Seeded default queue")

    await session.commit()
    logger.info("Seed completed")
