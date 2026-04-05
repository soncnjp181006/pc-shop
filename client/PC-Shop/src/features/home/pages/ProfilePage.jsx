import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../utils/api';
import { 
  Zap, Star, UserIcon, ShieldCheck, Package, Gift, ShoppingCart, 
  Home, Settings, LogOut, ClipboardList, Edit2, Heart, CreditCard, 
  Bell, Users, Lock, Key, Smartphone, Mail, Monitor, Inbox, Gamepad2 
} from 'lucide-react';
import './ProfilePage.css';

/* ── Sidebar Nav ── */
const NavBtn = ({ icon, label, active, onClick, danger }) => (
  <button
    className={`sidebar-nav-btn ${active ? 'active' : ''} ${danger ? 'danger' : ''}`}
    onClick={onClick}
  >
    <span className="nav-icon">{icon}</span>
    <span>{label}</span>
  </button>
);

/* ── Info Field ── */
const InfoField = ({ label, value, full, variant }) => (
  <div className={`info-field ${full ? 'full' : ''}`}>
    <span className="field-label">{label}</span>
    <div className={`field-value ${variant || ''}`}>{value}</div>
  </div>
);

/* ── Security Item ── */
const SecurityItem = ({ icon, label, sub, status }) => (
  <div className="security-item">
    <div className="security-item-left">
      <div className="security-icon">{icon}</div>
      <div>
        <div className="security-info-label">{label}</div>
        <div className="security-info-sub">{sub}</div>
      </div>
    </div>
    <span className={`security-badge ${status === 'active' ? 'active' : 'passive'}`}>
      {status === 'active' ? '✓ Đã kích hoạt' : 'Thiết lập ngay'}
    </span>
  </div>
);

/* ── Quick Link ── */
const QuickLink = ({ icon, label, onClick }) => (
  <button className="quick-link-item" onClick={onClick}>
    <div className="quick-link-icon-wrap">{icon}</div>
    <span className="quick-link-label">{label}</span>
  </button>
);

