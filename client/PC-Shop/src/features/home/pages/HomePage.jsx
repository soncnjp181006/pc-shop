import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroLogo from '../../../assets/hero.png';
import './HomePage.css';

const HomePage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
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
        } else {
          localStorage.removeItem('access_token');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        navigate('/');
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
  };

  return (
    <div className="home-container">
      <header className="main-header">
        <div className="header-content">
          <div className="logo-section" onClick={() => navigate('/home')}>
            <img src={heroLogo} alt="PC Shop Logo" className="header-logo" />
            <span className="logo-text">PC SHOP</span>
          </div>

          <div className="header-actions">
            <div className="search-bar">
              <input type="text" placeholder="Bạn muốn mua gì hôm nay?" />
              <button className="search-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </div>

            <div className="header-item">
              <div className="icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div className="item-text">
                <span>Xem giá tại</span>
                <strong>Hồ Chí Minh</strong>
              </div>
            </div>

            <div className="header-item cart-item">
              <div className="icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              </div>
              <span>Giỏ hàng</span>
            </div>

            <div className="header-item user-item" onClick={handleLogout}>
              <div className="icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className="item-text">
                <span>Chào,</span>
                <strong>{user ? user.username : 'Đang tải...'}</strong>
              </div>
            </div>
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
