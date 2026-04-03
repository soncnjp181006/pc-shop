import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../../utils/api';
import './ProfilePage.css';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Theme initialization
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.add('light');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.remove('light');
    }

    const fetchUser = async () => {
      try {
        const response = await apiFetch('/user/me');

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          console.error('Lỗi khi lấy thông tin user:', response.status);
          // Cho phép ở lại trang profile để tránh bị đá về login vô lý
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, [navigate]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/');
  };

  if (!user) return <div className="loading">Đang tải thông tin...</div>;

  return (
    <div className="profile-container">
      <header className="main-header">
        <div className="header-content">
          <Link to="/home" className="logo-section">
            <img src="/hero.png" alt="PC Shop Logo" className="header-logo" />
            <span className="logo-text">PC SHOP</span>
          </Link>
          <div className="header-actions">
            <button className="theme-toggle-header" onClick={toggleTheme}>
              {isDarkMode ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
            <button className="logout-header-btn" onClick={handleLogout} title="Đăng xuất">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="profile-content">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <h2>Thông tin tài khoản</h2>
          </div>
          
          <div className="profile-info">
            <div className="info-group">
              <label>Tên người dùng</label>
              <div className="info-value">{user.username}</div>
            </div>
            <div className="info-group">
              <label>Email liên kết</label>
              <div className="info-value">{user.email}</div>
            </div>
            <div className="info-group">
              <label>ID Tài khoản</label>
              <div className="info-value">#{user.id}</div>
            </div>
          </div>

          <button className="btn-edit-profile">Chỉnh sửa thông tin</button>
          <button className="btn-logout-card" onClick={handleLogout}>Đăng xuất tài khoản</button>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
