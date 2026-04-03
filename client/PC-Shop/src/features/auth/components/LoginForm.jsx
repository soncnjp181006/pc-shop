import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputField from '../../../components/common/InputField/InputField';

const LoginForm = ({ toggleMode }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Backend expects application/x-www-form-urlencoded for OAuth2PasswordRequestForm
      const loginData = new URLSearchParams();
      loginData.append('username', formData.email);
      loginData.append('password', formData.password);

      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: loginData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Đăng nhập thất bại');
      }

      console.log('Đăng nhập thành công:', data);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user_role', data.role);
      
      // Chuyển hướng dựa trên Role
      if (data.role === 'ADMIN' || data.role === 'SELLER') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
      
    } catch (err) {
      console.error('Lỗi login:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      
      <InputField
        label="Email"
        id="email"
        name="email"
        type="email"
        placeholder="Ví dụ: nguyenvana@gmail.com"
        value={formData.email}
        onChange={handleChange}
        required
        disabled={loading}
        icon={
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 7.00005L10.2 11.65C11.2667 12.45 12.7333 12.45 13.8 11.65L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        }
      />

      <InputField
        label="Mật khẩu"
        id="password"
        name="password"
        type="password"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
        required
        disabled={loading}
        icon={
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 10V14M8 10V14M16 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          </svg>
        }
      />

      <div className="form-actions-row">
        <label className="checkbox-container">
          <input type="checkbox" disabled={loading} />
          <span className="checkmark"></span>
          Ghi nhớ đăng nhập
        </label>
        <a href="#forgot" className="forgot-password">Quên mật khẩu?</a>
      </div>

      <button type="submit" className="btn-primary cyber-button" disabled={loading}>
        {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
        <span className="btn-glitch"></span>
      </button>

      <div className="auth-switch">
        <span>Chưa có tài khoản? </span>
        <button type="button" onClick={toggleMode} className="switch-btn" disabled={loading}>
          ĐĂNG KÝ NGAY
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
