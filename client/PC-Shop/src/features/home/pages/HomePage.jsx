import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi, categoriesApi, getImageUrl } from '../../../utils/api';
import { Zap, ShieldCheck, Package, CreditCard, Diamond, Star, ShoppingCart, ArrowRight } from 'lucide-react';
import './HomePage.css';

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topFilter, setTopFilter] = useState('newest'); // newest, price_desc, popular
  const [loadingTop, setLoadingTop] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getTree();
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchTopProducts = async () => {
      setLoadingTop(true);
      try {
        const params = { limit: 5, sort: topFilter };
        const response = await productsApi.getAll(params);
        if (response.ok) {
          const data = await response.json();
          setTopProducts(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching top products:', error);
      } finally {
        setLoadingTop(false);
      }
    };
    fetchTopProducts();
  }, [topFilter]);

  return (
    <div className="home-container animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="mesh-gradient"></div>
        <div className="container hero-layout">
          <div className="hero-content">
            <div className="badge-promo">Sản phẩm 2026 đã sẵn sàng</div>
            <h1 className="hero-title">
              Nâng tầm <span className="gradient-text">Trải nghiệm</span> <br />
              Công nghệ đỉnh cao
            </h1>
            <p className="hero-subtitle">
              Khám phá hệ sinh thái linh kiện PC hàng đầu. Quy trình chọn lọc khắt khe, 
              cam kết hiệu năng vượt trội cho mọi tác vụ.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-lg">Mua sắm ngay</Link>
              <a href="#featured-categories" className="btn btn-secondary btn-lg">Xem danh mục</a>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-value">5K+</span>
                <span className="stat-label">Sản phẩm</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-value">200+</span>
                <span className="stat-label">Thương hiệu</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-value">24/7</span>
                <span className="stat-label">Hỗ trợ</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="image-wrapper">
              <img src="/hero.png" alt="Featured PC" className="hero-image" />
              <div className="floating-card c1">
                <div className="f-icon"><Zap size={24} /></div>
                <div className="f-text">Siêu tốc độ</div>
              </div>
              <div className="floating-card c2">
                <div className="f-icon"><ShieldCheck size={24} /></div>
                <div className="f-text">Bảo hành 5 năm</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {/* Featured Categories */}
        <section id="featured-categories" className="categories-section">
          <div className="section-header">
            <div className="header-meta">
              <h2 className="section-title">Danh mục <span className="accent">Nổi bật</span></h2>
              <p className="section-subtitle">Lựa chọn linh kiện chuẩn xác cho hệ thống của bạn</p>
            </div>
            <Link to="/products" className="view-all-link">
              Tất cả sản phẩm 
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7l7 7-7 7"/></svg>
            </Link>
          </div>
          
          <div className="categories-grid">
            {categories.length > 0 ? (
              categories.slice(0, 3).map(category => (
                <Link to={`/products?category_id=${category.id}`} key={category.id} className="category-card-premium">
                  <div className="cat-icon-wrapper">
                    {category.name.charAt(0)}
                  </div>
                  <div className="cat-info">
                    <h3 className="cat-name">{category.name}</h3>
                    <span className="cat-explore">Khám phá ngay</span>
                  </div>
                  <div className="category-glow"></div>
                </Link>
              ))
            ) : (
              [1, 2, 3].map(i => (
                <div key={i} className="category-card-premium skeleton">
                  <div className="cat-icon-wrapper"></div>
                  <div className="cat-line"></div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Trending/Top Products Section - INJECTED HERE */}
        <section className="top-products-section glass-panel">
          <div className="top-products-header">
            <div className="top-header-right">
              <div className="top-filter-group">
                <button 
                  className={`filter-btn ${topFilter === 'newest' ? 'active' : ''}`}
                  onClick={() => setTopFilter('newest')}
                >Mới nhất</button>
                <button 
                  className={`filter-btn ${topFilter === 'price_desc' ? 'active' : ''}`}
                  onClick={() => setTopFilter('price_desc')}
                >Trị giá cao</button>
                <button 
                  className={`filter-btn ${topFilter === 'popular' ? 'active' : ''}`}
                  onClick={() => setTopFilter('popular')}
                >Săn đón</button>
              </div>
            </div>
          </div>

          <div className="top-products-grid">
            {loadingTop ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="top-product-card skeleton">
                  <div className="top-img-skeleton"></div>
                  <div className="top-info-skeleton"></div>
                </div>
              ))
            ) : (
              topProducts.map(product => (
                <Link to={`/products/${product.id}`} key={product.id} className="top-product-card">
                  <div className="top-card-media">
                    <img src={getImageUrl(product.image_url)} alt={product.name} />
                    <div className="top-card-badges">
                      <span className="badge-new">Trend</span>
                    </div>
                  </div>
                  <div className="top-card-content">
                    <h4 className="top-card-name">{product.name}</h4>
                    <div className="top-card-rating">
                      <Star size={10} fill="#f59e0b" color="#f59e0b" />
                      <span>{product.rating_avg || 5.0}</span>
                      <span className="top-stock">Còn {product.available_stock}</span>
                    </div>
                    <div className="top-card-footer">
                      <div className="top-price">{product.base_price.toLocaleString()} ₫</div>
                      <button className="top-quick-cart">
                        <ShoppingCart size={14} />
                      </button>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="features-grid-premium">
            <div className="feature-card">
              <div className="feature-icon-box"><Package size={32} strokeWidth={1.5} /></div>
              <h3>Giao hàng hỏa tốc</h3>
              <p>Nhận hàng trong vòng 2h tại nội thành. Đóng gói chuyên nghiệp, an toàn tuyệt đối.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-box"><CreditCard size={32} strokeWidth={1.5} /></div>
              <h3>Thanh toán linh hoạt</h3>
              <p>Hỗ trợ trả góp 0%, thanh toán qua ví điện tử, ngân hàng, và COD linh hoạt nhất.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-box"><Diamond size={32} strokeWidth={1.5} /></div>
              <h3>Chất lượng cao cấp</h3>
              <p>100% sản phẩm chính hãng, được kiểm định hiệu năng kỹ càng trước khi đến tay bạn.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
