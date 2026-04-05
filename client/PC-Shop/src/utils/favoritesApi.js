import { apiFetch } from './api';

export const favoritesApi = {
  // Lấy danh sách yêu thích
  getFavorites: (token) => 
    apiFetch('/favorites', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }),

  // Thêm sản phẩm vào yêu thích
  addFavorite: (productId, token) =>
    apiFetch('/favorites', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        product_id: productId
      })
    }),

  // Xóa sản phẩm khỏi yêu thích (theo ID)
  removeFavorite: (favoriteId, token) =>
    apiFetch(`/favorites/${favoriteId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }),

  // Xóa sản phẩm khỏi yêu thích (theo product_id)
  removeFavoriteByProduct: (productId, token) =>
    apiFetch(`/favorites/product/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }),

  // Kiểm tra sản phẩm có trong yêu thích không
  checkFavorite: (productId, token) =>
    apiFetch(`/favorites/check/${productId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }),

  // Lấy số lượng yêu thích
  getFavoritesCount: (token) =>
    apiFetch('/favorites/count/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
};
