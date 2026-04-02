import React, { useState } from 'react';
import InputField from '../../../components/common/InputField/InputField';

const RegisterForm = ({ toggleMode }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu không khớp!");
      return;
    }

    if (!isTermsAccepted) {
      setError("Vui lòng đồng ý với Điều khoản dịch vụ!");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Đăng ký thất bại. Vui lòng thử lại!');
      }

      setSuccess('Đăng ký thành công! Bạn có thể chuyển sang đăng nhập.');
      setFormData({ username: '', email: '', password: '', confirmPassword: '' });
      setIsTermsAccepted(false);
      
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Lỗi kết nối máy chủ (Check backend)' : err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <InputField
        label="Họ và tên"
        id="username"
        name="username"
        type="text"
        placeholder="Ví dụ: Nguyễn Văn A"
        value={formData.username}
        onChange={handleChange}
        required
        disabled={isLoading}
        icon={
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }
      />

      <InputField
        label="Email"
        id="email"
        name="email"
        type="email"
        placeholder="Ví dụ: nguyenvana@gmail.com"
        value={formData.email}
        onChange={handleChange}
        required
        disabled={isLoading}
        icon={
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 7.00005L10.2 11.65C11.2667 12.45 12.7333 12.45 13.8 11.65L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        }
      />

      {/* Tách Password và Confirm Password thành 2 hàng riêng biệt theo yêu cầu của User */}
      <InputField
        label="Mật khẩu"
        id="reg-password"
        name="password"
        type="password"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
        required
        disabled={isLoading}
        icon={
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 10V14M8 10V14M16 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          </svg>
        }
      />

      <InputField
        label="Xác nhận mật khẩu"
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        placeholder="••••••••"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
        disabled={isLoading}
        icon={
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 10V14M8 10V14M16 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          </svg>
        }
      />

      <div className="form-actions-row margin-top">
        <label className="checkbox-container">
          <input 
            type="checkbox" 
            checked={isTermsAccepted}
            onChange={(e) => setIsTermsAccepted(e.target.checked)}
            disabled={isLoading}
          />
          <span className="checkmark"></span>
          Đồng ý với <a href="#terms" className="term-link">Điều khoản dịch vụ</a>
        </label>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <button type="submit" className="btn-primary cyber-button flex-row" disabled={isLoading}>
        {isLoading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG KÝ TÀI KHOẢN'}
        {!isLoading && <span className="btn-glitch"></span>}
      </button>

      <div className="auth-switch">
        <span>Đã có tài khoản? </span>
        <button type="button" onClick={toggleMode} className="switch-btn" disabled={isLoading}>
          ĐĂNG NHẬP
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;
