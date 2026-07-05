"""Health check API routes."""

from fastapi import APIRouter

router = APIRouter()


@router.get("", status_code=200)
async def health_check():
    return {"status": "healthy", "db": "connected", "uptime": "..."}
