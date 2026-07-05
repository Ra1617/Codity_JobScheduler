"""RetryPolicy model — configurable backoff strategies for job retries."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import BackoffStrategy
from app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.organization import Organization


class RetryPolicy(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "retry_policies"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    max_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    backoff_strategy: Mapped[BackoffStrategy] = mapped_column(
        nullable=False, default=BackoffStrategy.EXPONENTIAL
    )
    base_delay_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
    max_delay_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=3600)

    # Relationships
    organization: Mapped["Organization"] = relationship(back_populates="retry_policies")

    def __repr__(self) -> str:
        return (
            f"<RetryPolicy id={self.id} name={self.name!r} "
            f"strategy={self.backoff_strategy}>"
        )