/* ── Main Page ── */
const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiFetch('/user/me');
        if (response.ok) {
          setUser(await response.json());
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    navigate('/');
  };

  if (!user) return (
    <div className="loading">
      <div className="profile-loading-spinner" />
      <span>Đang tải thông tin tài khoản...</span>
    </div>
  );

  const isAdmin = localStorage.getItem('user_role') === 'ADMIN';
  const joinDate = new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' });

  return (
    <div className="profile-container animate-fade-in">
      <div className="profile-layout">

        {/* ── Hero Section ── */}
        <div className="profile-hero">
          <div className="profile-hero-bg" />
          <div className="profile-hero-content">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="avatar-status" title="Đang trực tuyến" />
            </div>

            <div className="profile-hero-info">
              <div className="profile-greeting">Xin chào 👋</div>
              <div className="profile-username">{user.username}</div>
              <div className="profile-email-display">{user.email}</div>
              <div className="profile-tags">
                <span className="profile-tag member">
                  {isAdmin ? <><Zap size={14} className="tag-icon" /> Quản trị viên</> : <><Star size={14} className="tag-icon" /> Thành viên</>}
                </span>
                <span className="profile-tag verified">✓ Đã xác thực</span>
              </div>
            </div>
          </div>

          <div className="profile-stats-row">
            <div className="stat-item">
              <div className="stat-value">#{user.id}</div>
              <div className="stat-label">ID Tài khoản</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">0</div>
              <div className="stat-label">Đơn hàng</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">0</div>
              <div className="stat-label">Điểm thưởng</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ fontSize: '1rem' }}>{joinDate}</div>
              <div className="stat-label">Ngày tham gia</div>
            </div>
          </div>
        </div>

        {/* ── Main Body ── */}
        <div className="profile-body">

          {/* Sidebar Nav */}
          <nav className="profile-sidebar">
            <div className="sidebar-section-label">Tài khoản</div>
            <NavBtn icon={<UserIcon size={18} />} label="Thông tin" active={activeTab === 'info'} onClick={() => setActiveTab('info')} />
            <NavBtn icon={<ShieldCheck size={18} />} label="Bảo mật" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
            <NavBtn icon={<Package size={18} />} label="Đơn hàng" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
            <NavBtn icon={<CreditCard size={18} />} label="Thanh toán & giao hàng" onClick={() => navigate('/profile/payment')} />
            <NavBtn icon={<Gift size={18} />} label="Ưu đãi" active={activeTab === 'deals'} onClick={() => setActiveTab('deals')} />
            <div className="sidebar-divider" />
            <div className="sidebar-section-label">Điều hướng</div>
            <NavBtn icon={<ShoppingCart size={18} />} label="Giỏ hàng" onClick={() => navigate('/cart')} />
            <NavBtn icon={<Home size={18} />} label="Trang chủ" onClick={() => navigate('/home')} />
            {isAdmin && <NavBtn icon={<Settings size={18} />} label="Quản trị" onClick={() => navigate('/admin')} />}
            <div className="sidebar-divider" />
            <NavBtn icon={<LogOut size={18} />} label="Đăng xuất" danger onClick={handleLogout} />
          </nav>

          {/* Main Panel */}
          <div className="profile-main-panel">

            {/* ── Tab: Thông tin ── */}
            {activeTab === 'info' && (
              <>
                <div className="profile-section-card">
                  <div className="section-card-header">
                    <div className="section-card-title">
                      <span className="section-card-icon"><ClipboardList size={22} /></span>
                      Thông tin cá nhân
                    </div>
                    <button className="btn-edit-section">
                      <Edit2 size={16} /> Chỉnh sửa
                    </button>
                  </div>
                  <div className="section-card-body">
                    <div className="info-grid">
                      <InfoField label="Tên người dùng" value={user.username} />
                      <InfoField label="ID Tài khoản" value={`#${user.id}`} variant="id-field" />
                      <InfoField label="Email liên kết" value={user.email} full />
                      <InfoField label="Vai trò" value={isAdmin ? 'Quản trị viên' : 'Khách hàng'} />
                      <InfoField label="Ngày tham gia" value={joinDate} />
                    </div>
                  </div>
                </div>

                <div className="profile-section-card">
                  <div className="section-card-header">
                    <div className="section-card-title">
                      <span className="section-card-icon"><Zap size={22} /></span>
                      Truy cập nhanh
                    </div>
                  </div>
                  <div className="section-card-body">
                    <div className="quick-links-grid">
                      <QuickLink icon={<ShoppingCart size={24} />} label="Giỏ hàng" onClick={() => navigate('/cart')} />
                      <QuickLink icon={<Package size={24} />} label="Đơn hàng" onClick={() => setActiveTab('orders')} />
                      <QuickLink icon={<Heart size={24} />} label="Yêu thích" onClick={() => navigate('/products')} />
                      <QuickLink icon={<CreditCard size={24} />} label="Thanh toán & địa chỉ" onClick={() => navigate('/profile/payment')} />
                      <QuickLink icon={<Bell size={24} />} label="Thông báo" onClick={() => {}} />
                      <QuickLink icon={<Users size={24} />} label="Giới thiệu" onClick={() => {}} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Tab: Bảo mật ── */}
            {activeTab === 'security' && (
              <div className="profile-section-card">
                <div className="section-card-header">
                  <div className="section-card-title">
                    <span className="section-card-icon"><Lock size={22} /></span>
                    Bảo mật tài khoản
                  </div>
                </div>
                <div className="section-card-body">
                  <div className="security-items">
                    <SecurityItem
                      icon={<Key size={24} />}
                      label="Mật khẩu"
                      sub="Đã cài đặt mật khẩu mạnh"
                      status="active"
                    />
                    <SecurityItem
                      icon={<Smartphone size={24} />}
                      label="Xác thực 2 bước"
                      sub="Bảo vệ tài khoản bằng OTP"
                      status="passive"
                    />
                    <SecurityItem
                      icon={<Mail size={24} />}
                      label="Email đã xác minh"
                      sub={user.email}
                      status="active"
                    />
                    <SecurityItem
                      icon={<Monitor size={24} />}
                      label="Phiên đăng nhập"
                      sub="Quản lý các thiết bị đã đăng nhập"
                      status="passive"
                    />
                  </div>
                </div>

                <div className="logout-zone">
                  <p>⚠ Đăng xuất sẽ kết thúc phiên làm việc hiện tại trên thiết bị này.</p>
                  <button className="btn-logout-card" onClick={handleLogout}>
                    <LogOut size={18} /> Đăng xuất tài khoản
                  </button>
                </div>
              </div>
            )}

            {/* ── Tab: Đơn hàng ── */}
            {activeTab === 'orders' && (
              <div className="profile-section-card">
                <div className="section-card-header">
                  <div className="section-card-title">
                    <span className="section-card-icon"><Package size={22} /></span>
                    Lịch sử đơn hàng
                  </div>
                </div>
                <div className="section-card-body">
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                      <Inbox size={64} color="var(--text-tertiary)" strokeWidth={1} />
                    </div>
                    <h3 style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Chưa có đơn hàng</h3>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 300 }}>
                      Bắt đầu mua sắm để xem lịch sử đơn hàng của bạn tại đây.
                    </p>
                    <button
                      onClick={() => navigate('/products')}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '12px 28px', borderRadius: 100,
                        background: 'var(--accent-gradient)', color: 'white',
                        border: 'none', fontWeight: 700, cursor: 'pointer',
                        fontSize: '0.9rem', marginTop: 8
                      }}
                    >
                      Mua sắm ngay →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Ưu đãi ── */}
            {activeTab === 'deals' && (
              <div className="profile-section-card">
                <div className="section-card-header">
                  <div className="section-card-title">
                    <span className="section-card-icon"><Gift size={22} /></span>
                    Ưu đãi & Điểm thưởng
                  </div>
                </div>
                <div className="section-card-body">
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                      <Gamepad2 size={64} color="var(--text-tertiary)" strokeWidth={1} />
                    </div>
                    <h3 style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Sắp ra mắt!</h3>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 320 }}>
                      Chương trình tích điểm và ưu đãi độc quyền cho thành viên đang được phát triển.
                    </p>
                    <div style={{
                      padding: '12px 24px',
                      background: 'rgba(99,102,241,0.1)',
                      borderRadius: 100,
                      color: 'var(--accent-vibrant)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      border: '1px solid rgba(99,102,241,0.2)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Bell size={16} /> Nhận thông báo khi ra mắt
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
