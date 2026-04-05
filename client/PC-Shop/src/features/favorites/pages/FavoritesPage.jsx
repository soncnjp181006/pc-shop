import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart } from 'lucide-react';
import { favoritesApi } from '../../../utils/favoritesApi';
import { cartApi } from '../../../utils/api';
import { formatVnd } from '../../../utils/format';
import './FavoritesPage.css';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('access_token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/auth/login');
      return;
    }
    loadFavorites();
  }, [token, navigate]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await favoritesApi.getFavorites(token);
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      } else {
        setError('Lỗi khi tải danh sách yêu thích');
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError('Đã xảy ra lỗi khi tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId) => {
    try {
      const response = await favoritesApi.removeFavorite(favoriteId, token);
      if (response.ok) {
        setFavorites(favorites.filter(f => f.id !== favoriteId));
      } else {
        alert('Lỗi khi xóa khỏi yêu thích');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Đã xảy ra lỗi');
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      const response = await cartApi.addToCart(
        { product_id: productId, variant_id: null, quantity: 1 },
        token
      );
      if (response.ok) {
        alert('Đã thêm vào giỏ hàng');
      } else {
        alert('Lỗi khi thêm vào giỏ hàng');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Đã xảy ra lỗi');
    }
  };

  const handleNavigateToProduct = (productSlug) => {
    navigate(`/products/${productSlug}`);
  };

  if (loading) {
    return (
      <div className="favorites-page">
        <div className="loading-container">
          <p>Đang tải danh sách yêu thích...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="favorites-container">
        <div className="favorites-header">
          <h1>Danh sách yêu thích</h1>
          <p className="favorites-count">{favorites.length} sản phẩm</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {favorites.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💝</div>
            <p>Bạn chưa thêm sản phẩm yêu thích nào</p>
            <button
              onClick={() => navigate('/products')}
              className="browse-button"
            >
              Khám phá sản phẩm
            </button>
          </div>
        ) : (
          <div className="favorites-grid">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="favorite-card">
                <div className="card-image-wrapper">
                  <img
                    src={favorite.product.image_url || '/placeholder.jpg'}
                    alt={favorite.product.name}
                    className="card-image"
                    onClick={() => handleNavigateToProduct(favorite.product.slug)}
                  />
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveFavorite(favorite.id)}
                    title="Xóa khỏi yêu thích"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="card-content">
                  <h3
                    className="product-name"
                    onClick={() => handleNavigateToProduct(favorite.product.slug)}
                  >
                    {favorite.product.name}
                  </h3>

                  {favorite.product.brand && (
                    <p className="product-brand">{favorite.product.brand}</p>
                  )}

                  <div className="product-price">
                    {formatVnd(favorite.product.base_price)}
                  </div>

                  <div className="product-meta">
                    <span className={`stock ${favorite.product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                      {favorite.product.stock_quantity > 0 ? 'Còn hàng' : 'Hết hàng'}
                    </span>
                  </div>

                  <button
                    className="add-to-cart-btn"
                    onClick={() => handleAddToCart(favorite.product.id)}
                    disabled={favorite.product.stock_quantity === 0}
                  >
                    <ShoppingCart size={16} />
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
