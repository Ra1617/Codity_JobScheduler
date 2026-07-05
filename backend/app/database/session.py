"""Session context manager and dependency helper."""

from contextlib import asynccontextmanager

from app.database.database import AsyncSessionLocal


@asynccontextmanager
async def get_session():
    """Yield an async session with auto commit / rollback."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
