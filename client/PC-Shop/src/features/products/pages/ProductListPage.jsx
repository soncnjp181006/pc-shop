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
  
  // Lấy filters từ URL params
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    category_id: searchParams.get('category_id') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    sort: searchParams.get('sort') || 'newest'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    // Cập nhật URL khi filters thay đổi
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
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      q: '',
      category_id: '',
      min_price: '',
      max_price: '',
      sort: 'newest'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="product-list-page animate-fade-in">
      <div className="container">
        <header className="list-header">
          <h1 className="list-title">Tất cả sản phẩm</h1>
          <div className="list-controls">
            <span className="results-count">{products.length} kết quả</span>
            <div className="sort-wrapper">
              <label>Sắp xếp:</label>
              <select name="sort" value={filters.sort} onChange={handleFilterChange}>
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
              </select>
            </div>
          </div>
        </header>

        <div className="list-layout">
          <aside className="sidebar">
            <div className="sidebar-section">
              <h3>Tìm kiếm</h3>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  name="q"
                  value={filters.q}
                  onChange={handleFilterChange}
                  placeholder="Nhập tên sản phẩm..."
                />
              </div>
            </div>

            <div className="sidebar-section">
              <h3>Danh mục</h3>
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

            <div className="sidebar-section">
              <h3>Khoảng giá</h3>
              <div className="price-inputs">
                <input
                  type="number"
                  name="min_price"
                  value={filters.min_price}
                  onChange={handleFilterChange}
                  placeholder="Từ"
                />
                <span className="separator">-</span>
                <input
                  type="number"
                  name="max_price"
                  value={filters.max_price}
                  onChange={handleFilterChange}
                  placeholder="Đến"
                />
              </div>
            </div>

            <button className="btn-clear" onClick={clearFilters}>Xóa bộ lọc</button>
          </aside>

          <main className="content">
            {loading ? (
              <div className="products-grid">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="product-card skeleton">
                    <div className="skeleton-image"></div>
                    <div className="skeleton-text"></div>
                    <div className="skeleton-text short"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="products-grid">
                  {products.length > 0 ? (
                    products.map(product => (
                      <Link to={`/products/${product.id}`} key={product.id} className="product-card-premium">
                        <div className="card-image-wrapper">
                          {product.image_url ? (
                            <img src={getImageUrl(product.image_url)} alt={product.name} className="product-img" />
                          ) : (
                            <div className="image-placeholder">PC</div>
                          )}
                        </div>
                        <div className="card-info">
                          <span className="card-category">Linh kiện</span>
                          <h4 className="card-title">{product.name}</h4>
                          <p className="card-price">{product.base_price.toLocaleString()} VNĐ</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="no-results">
                      <p>Không tìm thấy sản phẩm phù hợp.</p>
                      <button onClick={clearFilters}>Xem tất cả sản phẩm</button>
                    </div>
                  )}
                </div>
                
                {pagination.pages > 1 && (
                  <div className="pagination-modern">
                    <button 
                      disabled={pagination.page === 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      className="page-btn"
                    >
                      &larr;
                    </button>
                    <div className="page-numbers">
                      {[...Array(pagination.pages)].map((_, i) => (
                        <button 
                          key={i+1}
                          className={`page-num ${pagination.page === i+1 ? 'active' : ''}`}
                          onClick={() => setPagination(prev => ({ ...prev, page: i+1 }))}
                        >
                          {i+1}
                        </button>
                      ))}
                    </div>
                    <button 
                      disabled={pagination.page === pagination.pages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      className="page-btn"
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
