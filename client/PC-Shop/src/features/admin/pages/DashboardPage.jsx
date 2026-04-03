import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, productsApi, categoriesApi, getImageUrl } from '../../../utils/api';
import './DashboardPage.css';

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const fetchVariants = async (productId) => {
    setLoadingVariants(true);
    try {
      const response = await productsApi.getVariants(productId);
      if (response.ok) {
        const data = await response.json();
        setVariants(data);
      }
    } catch (error) {
      console.error('Lỗi khi tải biến thể:', error);
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleShowVariants = (product) => {
    setSelectedProduct(product);
    fetchVariants(product.id);
  };
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiFetch('/user/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
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

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'categories') {
      fetchCategories();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productsApi.getAll({ limit: 50 });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await categoriesApi.getTree();
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh mục:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    navigate('/');
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        const response = await productsApi.delete(id);
        if (response.ok) {
          setProducts(products.filter(p => p.id !== id));
        }
      } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error);
      }
    }
  };

  if (!user) return <div className="loading-container"><div className="loader"></div></div>;

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar glass-panel">
        <div className="admin-logo-section">
          <img src="/hero.png" alt="PC SHOP" className="admin-logo" />
          <div className="admin-logo-text">
            <span>PC SHOP</span>
            <strong>ADMIN PORTAL</strong>
          </div>
        </div>

        <nav className="admin-nav">
          <button 
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="nav-icon">📊</span>
            Tổng quan
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <span className="nav-icon">📦</span>
            Quản lý sản phẩm
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <span className="nav-icon">📁</span>
            Danh mục hệ thống
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon">👥</span>
            Người dùng & Seller
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-card glass-panel">
            <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <strong>{user.username}</strong>
              <span>{user.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="admin-logout-btn">
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header animate-fade-in">
          <div className="header-info">
            <h1>{activeTab === 'overview' ? 'Bảng điều khiển' : 
                 activeTab === 'products' ? 'Quản lý kho hàng' : 
                 activeTab === 'categories' ? 'Cấu trúc danh mục' : 'Quản trị hệ thống'}</h1>
            <p>Chào mừng trở lại, {user.username}!</p>
          </div>
          <div className="header-actions">
            <button className="btn-primary" onClick={() => window.location.href = '/home'}>Xem shop</button>
          </div>
        </header>

        <div className="admin-content animate-fade-in">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="stats-grid">
                <div className="admin-stat-card glass-panel">
                  <div className="stat-icon products-icon">📦</div>
                  <div className="stat-info">
                    <h3>Sản phẩm</h3>
                    <p>1,240</p>
                    <span className="stat-trend up">+12% tháng này</span>
                  </div>
                </div>
                <div className="admin-stat-card glass-panel">
                  <div className="stat-icon users-icon">👥</div>
                  <div className="stat-info">
                    <h3>Khách hàng</h3>
                    <p>856</p>
                    <span className="stat-trend up">+5% tháng này</span>
                  </div>
                </div>
                <div className="admin-stat-card glass-panel">
                  <div className="stat-icon orders-icon">🛒</div>
                  <div className="stat-info">
                    <h3>Đơn hàng</h3>
                    <p>320</p>
                    <span className="stat-trend down">-2% tháng này</span>
                  </div>
                </div>
                <div className="admin-stat-card glass-panel">
                  <div className="stat-icon revenue-icon">💰</div>
                  <div className="stat-info">
                    <h3>Doanh thu</h3>
                    <p>1.5B ₫</p>
                    <span className="stat-trend up">+18% tháng này</span>
                  </div>
                </div>
              </div>

              <div className="recent-activity-section glass-panel">
                <h2>Hoạt động gần đây</h2>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-indicator add"></div>
                    <div className="activity-desc">
                      <strong>Thêm sản phẩm mới</strong>: RTX 5090 Ti đã được cập nhật vào kho.
                      <span>15 phút trước</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-indicator update"></div>
                    <div className="activity-desc">
                      <strong>Cập nhật tồn kho</strong>: 15 màn hình Dell UltraSharp vừa được nhập kho.
                      <span>1 giờ trước</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-indicator user"></div>
                    <div className="activity-desc">
                      <strong>Người dùng mới</strong>: Nguyen Van A vừa đăng ký tài khoản.
                      <span>2 giờ trước</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="management-tab">
              <div className="table-header-actions">
                <div className="search-box glass-panel">
                  <input type="text" placeholder="Tìm tên sản phẩm, SKU..." />
                </div>
                <button className="btn-add-new">+ Thêm sản phẩm</button>
              </div>

              <div className="admin-table-container glass-panel">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ảnh</th>
                      <th>Sản phẩm</th>
                      <th>Danh mục</th>
                      <th>Giá cơ bản</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="6" className="text-center">Đang tải dữ liệu...</td></tr>
                    ) : products.length > 0 ? (
                      products.map(p => (
                        <tr key={p.id}>
                          <td>
                            <img src={getImageUrl(p.image_url)} alt={p.name} className="table-img" />
                          </td>
                          <td>
                            <div className="table-product-info">
                              <strong>{p.name}</strong>
                              <span>ID: {p.id}</span>
                            </div>
                          </td>
                          <td>{p.category_name || 'N/A'}</td>
                          <td>{p.base_price.toLocaleString()} ₫</td>
                          <td>
                            <span className={`status-tag ${p.is_active ? 'active' : 'inactive'}`}>
                              {p.is_active ? 'Đang bán' : 'Ẩn'}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button 
                                className="btn-variants" 
                                title="Biến thể"
                                onClick={() => handleShowVariants(p)}
                              >💎</button>
                              <button className="btn-edit" title="Chỉnh sửa">✏️</button>
                              <button 
                                className="btn-delete" 
                                title="Xóa"
                                onClick={() => handleDeleteProduct(p.id)}
                              >🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="6" className="text-center">Không có sản phẩm nào.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="management-tab">
              <div className="table-header-actions">
                <button className="btn-add-new">+ Thêm danh mục</button>
              </div>
              <div className="category-tree-container glass-panel">
                {loading ? (
                  <p className="text-center">Đang tải...</p>
                ) : categories.length > 0 ? (
                  <div className="cat-tree">
                    {categories.map(cat => (
                      <div key={cat.id} className="cat-node">
                        <div className="cat-node-content">
                          <span className="cat-icon">📁</span>
                          <strong>{cat.name}</strong>
                          <div className="cat-actions">
                            <button className="btn-small">Sửa</button>
                            <button className="btn-small danger">Xóa</button>
                          </div>
                        </div>
                        {cat.children && cat.children.length > 0 && (
                          <div className="cat-children">
                            {cat.children.map(sub => (
                              <div key={sub.id} className="cat-node sub">
                                <span className="cat-icon">📄</span>
                                {sub.name}
                                <div className="cat-actions">
                                  <button className="btn-small">Sửa</button>
                                  <button className="btn-small danger">Xóa</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center">Không có danh mục nào.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedProduct && (
        <div className="admin-modal-overlay">
          <div className="admin-modal glass-panel animate-fade-in">
            <div className="modal-header">
              <h3>Biến thể của: {selectedProduct.name}</h3>
              <button className="btn-close" onClick={() => setSelectedProduct(null)}>✕</button>
            </div>
            <div className="modal-content">
              {loadingVariants ? (
                <p>Đang tải biến thể...</p>
              ) : variants.length > 0 ? (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Thuộc tính</th>
                      <th>Giá cộng thêm</th>
                      <th>Tồn kho</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map(v => (
                      <tr key={v.id}>
                        <td>{v.sku}</td>
                        <td>
                          {Object.entries(v.attributes).map(([key, value]) => (
                            <span key={key} className="attr-tag">{key}: {value}</span>
                          ))}
                        </td>
                        <td>+{v.price_override.toLocaleString()} ₫</td>
                        <td>{v.stock_quantity}</td>
                        <td>
                          <button className="btn-small">Sửa</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Chưa có biến thể nào cho sản phẩm này.</p>
              )}
              <button className="btn-add-new mt-20">+ Thêm biến thể</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
