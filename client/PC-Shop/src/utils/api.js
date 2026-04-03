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
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Lỗi khi refresh token:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/';
      }
    } else {
      // Không có refresh token, yêu cầu login lại
      localStorage.removeItem('access_token');
      window.location.href = '/';
    }
  }

  return response;
};
