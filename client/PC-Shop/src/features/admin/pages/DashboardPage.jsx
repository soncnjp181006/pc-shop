import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../../utils/api';
import './DashboardPage.css';

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiFetch('/user/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          // Kiểm tra lại role để đảm bảo an toàn
          if (userData.role === 'CUSTOMER') {
            navigate('/home');
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    navigate('/');
  };

  if (!user) return <div className="loading">Đang tải...</div>;

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/hero.png" alt="Logo" className="sidebar-logo" />
          <span className="logo-text">PC SHOP ADMIN</span>
        </div>
        <nav className="sidebar-nav">
          <Link to="/admin" className="nav-item active">Tổng quan</Link>
          <Link to="/admin/products" className="nav-item">Quản lý sản phẩm</Link>
          <Link to="/admin/orders" className="nav-item">Quản lý đơn hàng</Link>
          <Link to="/admin/users" className="nav-item">Quản lý người dùng</Link>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">Đăng xuất</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <h1>Chào mừng, {user.username} ({user.role})</h1>
          <div className="user-info">
            <span>Phiên đăng nhập: {user.role}</span>
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <h3>Tổng đơn hàng</h3>
            <p className="stat-value">128</p>
          </div>
          <div className="stat-card">
            <h3>Doanh thu</h3>
            <p className="stat-value">45.000.000đ</p>
          </div>
          <div className="stat-card">
            <h3>Khách hàng mới</h3>
            <p className="stat-value">12</p>
          </div>
        </section>

        <section className="recent-activity">
          <h2>Hoạt động gần đây</h2>
          <div className="activity-list">
            <p>Chưa có dữ liệu hoạt động thực tế.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
