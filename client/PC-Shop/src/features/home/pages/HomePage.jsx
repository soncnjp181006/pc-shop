import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoriesApi } from '../../../utils/api';
import './HomePage.css';

const HomePage = () => {
  const [categories, setCategories] = useState([]);

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
                <div className="f-icon">🚀</div>
                <div className="f-text">Siêu tốc độ</div>
              </div>
              <div className="floating-card c2">
                <div className="f-icon">🛡️</div>
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
              categories.slice(0, 4).map(category => (
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
              [1, 2, 3, 4].map(i => (
                <div key={i} className="category-card-premium skeleton">
                  <div className="cat-icon-wrapper"></div>
                  <div className="cat-line"></div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="features-grid-premium">
            <div className="feature-card">
              <div className="feature-icon-box">📦</div>
              <h3>Giao hàng hỏa tốc</h3>
              <p>Nhận hàng trong vòng 2h tại nội thành. Đóng gói chuyên nghiệp, an toàn tuyệt đối.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-box">💳</div>
              <h3>Thanh toán linh hoạt</h3>
              <p>Hỗ trợ trả góp 0%, thanh toán qua ví điện tử, ngân hàng, và COD linh hoạt nhất.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-box">💎</div>
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
