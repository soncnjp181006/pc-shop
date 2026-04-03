import React, { useState, useEffect } from 'react';
import { productsApi, categoriesApi, getImageUrl } from '../../../utils/api';
import { Link, useSearchParams } from 'react-router-dom';
import './ProductListPage.css';

const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, pages: 1 });
  
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    category_id: searchParams.get('category_id') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    sort: searchParams.get('sort') || 'newest',
    brand: searchParams.get('brand') || '',
    in_stock: searchParams.get('in_stock') === 'true'
  });

  const brands = ["Apple", "ASUS", "MSI", "Gigabyte", "Dell", "HP", "Lenovo", "Razer"];
  const quickCategories = [
    { id: 'ram', name: 'RAM', icon: '⚡' },
    { id: 'monitor', name: 'Màn hình', icon: '🖥️' },
    { id: 'accessories', name: 'Phụ kiện', icon: '🖱️' }
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    const newParams = {};
    Object.keys(filters).forEach(key => {
      if (filters[key]) newParams[key] = filters[key];
    });
    setSearchParams(newParams);
  }, [filters, pagination.page]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getTree();
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh mục:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productsApi.getAll({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data);
        setPagination(prev => ({ ...prev, pages: data.pages }));
      }
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFilters(prev => ({ ...prev, [name]: val }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      q: '',
      category_id: '',
      min_price: '',
      max_price: '',
      sort: 'newest',
      brand: '',
      in_stock: false
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="product-list-page">
      <aside className="sidebar-fixed glass-panel">
        <div className="sidebar-group">
          <h3 className="group-label">Khám phá nhanh</h3>
          <div className="quick-cat-grid">
            {quickCategories.map(cat => (
              <button 
                key={cat.id}
                className={`quick-cat-item ${filters.q.toLowerCase().includes(cat.id) ? 'active' : ''}`}
                onClick={() => handleFilterChange({ target: { name: 'q', value: cat.name } })}
                title={cat.name}
              >
                <span className="quick-cat-icon">{cat.icon}</span>
                <span className="quick-cat-name">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-group">
          <h3 className="group-label">Danh mục</h3>
          <div className="category-list">
            <button 
              className={`category-item ${filters.category_id === '' ? 'active' : ''}`}
              onClick={() => handleFilterChange({ target: { name: 'category_id', value: '' } })}
            >
              Tất cả sản phẩm
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                className={`category-item ${filters.category_id == cat.id ? 'active' : ''}`}
                onClick={() => handleFilterChange({ target: { name: 'category_id', value: cat.id } })}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-group filter-group">
          <h3 className="group-label">Bộ lọc chi tiết</h3>
          
          <div className="sidebar-section hover-popover">
            <div className="section-header">
              <span className="section-title">Thương hiệu</span>
              <span className="selected-value">{filters.brand || 'Tất cả'}</span>
            </div>
            <div className="popover-content glass-panel">
              <div className="brand-grid">
                <label className="brand-option">
                  <input 
                    type="radio" 
                    name="brand" 
                    value="" 
                    checked={filters.brand === ''}
                    onChange={handleFilterChange}
                  />
                  <span>Tất cả</span>
                </label>
                {brands.map(brand => (
                  <label key={brand} className="brand-option">
                    <input 
                      type="radio" 
                      name="brand" 
                      value={brand} 
                      checked={filters.brand === brand}
                      onChange={handleFilterChange}
                    />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="sidebar-section hover-popover">
            <div className="section-header">
              <span className="section-title">Khoảng giá (VNĐ)</span>
              <span className="selected-value">
                {filters.min_price || filters.max_price 
                  ? `${Number(filters.min_price || 0).toLocaleString()} - ${filters.max_price ? Number(filters.max_price).toLocaleString() : '...'}`
                  : 'Tất cả'}
              </span>
            </div>
            <div className="popover-content glass-panel">
              <div className="price-inputs">
                <input
                  type="number"
                  name="min_price"
                  value={filters.min_price}
                  onChange={handleFilterChange}
                  placeholder="Từ"
                />
                <span className="separator"></span>
                <input
                  type="number"
                  name="max_price"
                  value={filters.max_price}
                  onChange={handleFilterChange}
                  placeholder="Đến"
                />
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <label className="checkbox-filter">
              <input 
                type="checkbox" 
                name="in_stock" 
                checked={filters.in_stock}
                onChange={handleFilterChange}
              />
              <span className="checkmark"></span>
              Sản phẩm còn hàng
            </label>
          </div>
        </div>

        <button className="btn-clear-sidebar" onClick={clearFilters}>
          Xóa tất cả bộ lọc
        </button>
      </aside>

      <div className="main-content-area animate-fade-in">
        <div className="container">
          <header className="list-header">
            <div className="header-main-info">
              <h1 className="list-title">Khám phá sản phẩm</h1>
              <p className="list-subtitle">Tìm kiếm linh kiện PC chất lượng nhất cho bộ máy của bạn</p>
            </div>
            <div className="list-controls">
              <span className="results-count"><strong>{products.length}</strong> sản phẩm</span>
              <div className="sort-wrapper glass-panel">
                <label>Sắp xếp:</label>
                <select name="sort" value={filters.sort} onChange={handleFilterChange}>
                  <option value="newest">Mới nhất</option>
                  <option value="price_asc">Giá: Thấp đến Cao</option>
                  <option value="price_desc">Giá: Cao đến Thấp</option>
                </select>
              </div>
            </div>
          </header>

          <main className="content">
            {loading ? (
              <div className="products-grid">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="product-card-premium skeleton">
                    <div className="card-image-wrapper"></div>
                    <div className="card-info">
                      <div className="skeleton-line"></div>
                      <div className="skeleton-line short"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="products-grid">
                  {products.length > 0 ? (
                    products.map(product => (
                      <Link to={`/products/${product.id}`} key={product.id} className="product-card-glossy">
                        <div className="card-image-container">
                          {product.image_url ? (
                            <img src={getImageUrl(product.image_url)} alt={product.name} className="product-img" />
                          ) : (
                            <div className="image-placeholder">PC</div>
                          )}
                          <div className="card-overlay">
                            <span className="view-detail">Xem chi tiết</span>
                          </div>
                        </div>
                        <div className="card-body">
                          <span className="card-tag">Chính hãng</span>
                          <h4 className="card-name">{product.name}</h4>
                          <div className="card-footer">
                            <p className="card-price-modern">{product.base_price.toLocaleString()} ₫</p>
                            <button className="quick-add">+</button>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="no-results-premium glass-panel">
                      <div className="no-results-icon">📦</div>
                      <h3>Không tìm thấy sản phẩm</h3>
                      <p>Rất tiếc, bộ lọc của bạn không khớp với bất kỳ sản phẩm nào. Hãy thử điều chỉnh lại nhé!</p>
                      <button className="btn-primary" onClick={clearFilters}>Xóa bộ lọc</button>
                    </div>
                  )}
                </div>
                
                {pagination.pages > 1 && (
                  <div className="pagination-modern">
                    <button 
                      disabled={pagination.page === 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      className="page-arrow"
                    >
                      &larr;
                    </button>
                    <div className="page-numbers">
                      {[...Array(pagination.pages)].map((_, i) => (
                        <button 
                          key={i+1}
                          className={`page-index ${pagination.page === i+1 ? 'active' : ''}`}
                          onClick={() => setPagination(prev => ({ ...prev, page: i+1 }))}
                        >
                          {i+1}
                        </button>
                      ))}
                    </div>
                    <button 
                      disabled={pagination.page === pagination.pages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      className="page-arrow"
                    >
                      &rarr;
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
