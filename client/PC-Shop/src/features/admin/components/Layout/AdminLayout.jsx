import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { apiFetch } from '../../../../utils/api';
import '../../styles/admin-theme.css';
import './AdminLayout.css';

const AdminLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed');
    return saved === 'true';
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('admin_theme') || 'light';
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('admin_sidebar_collapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('admin_theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchUser = async () => {
      // Check if we already have user info in a global state or localStorage to avoid flash
      const cachedUser = localStorage.getItem('user_data');
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
          setLoading(false);
        } catch (e) {}
      }

      try {
        const response = await apiFetch('/user/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          localStorage.setItem('user_data', JSON.stringify(userData));
          if (userData.role === 'CUSTOMER') {
            navigate('/home');
          }
        } else {
          localStorage.removeItem('user_data');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    navigate('/login');
  };

  if (loading && !user) {
    return (
      <div className="admin-loading">
        <div className="loader"></div>
        <span>Đang chuẩn bị hệ thống...</span>
      </div>
    );
  }

  return (
    <div className={`admin-scope admin-layout ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
        onLogout={handleLogout}
        user={user}
      />
      
      <main className="admin-main">
        <Header theme={theme} toggleTheme={toggleTheme} user={user} />
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
