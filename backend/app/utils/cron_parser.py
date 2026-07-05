"""Cron parser utility."""

from datetime import datetime

from croniter import croniter

from app.utils.timestamps import utc_now


def validate_cron(expression: str) -> bool:
    if not croniter.is_valid(expression):
        raise ValueError(f"Invalid cron expression: '{expression}'")
    return True


def get_next_run(expression: str, base_time: datetime | None = None) -> datetime:
    validate_cron(expression)
    base = base_time or utc_now()
    return croniter(expression, base).get_next(datetime)


def get_previous_run(expression: str, base_time: datetime | None = None) -> datetime:
    validate_cron(expression)
    base = base_time or utc_now()
    return croniter(expression, base).get_prev(datetime)
