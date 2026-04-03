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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    base_price: '',
    category_id: '',
    image_url: '',
    is_active: true
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    parent_id: '',
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);
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
      fetchCategories(); // Cần lấy danh mục để chọn khi thêm sản phẩm
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Tự động tạo slug từ tên sản phẩm
    if (name === 'name') {
      const slug = value.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Xóa dấu
        .replace(/[^\w ]+/g, '') // Xóa ký tự đặc biệt
        .replace(/ +/g, '-'); // Thay khoảng trắng bằng gạch ngang
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleCategoryInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (name === 'name') {
      const slug = value.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
      setCategoryFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!formData.category_id) {
      alert('Vui lòng chọn danh mục sản phẩm!');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        category_id: parseInt(formData.category_id),
        seller_id: user.id
      };
      
      const response = await productsApi.create(payload);
      if (response.ok) {
        alert('Thêm sản phẩm thành công!');
        setShowAddModal(false);
        setFormData({
          name: '', slug: '', description: '', base_price: '', category_id: '', image_url: '', is_active: true
        });
        fetchProducts(); // Tải lại danh sách
      } else {
        const error = await response.json();
        alert('Lỗi: ' + (error.detail || 'Không thể thêm sản phẩm'));
      }
    } catch (error) {
      console.error('Lỗi khi thêm sản phẩm:', error);
      alert('Đã có lỗi xảy ra!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...categoryFormData,
        parent_id: categoryFormData.parent_id ? parseInt(categoryFormData.parent_id) : null
      };
      
      const response = await categoriesApi.create(payload);
      if (response.ok) {
        alert('Thêm danh mục thành công!');
        setShowAddCategoryModal(false);
        setCategoryFormData({
          name: '', slug: '', parent_id: '', is_active: true
        });
        fetchCategories();
      } else {
        const error = await response.json();
        alert('Lỗi: ' + (error.detail || 'Không thể thêm danh mục'));
      }
    } catch (error) {
      console.error('Lỗi khi thêm danh mục:', error);
      alert('Đã có lỗi xảy ra!');
    } finally {
      setSubmitting(false);
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
                <button className="btn-add-new" onClick={() => setShowAddModal(true)}>+ Thêm sản phẩm</button>
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
                <button className="btn-add-new" onClick={() => setShowAddCategoryModal(true)}>+ Thêm danh mục</button>
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

      {showAddModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal glass-panel animate-fade-in product-form-modal">
            <div className="modal-header">
              <h3>Thêm sản phẩm mới</h3>
              <button className="btn-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form className="modal-content" onSubmit={handleCreateProduct}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên sản phẩm</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: Card đồ họa ASUS ROG Strix..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Đường dẫn (Slug)</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="asus-rog-strix"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Giá cơ bản (VNĐ)</label>
                  <input
                    type="number"
                    name="base_price"
                    value={formData.base_price}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 15000000"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Danh mục</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(cat => (
                      <React.Fragment key={cat.id}>
                        <option value={cat.id}>{cat.name}</option>
                        {cat.children && cat.children.map(sub => (
                          <option key={sub.id} value={sub.id}>
                            &nbsp;&nbsp;— {sub.name}
                          </option>
                        ))}
                      </React.Fragment>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Link ảnh sản phẩm (Google Drive/URL)</label>
                  <input
                    type="text"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="Dán link ảnh tại đây..."
                  />
                  {formData.image_url && (
                    <div className="image-preview-container">
                      <img src={getImageUrl(formData.image_url)} alt="Preview" />
                      <span>Xem trước ảnh</span>
                    </div>
                  )}
                </div>
                <div className="form-group full-width">
                  <label>Mô tả sản phẩm</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Nhập chi tiết về sản phẩm..."
                    rows="4"
                  ></textarea>
                </div>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    Cho phép bán sản phẩm này ngay lập tức
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddCategoryModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal glass-panel animate-fade-in product-form-modal">
            <div className="modal-header">
              <h3>Thêm danh mục mới</h3>
              <button className="btn-close" onClick={() => setShowAddCategoryModal(false)}>✕</button>
            </div>
            <form className="modal-content" onSubmit={handleCreateCategory}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên danh mục</label>
                  <input
                    type="text"
                    name="name"
                    value={categoryFormData.name}
                    onChange={handleCategoryInputChange}
                    placeholder="Ví dụ: Linh kiện PC"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Đường dẫn (Slug)</label>
                  <input
                    type="text"
                    name="slug"
                    value={categoryFormData.slug}
                    onChange={handleCategoryInputChange}
                    placeholder="linh-kien-pc"
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label>Danh mục cha (Để trống nếu là danh mục gốc)</label>
                  <select
                    name="parent_id"
                    value={categoryFormData.parent_id}
                    onChange={handleCategoryInputChange}
                  >
                    <option value="">-- Danh mục gốc --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={categoryFormData.is_active}
                      onChange={handleCategoryInputChange}
                    />
                    Hiển thị danh mục này
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowAddCategoryModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
