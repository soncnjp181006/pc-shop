import React from 'react';
import { 
  Bell, 
  Search, 
  Moon, 
  Sun, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = ({ theme, toggleTheme, user }) => {
  const location = useLocation();
  
  // Breadcrumb logic
  const pathnames = location.pathname.split('/').filter((x) => x);
  const breadcrumbs = pathnames.map((name, index) => {
    const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
    const isLast = index === pathnames.length - 1;
    
    // Capitalize and translate common paths
    const labelMap = {
      admin: 'Quản trị',
      dashboard: 'Tổng quan',
      products: 'Sản phẩm',
      categories: 'Danh mục',
      users: 'Người dùng',
      orders: 'Đơn hàng',
      settings: 'Cài đặt',
      reports: 'Báo cáo'
    };
    
    const label = labelMap[name] || name.charAt(0).toUpperCase() + name.slice(1);

    return (
      <React.Fragment key={routeTo}>
        {index > 0 && <ChevronRight size={14} className="breadcrumb-separator" />}
        {isLast ? (
          <span className="breadcrumb-current">{label}</span>
        ) : (
          <Link to={routeTo} className="breadcrumb-link">{label}</Link>
        )}
      </React.Fragment>
    );
  });

  return (
    <header className="admin-header">
      <div className="header-left">
        <div className="breadcrumb">
          {breadcrumbs}
        </div>
      </div>

      <div className="header-right">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Tìm kiếm nhanh..." />
          <span className="search-shortcut">⌘K</span>
        </div>

        <div className="header-actions">
          <Link to="/" className="action-btn" title="Xem trang chủ">
            <ExternalLink size={20} />
          </Link>
          
          <Link to="/products" className="action-btn-pill" title="Check trang sản phẩm">
            <span className="btn-text">Check SP</span>
            <ExternalLink size={16} />
          </Link>
          
          <button className="action-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Sáng' : 'Tối'}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button className="action-btn notification-btn" title="Thông báo">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </button>

          <div className="header-user">
            <div className="user-avatar">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="user-info-desktop">
              <span className="user-name">{user?.name || 'Admin'}</span>
              <span className="user-role">{user?.role || 'Administrator'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
