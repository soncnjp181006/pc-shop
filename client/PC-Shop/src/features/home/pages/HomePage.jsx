import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productsApi, categoriesApi, getImageUrl } from '../../../utils/api';
import { 
  Zap, 
  ShieldCheck, 
  Package, 
  CreditCard, 
  Diamond, 
  Star, 
  ShoppingCart, 
  ArrowRight, 
  ChevronRight, 
  Cpu, 
  Layers, 
  Award, 
  CheckCircle2, 
  TrendingUp,
  Monitor,
  MousePointer2,
  HardDrive,
  Sparkles
} from 'lucide-react';
import './HomePage.css';

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topFilter, setTopFilter] = useState('newest'); // newest, price_desc, popular
  const [loadingTop, setLoadingTop] = useState(true);
  const [activeStat, setActiveStat] = useState(0);
  
  const observerRef = useRef(null);
  const navigate = useNavigate();

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
        const params = { limit: 8, sort: topFilter };
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

  // Optimized Scroll Reveal Effect
  useEffect(() => {
    // Only initialize if data is loaded to avoid redundant observations
    if (loadingTop || categories.length === 0) return;

    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px' // Start reveal slightly before element enters viewport
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Use requestAnimationFrame for smoother class addition
          requestAnimationFrame(() => {
            entry.target.classList.add('reveal-visible');
          });
          // Once revealed, no need to observe anymore
          observer.unobserve(entry.target);
        }
      });
    }, options);

    const elements = document.querySelectorAll('.reveal');
    elements.forEach(el => observer.observe(el));
    
    return () => observer.disconnect();
  }, [loadingTop, categories]);

  return (
    <div className="home-modern-wrapper">
      {/* 🚀 HERO SECTION - ULTRA REDESIGN */}
      <section className="hero-modern">
        <div className="hero-background">
          <div className="glow-orb orb-1"></div>
          <div className="glow-orb orb-2"></div>
          <div className="grid-overlay"></div>
        </div>
        
        <div className="container hero-grid">
          <div className="hero-content-box">
            <div className="hero-badge animate-float-slow">
              <Sparkles size={16} className="text-yellow-400" />
              <span>Thế hệ linh kiện 2026 đã cập bến</span>
            </div>
            
            <h1 className="hero-main-title">
              Kiến tạo <span className="text-gradient-blue">Quái thú</span> <br />
              Đẳng cấp <span className="text-gradient-purple">Gaming</span>
            </h1>
            
            <p className="hero-desc">
              Hệ sinh thái linh kiện PC cao cấp nhất Việt Nam. 
              Tối ưu hiệu năng, cá nhân hóa thẩm mỹ, bảo hành tận tâm.
            </p>
            
            <div className="hero-cta-group">
              <Link to="/products" className="btn-primary-glow">
                Bắt đầu Build ngay <ArrowRight size={20} />
              </Link>
              <Link to="/products" className="btn-glass">
                Khám phá
              </Link>
            </div>
            
            <div className="hero-trust-badges">
              <div className="trust-item">
                <CheckCircle2 size={18} className="text-green-500" />
                <span>Chính hãng 100%</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={18} className="text-green-500" />
                <span>Giao hàng 2h</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={18} className="text-green-500" />
                <span>Bảo hành 1-đổi-1</span>
              </div>
            </div>
          </div>
          
          <div className="hero-visual-box">
            <div className="visual-container">
              <div className="main-pc-image animate-float">
                <img 
                  src="/hero.png" 
                  alt="PC Gaming High-end" 
                  width="500"
                  height="500"
                  onError={(e) => e.target.style.display='none'} 
                />
                {/* Fallback if image missing */}
                <div className="image-fallback">
                  <Cpu size={120} strokeWidth={0.5} className="text-blue-500 opacity-20" />
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="floating-stat-card card-fps animate-float-delayed">
                <Zap size={20} className="text-yellow-400" />
                <div className="stat-info">
                  <span className="label">FPS trung bình</span>
                  <span className="value">240+ FPS</span>
                </div>
              </div>
              
              <div className="floating-stat-card card-temp animate-float-slow">
                <Layers size={20} className="text-blue-400" />
                <div className="stat-info">
                  <span className="label">Nhiệt độ tối ưu</span>
                  <span className="value">55°C Cool</span>
                </div>
              </div>

              <div className="experience-badge animate-pulse">
                <Award size={24} />
                <span>Premium Quality</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 📦 CATEGORIES SECTION - GRID REDESIGN */}
      <section className="categories-modern reveal">
        <div className="container">
          <div className="section-heading-v2">
            <div className="heading-left">
              <h2 className="heading-title">Danh mục <span className="text-gradient-blue">Sản phẩm</span></h2>
              <p className="heading-desc">Tìm kiếm linh kiện theo nhu cầu build máy của bạn</p>
            </div>
            <Link to="/products" className="btn-text-link">
              Xem tất cả danh mục <ChevronRight size={20} />
            </Link>
          </div>
          
          <div className="categories-grid-v2">
            {categories.length > 0 ? (
              categories.map((category, index) => (
                <Link to={`/products?category_id=${category.id}`} key={category.id} className="cat-card-v2">
                  <div className="cat-card-inner">
                    <div className="cat-icon-box">
                      {category.name.toLowerCase().includes('laptop') ? <Monitor size={32} /> :
                       category.name.toLowerCase().includes('linh kiện') ? <Cpu size={32} /> :
                       category.name.toLowerCase().includes('phụ kiện') ? <MousePointer2 size={32} /> :
                       category.name.toLowerCase().includes('màn hình') ? <Monitor size={32} /> :
                       category.name.toLowerCase().includes('ổ cứng') ? <HardDrive size={32} /> :
                       <Package size={32} />}
                    </div>
                    <div className="cat-content">
                      <h3>{category.name}</h3>
                      <p>{category.product_count || 0} sản phẩm</p>
                    </div>
                    <div className="cat-arrow">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                  <div className="cat-bg-glow"></div>
                </Link>
              ))
            ) : (
              [1, 2, 3].map(i => <div key={i} className="cat-card-v2 skeleton" />)
            )}
          </div>
        </div>
      </section>

      {/* 🔥 TRENDING PRODUCTS - HORIZONTAL SCROLL / GRID */}
      <section className="trending-modern reveal">
        <div className="container">
          <div className="trending-header-box glass-panel">
            <div className="trending-title-group">
              <div className="trending-icon-box">
                <TrendingUp size={24} className="text-blue-500" />
              </div>
              <div className="trending-text-group">
                <h2 className="trending-title">Sản phẩm <span className="text-gradient-purple">Xu hướng</span></h2>
                <p>Những linh kiện đang được cộng đồng săn đón nhất</p>
              </div>
            </div>
            
            <div className="trending-filters">
              <button 
                className={`t-filter-btn ${topFilter === 'newest' ? 'active' : ''}`}
                onClick={() => setTopFilter('newest')}
              >Mới nhất</button>
              <button 
                className={`t-filter-btn ${topFilter === 'popular' ? 'active' : ''}`}
                onClick={() => setTopFilter('popular')}
              >Bán chạy</button>
              <button 
                className={`t-filter-btn ${topFilter === 'price_desc' ? 'active' : ''}`}
                onClick={() => setTopFilter('price_desc')}
              >Giá trị cao</button>
            </div>
          </div>

          <div className="trending-grid-v2">
            {loadingTop ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="product-card-v2 skeleton" />
              ))
            ) : (
              topProducts.map(product => (
                <div key={product.id} className="product-card-v2 glass-panel">
                  <div className="p-card-media" onClick={() => navigate(`/products/${product.id}`)}>
                    <img 
                      src={getImageUrl(product.image_url)} 
                      alt={product.name} 
                      loading="lazy"
                      width="200"
                      height="200"
                    />
                    <div className="p-card-badges">
                      {product.available_stock < 5 && <span className="badge-warning">Sắp hết</span>}
                      <span className="badge-hot">Hot</span>
                    </div>
                  </div>
                  
                  <div className="p-card-info">
                    <div className="p-card-header">
                      <span className="p-brand">PC SHOP</span>
                      <div className="p-rating">
                        <Star size={12} fill="var(--accent-vibrant)" color="var(--accent-vibrant)" />
                        <span>{product.rating_avg || 5.0}</span>
                      </div>
                    </div>
                    
                    <h4 className="p-name" onClick={() => navigate(`/products/${product.id}`)}>
                      {product.name}
                    </h4>
                    
                    <div className="p-card-footer">
                      <div className="p-price-box">
                        <span className="p-price">{product.base_price.toLocaleString()} ₫</span>
                      </div>
                      <button className="btn-add-cart-mini">
                        <ShoppingCart size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="trending-footer reveal">
            <Link to="/products" className="btn-secondary-glow">
              Xem tất cả sản phẩm <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* 💎 FEATURES & SERVICES - ICONIC REDESIGN */}
      <section className="services-modern reveal">
        <div className="container">
          <div className="services-grid-v2">
            <div className="service-card-v2">
              <div className="s-icon-box">
                <Package size={32} className="text-blue-500" />
                <div className="s-icon-glow"></div>
              </div>
              <div className="s-content">
                <h3>Giao hàng hỏa tốc</h3>
                <p>Nội thành 2h, toàn quốc 24-48h. Đóng gói chuyên dụng chống sốc.</p>
              </div>
            </div>
            
            <div className="service-card-v2">
              <div className="s-icon-box">
                <ShieldCheck size={32} className="text-green-500" />
                <div className="s-icon-glow"></div>
              </div>
              <div className="s-content">
                <h3>Bảo hành 5 sao</h3>
                <p>Chính sách 1-đổi-1 trong 30 ngày đầu. Hỗ trợ kỹ thuật trọn đời.</p>
              </div>
            </div>
            
            <div className="service-card-v2">
              <div className="s-icon-box">
                <CreditCard size={32} className="text-purple-500" />
                <div className="s-icon-glow"></div>
              </div>
              <div className="s-content">
                <h3>Thanh toán linh hoạt</h3>
                <p>Trả góp 0%, đa dạng cổng thanh toán: MoMo, VNPay, Visa/Master.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 💬 TESTIMONIALS - GLASS SLIDER PREVIEW */}
      <section className="testimonials-modern reveal">
        <div className="container">
          <div className="testimonials-box glass-panel">
            <div className="testi-header">
              <h2 className="testi-title">Được tin dùng bởi <span className="text-gradient-blue">10.000+</span> Khách hàng</h2>
            </div>
            
            <div className="testi-grid">
              <div className="testi-card">
                <div className="testi-user">
                  <div className="user-avatar">AD</div>
                  <div className="user-info">
                    <strong>Anh Duy</strong>
                    <span>Chuyên viên đồ họa</span>
                  </div>
                </div>
                <p>"Dàn PC build tại đây chạy cực kỳ ổn định, render 4K mượt mà. Rất hài lòng với dịch vụ hậu mãi."</p>
                <div className="testi-stars">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
                </div>
              </div>
              
              <div className="testi-card">
                <div className="testi-user">
                  <div className="user-avatar">ML</div>
                  <div className="user-info">
                    <strong>Minh Long</strong>
                    <span>Game thủ chuyên nghiệp</span>
                  </div>
                </div>
                <p>"Tư vấn cấu hình rất sát nhu cầu, không vẽ vời. Nhân viên kỹ thuật lắp máy cực kỳ gọn gàng."</p>
                <div className="testi-stars">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🏢 BRANDS SECTION - SCROLLING LOGOS */}
      <section className="brands-modern reveal">
        <div className="container">
          <p className="brands-label">Đối tác chiến lược</p>
          <div className="brands-slider">
            <div className="brands-track">
              {['ASUS', 'MSI', 'GIGABYTE', 'INTEL', 'AMD', 'NVIDIA', 'CORSAIR', 'RAZER'].map((brand, i) => (
                <div key={i} className="brand-logo-item">
                  <span>{brand}</span>
                </div>
              ))}
              {/* Duplicate for infinite scroll effect */}
              {['ASUS', 'MSI', 'GIGABYTE', 'INTEL', 'AMD', 'NVIDIA', 'CORSAIR', 'RAZER'].map((brand, i) => (
                <div key={`dup-${i}`} className="brand-logo-item">
                  <span>{brand}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
