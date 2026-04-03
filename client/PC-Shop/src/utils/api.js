const BASE_URL = 'http://localhost:8000/api/v1';

export const apiFetch = async (endpoint, options = {}) => {
  let token = localStorage.getItem('access_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Nếu token hết hạn (401)
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      try {
        // Thử làm mới token
        const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          
          // Thử lại request ban đầu với token mới
          headers['Authorization'] = `Bearer ${data.access_token}`;
          response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
        } else {
          // Refresh token cũng hết hạn hoặc không hợp lệ
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // Không tự động redirect nếu đang ở trang chủ
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
        }
      } catch (error) {
        console.error('Lỗi khi refresh token:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
    } else {
      // Không có refresh token
      localStorage.removeItem('access_token');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
  }

  return response;
};

// API Products
export const productsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, String(params[key]));
      }
    });
    return apiFetch(`/products/?${query.toString()}`);
  },
  getById: (id) => apiFetch(`/products/${id}`),
  create: (data) => apiFetch('/products/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiFetch(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiFetch(`/products/${id}`, {
    method: 'DELETE',
  }),
  softDelete: (id) => apiFetch(`/products/${id}/soft-delete`, {
    method: 'PATCH',
  }),
  getVariants: (productId) => apiFetch(`/products/${productId}/variants/`),
  createVariant: (productId, data) => apiFetch(`/products/${productId}/variants/`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateVariant: (variantId, data) => apiFetch(`/products/variants/${variantId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteVariant: (variantId) => apiFetch(`/products/variants/${variantId}`, {
    method: 'DELETE',
  }),
};

// API Categories
export const categoriesApi = {
  getTree: () => apiFetch('/categories/tree'),
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, String(params[key]));
      }
    });
    const qs = query.toString();
    return apiFetch(`/categories/${qs ? `?${qs}` : ''}`);
  },
  create: (data) => apiFetch('/categories/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiFetch(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiFetch(`/categories/${id}`, {
    method: 'DELETE',
  }),
};

export const adminApi = {
  getUsers: (params = {}) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, String(params[key]));
      }
    });
    const qs = query.toString();
    return apiFetch(`/admin/users${qs ? `?${qs}` : ''}`);
  },
  updateUserRole: (userId, role) => apiFetch(`/admin/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  }),
  updateUserActive: (userId, is_active) => apiFetch(`/admin/${userId}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active }),
  }),
};

// API Cart
export const cartApi = {
  getCart: () => apiFetch('/cart/'),
  addItem: (variantId, quantity) => apiFetch('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ variant_id: variantId, quantity }),
  }),
  updateItem: (itemId, quantity) => apiFetch(`/cart/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  }),
  deleteItem: (itemId) => apiFetch(`/cart/items/${itemId}`, {
    method: 'DELETE',
  }),
};

// Helper để xử lý link ảnh (đặc biệt là Google Drive)
export const getImageUrl = (url) => {
  if (!url) return '/hero.png'; // Ảnh mặc định nếu không có link
  
  // Xử lý link Google Drive
  if (url.includes('drive.google.com')) {
    const fileId = url.match(/\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }
  
  return url;
};
