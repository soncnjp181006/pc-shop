 const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiFetch = async (endpoint, options = {}) => {
  let token = localStorage.getItem('access_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const timestampSeparator = url.includes('?') ? '&' : '?';
  
  let response = await fetch(`${url}${timestampSeparator}t=${Date.now()}`, {
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
            // window.location.href = '/';
          }
        }
      } catch (error) {
        console.error('Lỗi khi refresh token:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (window.location.pathname !== '/') {
          // window.location.href = '/';
        }
      }
    } else {
      // Không có refresh token
      localStorage.removeItem('access_token');
      if (window.location.pathname !== '/') {
        // window.location.href = '/';
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
  getBrandOptions: () => apiFetch('/products/brand-options'),
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
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, String(params[key]));
      }
    });
    const qs = query.toString();
    return apiFetch(`/admin/products${qs ? `?${qs}` : ''}`);
  },
  updateProductStatus: (productId, data) => apiFetch(`/admin/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  getProductMetaConfig: () => apiFetch('/admin/product-meta-config'),
  updateProductMetaConfig: (data) => apiFetch('/admin/product-meta-config', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  // Order management
  getOrders: (params = {}) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, String(params[key]));
      }
    });
    const qs = query.toString();
    return apiFetch(`/admin/orders${qs ? `?${qs}` : ''}`);
  },
  getOrderById: (id) => apiFetch(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) => apiFetch(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  getOverviewStats: () => apiFetch('/admin/stats/overview'),
};

// Thông tin thanh toán / địa chỉ / SĐT (đã đăng nhập)
export const customerProfileApi = {
  getCheckoutProfile: () => apiFetch('/user/checkout-profile'),
  listPaymentMethods: () => apiFetch('/user/payment-methods'),
  createPaymentMethod: (data) => apiFetch('/user/payment-methods', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updatePaymentMethod: (id, data) => apiFetch(`/user/payment-methods/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deletePaymentMethod: (id) => apiFetch(`/user/payment-methods/${id}`, { method: 'DELETE' }),
  listShippingAddresses: () => apiFetch('/user/shipping-addresses'),
  createShippingAddress: (data) => apiFetch('/user/shipping-addresses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateShippingAddress: (id, data) => apiFetch(`/user/shipping-addresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteShippingAddress: (id) => apiFetch(`/user/shipping-addresses/${id}`, { method: 'DELETE' }),
  listPhones: () => apiFetch('/user/phones'),
  createPhone: (data) => apiFetch('/user/phones', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updatePhone: (id, data) => apiFetch(`/user/phones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deletePhone: (id) => apiFetch(`/user/phones/${id}`, { method: 'DELETE' }),
};

// API Cart
export const cartApi = {
  getCart: () => apiFetch('/cart/'),
  addItem: (variantId, quantity, productId) => apiFetch('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ 
      variant_id: variantId || null, 
      product_id: productId || null,
      quantity 
    }),
  }),
  updateItem: (itemId, quantity) => apiFetch(`/cart/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  }),
  checkout: (data) => apiFetch('/cart/checkout', {
    method: 'POST',
    body: JSON.stringify(data),
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
