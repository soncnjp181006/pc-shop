import React, { useState } from 'react';
import InputField from '../../../components/common/InputField/InputField';

const LoginForm = ({ toggleMode }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Đăng nhập với:', formData);
    // TODO: Add call to API
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <InputField
        label="Email"
        id="email"
        name="email"
        type="email"
        placeholder="Ví dụ: nguyenvana@gmail.com"
        value={formData.email}
        onChange={handleChange}
        required
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
        icon={
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 10V14M8 10V14M16 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          </svg>
        }
      />

      <div className="form-actions-row">
        <label className="checkbox-container">
          <input type="checkbox" />
          <span className="checkmark"></span>
          Ghi nhớ đăng nhập
        </label>
        <a href="#forgot" className="forgot-password">Quên mật khẩu?</a>
      </div>

      <button type="submit" className="btn-primary cyber-button">
        ĐĂNG NHẬP
        <span className="btn-glitch"></span>
      </button>

      <div className="auth-switch">
        <span>Chưa có tài khoản? </span>
        <button type="button" onClick={toggleMode} className="switch-btn">
          ĐĂNG KÝ NGAY
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
