import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
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
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/v1/user/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else if (response.status === 401) {
          // Chỉ xóa token và chuyển hướng nếu thực sự hết hạn phiên
          localStorage.removeItem('access_token');
          navigate('/');
        } else {
          console.error('Lỗi khi lấy thông tin user:', response.status);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        // Không navigate về / khi gặp lỗi mạng để tránh thoát ra ngoài vô lý
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

  const handleLogout = (e) => {
    e.stopPropagation(); // Prevent navigation when logging out
    localStorage.removeItem('access_token');
    navigate('/');
  };

  return (
    <div className="home-container">
      <header className="main-header">
        <div className="header-content">
          <div className="header-left">
            <Link to="/home" className="logo-section">
              <img src="/hero.png" alt="PC Shop Logo" className="header-logo" />
              <span className="logo-text">PC SHOP</span>
            </Link>

            <div className="header-item location-item">
              <div className="icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div className="item-text">
                <span>Xem giá tại</span>
                <strong>Hồ Chí Minh</strong>
              </div>
            </div>
          </div>

          <div className="header-center">
            <div className="search-bar">
              <input type="text" placeholder="Bạn muốn mua gì hôm nay?" />
              <button className="search-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </div>
          </div>

          <div className="header-right">
            <button className="theme-toggle-header" onClick={toggleTheme} title="Đổi chế độ sáng/tối">
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

            <div className="header-item cart-item">
              <div className="icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              </div>
              <span>Giỏ hàng</span>
            </div>

            <div className="header-item user-item-wrapper" onClick={(e) => {
              e.preventDefault();
              navigate('/profile');
            }}>
              <div className="icon-wrapper user-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className="item-text">
                <span>Chào,</span>
                <strong>{user ? user.username : 'Đang tải...'}</strong>
              </div>
            </div>

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

      <main className="home-content">
        <div className="hero-banner">
          <h1>Chào mừng đến với PC Shop</h1>
          <p>Nơi cung cấp linh kiện PC hàng đầu Việt Nam</p>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
