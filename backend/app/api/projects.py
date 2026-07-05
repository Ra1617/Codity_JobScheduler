"""Projects API routes."""

import uuid

from fastapi import APIRouter, Depends, status

from app.core.dependencies import PaginationParams, get_current_user
from app.models.project import Project
from app.models.user import User
from app.repositories.project_repository import ProjectRepository
from app.schemas.common import PaginatedResponse
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.core.dependencies import get_db
from sqlalchemy.ext.asyncio import AsyncSession
import math

router = APIRouter()


def get_project_repo(db: AsyncSession = Depends(get_db)) -> ProjectRepository:
    return ProjectRepository(db)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    repo: ProjectRepository = Depends(get_project_repo),
):
    project = Project(
        organization_id=current_user.organization_id,
        created_by=current_user.id,
        name=data.name,
        description=data.description,
    )
    project = await repo.create(project)
    return ProjectResponse(**project.__dict__)


@router.get("", response_model=PaginatedResponse[ProjectResponse], status_code=status.HTTP_200_OK)
async def list_projects(
    pagination: PaginationParams = Depends(),
    current_user: User = Depends(get_current_user),
    repo: ProjectRepository = Depends(get_project_repo),
):
    items, total = await repo.list_by_org(current_user.organization_id, pagination.page, pagination.page_size)
    return PaginatedResponse(
        items=[ProjectResponse(**p.__dict__) for p in items],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=math.ceil(total / pagination.page_size) if pagination.page_size > 0 else 1,
    )


@router.get("/{project_id}", response_model=ProjectResponse, status_code=status.HTTP_200_OK)
async def get_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    repo: ProjectRepository = Depends(get_project_repo),
):
    project = await repo.get_by_id(project_id)
    if not project or project.organization_id != current_user.organization_id:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Project", str(project_id))
    return ProjectResponse(**project.__dict__)


@router.put("/{project_id}", response_model=ProjectResponse, status_code=status.HTTP_200_OK)
async def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    repo: ProjectRepository = Depends(get_project_repo),
):
    project = await repo.get_by_id(project_id)
    if not project or project.organization_id != current_user.organization_id:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Project", str(project_id))
    
    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
        
    project = await repo.update(project)
    return ProjectResponse(**project.__dict__)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    repo: ProjectRepository = Depends(get_project_repo),
):
    project = await repo.get_by_id(project_id)
    if not project or project.organization_id != current_user.organization_id:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Project", str(project_id))
        
    await repo.delete(project_id)
