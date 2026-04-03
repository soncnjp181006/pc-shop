from app.db.session import SessionLocal
from app.models import User, Category, Product
from app.schemas.product.product import ProductCreate, ProductUpdate
from app.services.product_service.product_service import (
    create_product_service,
    get_product_by_id_service,
    get_all_products_service,
    update_product_service,
    delete_product_service
)
from app.services.category_service.category_service import create_category_service
from app.schemas.category.category import CategoryCreate

def test_product_crud():
    db = SessionLocal()
    try:
        # 1. Setup: Create a category
        cat_in = CategoryCreate(name="Laptop", slug="laptop", is_active=True)
        category = create_category_service(db, cat_in)
        print(f"Created category: {category.id}")

        # Get a user (seller)
        user = db.query(User).first()
        if not user:
            print("No users found. Please create a user first.")
            return
        
        # 2. Create Product
        product_in = ProductCreate(
            name="MacBook Pro M2",
            slug="macbook-pro-m2",
            description="Powerful laptop",
            base_price=1999.99,
            category_id=category.id,
            seller_id=user.id,
            is_active=True
        )
        product = create_product_service(db, product_in)
        print(f"Created product: {product.id}, Name: {product.name}")

        # 3. Read Product
        db_product = get_product_by_id_service(db, product.id)
        print(f"Read product: {db_product.name}")

        # 4. Update Product
        update_in = ProductUpdate(base_price=1899.99)
        updated_product = update_product_service(db, product.id, update_in)
        print(f"Updated product price: {updated_product.base_price}")

        # 5. List Products
        products = get_all_products_service(db)
        print(f"Total products: {len(products)}")

        # 6. Delete Product
        success = delete_product_service(db, product.id)
        print(f"Deleted product: {success}")

        # Clean up category
        db.delete(category)
        db.commit()
        print("Cleaned up category")

    finally:
        db.close()

if __name__ == "__main__":
    test_product_crud()
