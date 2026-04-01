import React, { useState } from 'react';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import '../styles/AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
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
