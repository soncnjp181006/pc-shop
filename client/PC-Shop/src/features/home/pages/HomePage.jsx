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
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Trải nghiệm công nghệ đỉnh cao</h1>
          <p className="hero-subtitle">Khám phá bộ sưu tập linh kiện PC và phụ kiện chính hãng tại PC Shop.</p>
          <div className="hero-actions">
            <Link to="/products" className="btn-primary">Mua sắm ngay</Link>
            <a href="#featured-categories" className="btn-secondary">Tìm hiểu thêm</a>
          </div>
        </div>
        <div className="hero-image-container">
          <div className="hero-glow"></div>
          <img src="/hero.png" alt="Featured PC" className="hero-image" />
        </div>
      </section>

      <section id="featured-categories" className="categories-section">
        <div className="section-header">
          <h2 className="section-title">Danh mục nổi bật</h2>
          <Link to="/products" className="view-all">Xem tất cả</Link>
        </div>
        <div className="categories-grid">
          {categories.slice(0, 4).map(category => (
            <Link to={`/products?category_id=${category.id}`} key={category.id} className="category-card">
              <div className="category-icon">
                {category.name.charAt(0)}
              </div>
              <h3 className="category-name">{category.name}</h3>
              <p className="category-count">Khám phá ngay &rarr;</p>
            </Link>
          ))}
          {categories.length === 0 && [1, 2, 3, 4].map(i => (
            <div key={i} className="category-card skeleton">
              <div className="category-icon"></div>
              <div className="skeleton-line"></div>
            </div>
          ))}
        </div>
      </section>

      <section className="features-grid">
        <div className="feature-item">
          <div className="feature-icon">🚚</div>
          <h3>Giao hàng nhanh</h3>
          <p>Miễn phí vận chuyển cho đơn hàng trên 5 triệu đồng.</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon">🛡️</div>
          <h3>Bảo hành 24 tháng</h3>
          <p>Cam kết chính hãng, hỗ trợ kỹ thuật tận nơi.</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon">💳</div>
          <h3>Thanh toán linh hoạt</h3>
          <p>Hỗ trợ trả góp 0% qua thẻ tín dụng.</p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
