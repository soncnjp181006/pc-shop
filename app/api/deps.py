from fastapi import APIRouter
from app.api.routers import health # import file health
from app.api.routers.auth import auth_register, auth_login, auth_refresh
from app.api.routers.user import get_me
from app.api.routers.admin import manage_user
from app.api.routers.category import category
from app.api.routers.product import product

# Health
healthSys = APIRouter(prefix="/api/v1/health", tags=["Health"])
healthSys.include_router(health.router)


# Auth
auth = APIRouter(prefix="/api/v1/auth", tags=["Auth"])
auth.include_router(auth_register.router)
auth.include_router(auth_login.router)
auth.include_router(auth_refresh.router)


# User
user = APIRouter(prefix="/api/v1/user", tags=["User"])
user.include_router(get_me.router)

# Admin
admin = APIRouter(prefix="/api/v1/admin", tags=["Admin Management"])
admin.include_router(manage_user.router)

# Category
category_router = APIRouter(prefix="/api/v1/categories", tags=["Categories"])
category_router.include_router(category.router)

# Product
product_router = APIRouter(prefix="/api/v1/products", tags=["Products"])
product_router.include_router(product.router)
