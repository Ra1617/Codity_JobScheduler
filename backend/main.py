"""Main FastAPI application."""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.exceptions import AppException
from app.core.exception_handlers import app_exception_handler, global_exception_handler, validation_exception_handler
from app.core.logger import get_logger
from app.middleware.auth import AuthMiddleware
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.middleware.request_logger import RequestLoggerMiddleware
from app.scheduler.batch_scheduler import batch_loop
from app.scheduler.cron_scheduler import cron_loop
from app.scheduler.delayed_scheduler import delayed_loop
from app.workers.graceful_shutdown import setup_graceful_shutdown

logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP
    logger.info("Application starting up...")
    
    # Normally we would run migrations here
    # Start scheduler background tasks
    shutdown_event = setup_graceful_shutdown()
    
    cron_task = asyncio.create_task(cron_loop(shutdown_event))
    delayed_task = asyncio.create_task(delayed_loop(shutdown_event))
    batch_task = asyncio.create_task(batch_loop(shutdown_event))
    
    app.state.scheduler_tasks = [cron_task, delayed_task, batch_task]
    app.state.shutdown_event = shutdown_event
    
    logger.info("Application started")
    yield
    
    # SHUTDOWN
    logger.info("Application shutting down...")
    shutdown_event.set()
    
    # Wait for tasks to finish
    await asyncio.gather(*app.state.scheduler_tasks, return_exceptions=True)
    
    logger.info("Application shutdown complete")


app = FastAPI(
    title="Distributed Job Scheduler",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware (important for frontend dashboard)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Middleware (outermost first)
app.add_middleware(RequestLoggerMiddleware)
app.add_middleware(RateLimiterMiddleware)
app.add_middleware(AuthMiddleware)

# Exception Handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# API Routers
app.include_router(api_router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
