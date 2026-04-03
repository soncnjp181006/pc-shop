import React, { useState, useEffect } from 'react';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import '../styles/AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (!isDarkMode) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [isDarkMode]);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="theme-toggle-wrapper">
          <button 
            className="theme-btn" 
            onClick={toggleTheme}
            title={isDarkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
          >
            {isDarkMode ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
        </div>

        <div className="auth-header">
          <div className="auth-logo-wrapper">
            <img src="/hero.png" alt="PC Shop Logo" className="auth-logo" />
          </div>
          <h2 className="auth-title">
            <span className="gradient-text">PC SHOP</span>
          </h2>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Đăng nhập để theo dõi giỏ hàng và thanh toán.' 
              : 'Trở thành thành viên để nhận các ưu đãi đặc quyền.'}
          </p>
        </div>

        <div className="auth-content">
          {isLogin ? (
            <LoginForm toggleMode={toggleAuthMode} />
          ) : (
            <RegisterForm toggleMode={toggleAuthMode} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
