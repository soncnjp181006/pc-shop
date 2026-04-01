import React, { useState } from 'react';

const RegisterForm = ({ toggleMode }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    console.log('Registration attempt:', formData);
    // TODO: Add call to API
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="input-group">
        <label htmlFor="username">Username</label>
        <div className="input-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="input-icon">
            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="AgentName"
            value={formData.username}
            onChange={handleChange}
            required
            className="glow-input"
          />
        </div>
      </div>

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

      <div className="input-group-row">
        <div className="input-group half-width">
          <label htmlFor="reg-password">Password</label>
          <div className="input-icon-wrapper">
            <input
              type="password"
              id="reg-password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              className="glow-input"
            />
          </div>
        </div>

        <div className="input-group half-width">
          <label htmlFor="confirmPassword">Confirm</label>
          <div className="input-icon-wrapper">
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="glow-input"
            />
          </div>
        </div>
      </div>

      <div className="form-actions-row margin-top">
        <label className="checkbox-container">
          <input type="checkbox" required />
          <span className="checkmark"></span>
          I accept the <a href="#terms" className="term-link">Terms & Conditions</a>
        </label>
      </div>

      <button type="submit" className="btn-primary cyber-button flex-row">
        CREATE ACCOUNT
        <span className="btn-glitch"></span>
      </button>

      <div className="auth-switch">
        <span>Already in squad? </span>
        <button type="button" onClick={toggleMode} className="switch-btn">
          LOGIN HERE
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;
