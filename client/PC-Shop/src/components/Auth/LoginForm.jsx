import React, { useState } from 'react';

const LoginForm = ({ toggleMode }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt:', formData);
    // TODO: Add call to API
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="input-group">
        <label htmlFor="email">Email</label>
        <div className="input-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="input-icon">
            <path d="M4 7.00005L10.2 11.65C11.2667 12.45 12.7333 12.45 13.8 11.65L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="pilot@squad.com"
            value={formData.email}
            onChange={handleChange}
            required
            className="glow-input"
          />
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="password">Password</label>
        <div className="input-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="input-icon">
            <path d="M12 10V14M8 10V14M16 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            className="glow-input"
          />
        </div>
      </div>

      <div className="form-actions-row">
        <label className="checkbox-container">
          <input type="checkbox" />
          <span className="checkmark"></span>
          Remember Me
        </label>
        <a href="#forgot" className="forgot-password">Lost Password?</a>
      </div>

      <button type="submit" className="btn-primary cyber-button">
        INITIATE LOGIN
        <span className="btn-glitch"></span>
      </button>

      <div className="auth-switch">
        <span>No account? </span>
        <button type="button" onClick={toggleMode} className="switch-btn">
          REGISTER HERE
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
