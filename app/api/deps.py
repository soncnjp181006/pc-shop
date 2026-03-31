from fastapi import APIRouter
from app.api.routers import health # import file health

healthSys = APIRouter(prefix="/api/v1/health", tags=["Health"])
healthSys.include_router(health.router)