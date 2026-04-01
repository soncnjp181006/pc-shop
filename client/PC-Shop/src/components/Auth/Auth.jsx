import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h2 className="auth-title">
            <span className="gradient-text">{isLogin ? 'WELCOME BACK' : 'JOIN THE SQUAD'}</span>
          </h2>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Gear up and continue your journey.' 
              : 'Create your account to unlock premium gear.'}
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

export default Auth;
