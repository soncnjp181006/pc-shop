from fastapi import APIRouter
from app.api.routers import health # import file health
from app.api.routers.auth import auth_register, auth_login, auth_refresh
from app.api.routers.user import get_me, customer_profile
from app.api.routers.admin import manage_user, manage_product, manage_order
from app.api.routers.category import category
from app.api.routers.product import product, product_variant
from app.api.routers.cart import cart
from app.api.routers.favorite import favorite

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
user.include_router(customer_profile.router)

# Admin
admin = APIRouter(prefix="/api/v1/admin", tags=["Admin Management"])
admin.include_router(manage_user.router)
admin.include_router(manage_product.router)
admin.include_router(manage_order.router)

# Category
category_router = APIRouter(prefix="/api/v1/categories", tags=["Categories"])
category_router.include_router(category.router)

# Product
product_router = APIRouter(prefix="/api/v1/products", tags=["Products"])
product_router.include_router(product.router)
product_router.include_router(product_variant.router)

# Cart
cart_router = APIRouter(prefix="/api/v1/cart", tags=["Cart"])
cart_router.include_router(cart.router)

# Favorite
favorite_router = APIRouter(prefix="/api/v1/favorites", tags=["Favorites"])
favorite_router.include_router(favorite.router)
