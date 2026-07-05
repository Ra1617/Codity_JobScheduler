"""Queue model — job queues attached to projects with priority and concurrency controls."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, List

from sqlalchemy import Boolean, ForeignKey, Integer, SmallInteger, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.project import Project
    from app.models.retry_policy import RetryPolicy
    from app.models.scheduled_job import ScheduledJob


class Queue(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "queues"

    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    default_retry_policy_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("retry_policies.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    max_concurrency: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    timeout_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=3600)
    is_paused: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="queues")
    default_retry_policy: Mapped["RetryPolicy | None"] = relationship()
    jobs: Mapped[List["Job"]] = relationship(
        back_populates="queue", cascade="all, delete-orphan"
    )
    scheduled_jobs: Mapped[List["ScheduledJob"]] = relationship(
        back_populates="queue", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("project_id", "name", name="uq_queue_project_name"),
    )

    def __repr__(self) -> str:
        return f"<Queue id={self.id} name={self.name!r} priority={self.priority}>"
