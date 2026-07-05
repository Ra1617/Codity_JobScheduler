"""Timestamps utility."""

from datetime import datetime, timezone


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def seconds_ago(dt: datetime) -> float:
    return (utc_now() - dt).total_seconds()


def format_duration(seconds: float) -> str:
    """Human-readable duration: '2m 30s', '1h 5m', etc."""
    seconds = int(seconds)
    if seconds < 60:
        return f"{seconds}s"
    minutes, seconds = divmod(seconds, 60)
    if minutes < 60:
        return f"{minutes}m {seconds}s"
    hours, minutes = divmod(minutes, 60)
    return f"{hours}h {minutes}m"
