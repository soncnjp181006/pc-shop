import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Users, 
  ShoppingCart, 
  Settings, 
  BarChart3, 
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isCollapsed, toggleSidebar, onLogout, user }) => {
  const menuGroups = [
    {
      title: 'General',
      items: [
        { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
        { label: 'Báo cáo', icon: <BarChart3 size={20} />, path: '/admin/reports' },
      ]
    },
    {
      title: 'Quản lý',
      items: [
        { label: 'Sản phẩm', icon: <Package size={20} />, path: '/admin/products' },
        { label: 'Danh mục', icon: <FolderTree size={20} />, path: '/admin/categories' },
        { label: 'Người dùng', icon: <Users size={20} />, path: '/admin/users' },
        { label: 'Đơn hàng', icon: <ShoppingCart size={20} />, path: '/admin/orders' },
      ]
    },
    {
      title: 'Hệ thống',
      items: [
        { label: 'Cài đặt', icon: <Settings size={20} />, path: '/admin/settings' },
      ]
    }
  ];

  return (
    <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">P</div>
          {!isCollapsed && <span className="logo-text">PC Shop <small>Admin</small></span>}
        </div>
        <button className="toggle-btn" onClick={toggleSidebar}>
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="nav-group">
            {!isCollapsed && <h3 className="group-title">{group.title}</h3>}
            {group.items.map((item, iIdx) => (
              <NavLink 
                key={iIdx} 
                to={item.path} 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.name?.charAt(0) || 'A'}
          </div>
          {!isCollapsed && (
            <div className="user-details">
              <span className="user-name">{user?.name || 'Admin'}</span>
              <span className="user-role">{user?.role || 'Administrator'}</span>
            </div>
          )}
        </div>
        <button className="logout-btn" onClick={onLogout} title={isCollapsed ? 'Đăng xuất' : ''}>
          <LogOut size={20} />
          {!isCollapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
