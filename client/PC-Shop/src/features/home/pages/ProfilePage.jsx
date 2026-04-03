import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../../utils/api';
import './ProfilePage.css';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiFetch('/user/me');

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          console.error('Lỗi khi lấy thông tin user:', response.status);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, [navigate]);

  if (!user) return <div className="loading">Đang tải thông tin...</div>;

  return (
    <div className="profile-container animate-fade-in">
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
