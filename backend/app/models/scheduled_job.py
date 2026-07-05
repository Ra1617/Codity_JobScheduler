"""ScheduledJob model — cron-driven recurring job templates."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.queue import Queue
    from app.models.retry_policy import RetryPolicy
    from app.models.user import User


class ScheduledJob(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "scheduled_jobs"

    queue_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("queues.id", ondelete="CASCADE"), nullable=False
    )
    retry_policy_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("retry_policies.id", ondelete="SET NULL"), nullable=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    cron_expression: Mapped[str] = mapped_column(String(100), nullable=False)
    payload_template: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    next_run_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_run_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    queue: Mapped["Queue"] = relationship(back_populates="scheduled_jobs")
    retry_policy: Mapped["RetryPolicy | None"] = relationship()
    creator: Mapped["User"] = relationship()

    __table_args__ = (
        Index("idx_scheduled_jobs_active_next_run", "is_active", "next_run_at"),
    )

    def __repr__(self) -> str:
        return f"<ScheduledJob id={self.id} name={self.name!r} cron={self.cron_expression!r}>"
