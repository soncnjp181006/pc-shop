import React, { useState, useEffect } from 'react';
import { productsApi, categoriesApi, getImageUrl } from '../../../utils/api';
import { Link, useSearchParams } from 'react-router-dom';
import './ProductListPage.css';

const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, pages: 1, total: 0 });
  const [expandedCategoryIds, setExpandedCategoryIds] = useState([]);
  
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
  
  const findCategoryPath = (nodes, targetId, path = []) => {
    for (const node of nodes) {
      const nextPath = [...path, node.id];
      if (String(node.id) === String(targetId)) return nextPath;
      if (node.children && node.children.length > 0) {
        const res = findCategoryPath(node.children, targetId, nextPath);
        if (res) return res;
      }
    }
    return null;
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    const newParams = {};
    Object.keys(filters).forEach(key => {
      // Chỉ thêm param khi có giá trị thực sự (không gửi false lên server)
      if (filters[key] !== '' && filters[key] !== false && filters[key] !== null && filters[key] !== undefined) {
        newParams[key] = filters[key];
      }
    });
    setSearchParams(newParams);
  }, [filters, pagination.page]);

  useEffect(() => {
    if (!filters.category_id || categories.length === 0) return;
    const path = findCategoryPath(categories, filters.category_id);
    if (path && path.length > 1) {
      setExpandedCategoryIds(path.slice(0, -1));
    }
  }, [categories, filters.category_id]);

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
      // Chỉ gửi params có giá trị thực (không gửi false/empty lên server)
      const params = { page: pagination.page, limit: pagination.limit };
      Object.keys(filters).forEach(key => {
        if (filters[key] !== '' && filters[key] !== false && filters[key] !== null && filters[key] !== undefined) {
          params[key] = filters[key];
        }
      });
      const response = await productsApi.getAll(params);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data);
        setPagination(prev => ({ ...prev, pages: data.pages, total: data.total }));
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
    setExpandedCategoryIds([]);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const toggleCategoryExpand = (id) => {
    setExpandedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const getPaginationItems = () => {
    const totalPages = pagination.pages || 1;
    const current = pagination.page;
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const items = new Set([1, totalPages, current, current - 1, current + 1]);
    const clipped = Array.from(items)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);

    const out = [];
    for (let i = 0; i < clipped.length; i += 1) {
      const p = clipped[i];
      const prev = clipped[i - 1];
      if (prev && p - prev > 1) out.push('…');
      out.push(p);
    }
    return out;
  };

  const renderCategoryNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const expanded = expandedCategoryIds.includes(node.id);
    const active = String(filters.category_id) === String(node.id);

    return (
      <div key={node.id} className="category-node">
        <div className="category-row" style={{ paddingLeft: `${10 + depth * 14}px` }}>
          {hasChildren ? (
            <button
              type="button"
              className="cat-toggle"
              aria-label={expanded ? 'Thu gọn' : 'Mở rộng'}
              onClick={(e) => {
                e.stopPropagation();
                toggleCategoryExpand(node.id);
              }}
            >
              {expanded ? '▾' : '▸'}
            </button>
          ) : (
            <span className="cat-leaf">•</span>
          )}
          <button
            type="button"
            className={`category-item category-select ${active ? 'active' : ''}`}
            onClick={() => {
              handleFilterChange({ target: { name: 'category_id', value: node.id } });
              if (hasChildren && !expanded) toggleCategoryExpand(node.id);
            }}
          >
            {node.name}
          </button>
        </div>

        {hasChildren && expanded && (
          <div className="category-children">
            {node.children.map((child) => renderCategoryNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="product-list-page">
      <aside className="sidebar-fixed glass-panel">
        <div className="sidebar-group">
          <h3 className="group-label">Danh mục</h3>
          <div className="category-list category-tree">
            <button
              type="button"
              className={`category-item category-select ${filters.category_id === '' ? 'active' : ''}`}
              onClick={() => {
                setExpandedCategoryIds([]);
                handleFilterChange({ target: { name: 'category_id', value: '' } });
              }}
            >
              Tất cả sản phẩm
            </button>
            {categories.map((cat) => renderCategoryNode(cat, 0))}
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
        <div className="product-list-container">
          <header className="list-header">
            <div className="header-main-info">
              <h1 className="list-title">Khám phá sản phẩm</h1>
              <p className="list-subtitle">Tìm kiếm linh kiện PC chất lượng nhất cho bộ máy của bạn</p>
            </div>
            <div className="list-controls">
              <span className="results-count"><strong>{pagination.total}</strong> sản phẩm</span>
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
                          <span className="badge">Chính hãng</span>
                          <h4 className="card-name">{product.name}</h4>
                          <div className="card-footer">
                            <p className="card-price-modern">{product.base_price.toLocaleString()} ₫</p>
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
                      {getPaginationItems().map((item, idx) => (
                        item === '…' ? (
                          <span key={`dots-${idx}`} className="page-dots">…</span>
                        ) : (
                          <button 
                            key={item}
                            className={`page-index ${pagination.page === item ? 'active' : ''}`}
                            onClick={() => setPagination(prev => ({ ...prev, page: item }))}
                          >
                            {item}
                          </button>
                        )
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
