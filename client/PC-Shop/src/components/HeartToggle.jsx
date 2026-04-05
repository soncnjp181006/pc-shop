import React, { useState, useEffect } from 'react';
import { favoritesApi } from '../utils/favoritesApi';
import './HeartToggle.css';

const HeartToggle = ({ productId, className = '' }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('access_token');

  // Kiểm tra ban đầu xem sản phẩm có trong yêu thích không
  useEffect(() => {
    if (token && productId) {
      checkFavoriteStatus();
    }
  }, [productId, token]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await favoritesApi.checkFavorite(productId, token);
      if (response.ok) {
        const data = await response.json();
        setIsFavorite(data.is_favorite);
      }
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const handleHeartClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      alert('Vui lòng đăng nhập để sử dụng tính năng yêu thích');
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        // Xóa khỏi yêu thích
        const response = await favoritesApi.removeFavoriteByProduct(productId, token);
        if (response.ok) {
          setIsFavorite(false);
        } else {
          alert('Lỗi khi xóa khỏi yêu thích');
        }
      } else {
        // Thêm vào yêu thích
        const response = await favoritesApi.addFavorite(productId, token);
        if (response.ok) {
          setIsFavorite(true);
        } else {
          const data = await response.json();
          alert(data.detail || 'Lỗi khi thêm vào yêu thích');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleHeartClick}
      disabled={loading}
      className={`heart-toggle ${isFavorite ? 'favorited' : ''} ${className}`}
      title={isFavorite ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
    >
      <svg 
        viewBox="0 0 24 24" 
        width="20" 
        height="20"
        fill={isFavorite ? 'currentColor' : 'none'} 
        stroke="currentColor" 
        strokeWidth="2"
        className="heart-icon"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  );
};

export default HeartToggle;
