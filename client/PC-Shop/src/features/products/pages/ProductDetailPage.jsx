import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsApi, cartApi, getImageUrl } from '../../../utils/api';
import HeartToggle from '../../../components/HeartToggle';
import { 
  Truck, RefreshCcw, ShieldCheck, Frown, X, 
  ShoppingBag, ArrowRight, Star, Heart, Share2, 
  ChevronRight, Play, Info, Settings
} from 'lucide-react';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchProductDetail(true);

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host.replace('5173', '8000')}/ws/stock`;

    let socket;
    const connectWS = () => {
      socket = new WebSocket(wsUrl);
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'stock_updated') {
          if (data.product_id && String(data.product_id) === String(id)) {
            setProduct(prev => prev ? { ...prev, available_stock: data.available_stock } : prev);
            if (data.variants?.length > 0) {
              setVariants(prev => prev.map(v => {
                const updated = data.variants.find(uv => uv.id === v.id);
                return updated ? { ...v, available_stock: updated.available_stock } : v;
              }));
              setSelectedVariant(prev => {
                if (!prev) return null;
                const updated = data.variants.find(uv => uv.id === prev.id);
                return updated ? { ...prev, available_stock: updated.available_stock } : prev;
              });
            }
          }
        }
      };
      socket.onclose = () => setTimeout(connectWS, 5000);
    };

    connectWS();
    const interval = setInterval(() => fetchProductDetail(false), 30000);
    return () => { if (socket) socket.close(); clearInterval(interval); };
  }, [id]);

  const fetchProductDetail = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [productRes, variantsRes] = await Promise.all([
        productsApi.getById(id),
        productsApi.getVariants(id)
      ]);

      if (productRes.ok && variantsRes.ok) {
        const productData = await productRes.json();
        const variantsData = await variantsRes.json();
        setProduct(productData);
        setVariants(variantsData);
        setSelectedVariant(prev => {
          if (!prev) return variantsData.length > 0 ? variantsData[0] : null;
          return variantsData.find(v => v.id === prev.id) || prev;
        });
      } else {
        if (showLoading) setError("Sản phẩm không tồn tại.");
      }
    } catch {
      if (showLoading) setError("Lỗi kết nối cơ sở dữ liệu.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (variants.length > 0 && !selectedVariant) {
      showToast('Vui lòng chọn phiên bản phù hợp.', 'error');
      return;
    }

    setAddingToCart(true);
    try {
      const response = await cartApi.addItem(
        selectedVariant ? parseInt(selectedVariant.id) : null,
        quantity,
        parseInt(id)
      );
      if (response.ok) {
        showToast('Đã thêm sản phẩm thành công!', 'success');
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        const errorData = await response.json();
        showToast(errorData.detail || 'Lỗi bất ngờ xảy ra.', 'error');
      }
    } catch {
      showToast('Máy chủ không phản hồi.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (variants.length > 0 && !selectedVariant) {
      showToast('Vui lòng chọn phiên bản phù hợp.', 'error');
      return;
    }

    setAddingToCart(true);
    try {
      const response = await cartApi.addItem(
        selectedVariant ? parseInt(selectedVariant.id) : null,
        quantity,
        parseInt(id)
      );
      if (response.ok) {
        window.dispatchEvent(new Event('cartUpdated'));
        navigate('/checkout');
      } else {
        const errorData = await response.json();
        showToast(errorData.detail || 'Lỗi bất ngờ xảy ra.', 'error');
      }
    } catch {
      showToast('Máy chủ không phản hồi.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return (
    <div className="product-page-loader">
      <div className="spinner-modular" />
      <p>Đang chuẩn bị dữ liệu...</p>
    </div>
  );

  if (error) return (
    <div className="product-page-error container">
      <div className="error-card glass-panel">
        <Frown size={48} className="error-icon" />
        <h2>Ối! Thông tin bị gián đoạn</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/products')}>Về trang sản phẩm</button>
      </div>
    </div>
  );

  if (!product) return null;

  const mediaMatch = (product.description || '').match(/\[MEDIA:(.*?)\]/);
  const extraLinks = mediaMatch ? mediaMatch[1].split(';').filter(l => l.trim()) : [];
  const mediaList = [product.image_url, ...extraLinks].filter(Boolean);
  const isVideo = (url) => url.includes('youtube.com') || url.includes('youtu.be') || url.includes('.mp4');
  const currentMedia = mediaList[activeMediaIdx];
  const currentStock = selectedVariant?.available_stock ?? product.available_stock;
  const isOutOfStock = currentStock <= 0;
  const currentPrice = selectedVariant?.price_override || product.base_price;

  return (
    <main className="product-detail-modular animate-fade-in">
      {/* Toast Overlay */}
      {toast && createPortal(
        <div className={`modular-toast ${toast.type}`}>
          {toast.type === 'success' ? <ShoppingBag size={18} /> : <X size={18} />}
          <span>{toast.message}</span>
        </div>,
        document.body
      )}

      <div className="container-modular">
        {/* Navigation Breadcrumb */}
        <nav className="modular-nav">
          <Link to="/home">Trang chủ</Link>
          <ChevronRight size={14} className="sep" />
          <Link to="/products">Linh kiện</Link>
          <ChevronRight size={14} className="sep" />
          <span className="current">{product.name}</span>
        </nav>

        <section className="product-hero-modular">
          {/* GALLERY BLOCK */}
          <div className="gallery-block">
            <div className="main-stage glass-panel">
              <div className="stage-badges">
                {product.brand && <span className="badge-item brand">{product.brand}</span>}
                <span className={`badge-item stock ${isOutOfStock ? 'out' : 'in'}`}>
                  {isOutOfStock ? 'Hết hàng' : 'Còn hàng'}
                </span>
              </div>
              
              <div className="media-renderer">
                {mediaList.length === 0 ? (
                  <div className="image-placeholder">PC SHOP</div>
                ) : (
                  <div className="display-box">
                    {isVideo(currentMedia) ? (
                      <iframe src={currentMedia.replace('watch?v=', 'embed/')} frameBorder="0" allowFullScreen />
                    ) : (
                      <img
                        src={getImageUrl(currentMedia)}
                        alt={product.name}
                        onClick={() => setLightboxIndex(activeMediaIdx)}
                      />
                    )}
                    {mediaList.length > 1 && (
                      <div className="stage-arrows">
                        <button onClick={() => setActiveMediaIdx(i => (i - 1 + mediaList.length) % mediaList.length)}>‹</button>
                        <button onClick={() => setActiveMediaIdx(i => (i + 1) % mediaList.length)}>›</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {mediaList.length > 1 && (
              <div className="thumb-reel">
                {mediaList.map((link, idx) => (
                  <button
                    key={idx}
                    className={`thumb-card ${idx === activeMediaIdx ? 'active' : ''}`}
                    onClick={() => setActiveMediaIdx(idx)}
                  >
                    {isVideo(link) && <div className="video-hint"><Play size={16} /></div>}
                    <img src={isVideo(link) ? "/hero.png" : getImageUrl(link)} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ESSENTIAL INFO & ACTIONS BLOCK */}
          <div className="config-block">
            <header className="modular-header">
              <span className="mini-meta">{product.origin || 'Công nghệ đỉnh cao'}</span>
              <h1 className="modular-title">{product.name}</h1>
              <div className="rating-mini">
                <Star size={14} fill="var(--accent-secondary)" stroke="none" />
                <span className="score">4.9</span>
                <span className="count">(2k+ đã bán)</span>
              </div>
            </header>

            <div className="modular-price-card">
              <div className="price-primary">
                <span className="unit">₫</span>
                <span className="value">{currentPrice.toLocaleString()}</span>
              </div>
              <p className="price-tax">Đã bao gồm VAT & Miễn phí vận chuyển</p>
            </div>

            {/* Variant Selector - Only show if there are actual variants beyond 'Default' */}
            {variants.length > 0 && !(variants.length === 1 && Object.values(variants[0].attributes)[0] === 'Default') && (
              <div className="modular-choices">
                <h3 className="choice-label"><Settings size={14} /> Chọn cấu hình</h3>
                <div className="choice-grid">
                  {variants.map(variant => (
                    <button
                      key={variant.id}
                      className={`choice-card ${selectedVariant?.id === variant.id ? 'active' : ''}`}
                      onClick={() => setSelectedVariant(variant)}
                    >
                      <span className="name">{Object.values(variant.attributes).join(' ')}</span>
                      {variant.price_override && variant.price_override !== product.base_price && (
                        <span className="diff">+{ (variant.price_override - product.base_price).toLocaleString() } ₫</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="modular-action-box glass-panel">
              <div className="box-top">
                <div className="modular-qty">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
                  <input type="number" value={quantity} readOnly />
                  <button onClick={() => setQuantity(q => q + 1)}>+</button>
                </div>
                <div className="stock-label">
                  <span className={`dot ${isOutOfStock ? 'red' : 'green'}`} />
                  {isOutOfStock ? 'Tạm hết hàng' : `Còn lại ${currentStock}`}
                </div>
              </div>
              
              <div className="box-buttons">
                <button
                  className="btn-add-modular"
                  onClick={handleAddToCart}
                  disabled={addingToCart || isOutOfStock}
                >
                  {addingToCart ? <div className="btn-spinner" /> : <ShoppingBag size={18} />}
                  Thêm vào giỏ
                </button>
                <button
                  className="btn-buy-modular"
                  disabled={isOutOfStock || addingToCart}
                  onClick={handleBuyNow}
                >
                  {addingToCart ? <div className="btn-spinner" /> : <ArrowRight size={18} />}
                  Mua ngay
                </button>
              </div>
              
              <div className="box-meta">
                <HeartToggle productId={parseInt(id)} className="meta-item-heart" />
                <div className="meta-item"><Share2 size={16} /></div>
              </div>
            </div>

            <div className="modular-trust-grid">
              <div className="trust-item">
                <ShieldCheck size={18} className="icon" />
                <span>Bảo hành chính hãng 5 năm</span>
              </div>
              <div className="trust-item">
                <Truck size={18} className="icon" />
                <span>Miễn phí giao hàng Hà Nội / HCM</span>
              </div>
            </div>
          </div>
        </section>

        {/* DETAILS SECTION - REDESIGNED */}
        <section className="product-details-modular">
          <div className="details-grid-ultra">
            {/* Description Block */}
            <div className="detail-card description glass-panel">
              <h3 className="card-title"><Info size={18} /> Mô tả sản phẩm</h3>
              <div className="rich-description-box">
                {(product.description || 'Thông tin chi tiết về sản phẩm công nghệ đỉnh cao...')
                  .replace(/\[MEDIA:.*?\]/, '')
                  .split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
              </div>
            </div>

            {/* Service & Specs Block */}
            <div className="detail-card specs glass-panel">
              <h3 className="card-title"><ShieldCheck size={18} /> Chế độ hậu mãi & Cam kết</h3>
              <div className="spec-grid-compact">
                <div className="spec-tile">
                  <span className="tile-label">Giao hàng</span>
                  <strong className="tile-value">Siêu tốc 2h - 4h nội thành</strong>
                  <p className="tile-hint">Miễn phí cho đơn hàng từ 500k</p>
                </div>
                <div className="spec-tile">
                  <span className="tile-label">Đổi trả</span>
                  <strong className="tile-value">30 ngày lỗi 1 đổi 1</strong>
                  <p className="tile-hint">Thủ tục nhanh chóng, tận nơi</p>
                </div>
                <div className="spec-tile">
                  <span className="tile-label">Bảo hành</span>
                  <strong className="tile-value">Chính hãng 36 - 60 tháng</strong>
                  <p className="tile-hint">Kích hoạt bảo hành điện tử</p>
                </div>
                <div className="spec-tile">
                  <span className="tile-label">Hỗ trợ</span>
                  <strong className="tile-value">Miễn phí phần mềm trọn đời</strong>
                  <p className="tile-hint">Vệ sinh máy miễn phí định kỳ</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* REVIEWS & COMMENTS SECTION */}
        <section className="product-reviews-modular glass-panel">
          <header className="reviews-header">
            <h3 className="card-title"><Star size={18} /> Đánh giá từ cộng đồng</h3>
            <div className="rating-overview">
              <div className="overview-main">
                <span className="avg-score">4.9</span>
                <div className="stars-box">
                  {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="var(--accent-secondary)" stroke="none" />)}
                </div>
                <span className="total-rev">2,482 nhận xét</span>
              </div>
              <div className="rating-filters">
                <button className="filter-chip active">Tất cả</button>
                <button className="filter-chip">5 ⭐ (2.1k)</button>
                <button className="filter-chip">4 ⭐ (300)</button>
                <button className="filter-chip">Có hình ảnh (450)</button>
                <button className="filter-chip">Có video (80)</button>
              </div>
            </div>
          </header>

          <div className="comments-list">
            {[1, 2, 3].map((item) => (
              <div key={item} className="comment-item">
                <div className="user-meta">
                  <div className="user-avatar">{String.fromCharCode(64 + item)}</div>
                  <div className="user-info">
                    <div className="user-name-row">
                      <strong>Khách hàng ẩn danh</strong>
                      <span className="verified-badge">Đã mua hàng</span>
                    </div>
                    <div className="stars-row">
                      {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="var(--accent-secondary)" stroke="none" />)}
                      <span className="date">24/03/2024</span>
                    </div>
                  </div>
                </div>
                <div className="comment-text">
                  Sản phẩm đóng gói rất cẩn thận, đúng như mô tả. Nhân viên hỗ trợ nhiệt tình, 
                  giao hàng ở Hà Nội cực nhanh chỉ mất tầm 1 tiếng rưỡi là nhận được rồi. 
                  Sẽ tiếp tục ủng hộ shop trong tương lai!
                </div>
                {item === 1 && (
                  <div className="comment-media">
                    <img src="/hero.png" alt="review" className="rev-img" />
                    <img src="/hero.png" alt="review" className="rev-img" />
                  </div>
                )}
              </div>
            ))}
            <button className="btn-load-more">Xem thêm đánh giá</button>
          </div>
        </section>
      </div>

      {/* Lightbox Portal */}
      {lightboxIndex !== null && createPortal(
        <div className="modular-lightbox" onClick={() => setLightboxIndex(null)}>
          <div className="lb-content" onClick={e => e.stopPropagation()}>
            <button className="lb-close" onClick={() => setLightboxIndex(null)}><X size={24} /></button>
            <div className="lb-media">
              {isVideo(mediaList[lightboxIndex]) ? (
                <iframe src={mediaList[lightboxIndex].replace('watch?v=', 'embed/')} frameBorder="0" allowFullScreen />
              ) : (
                <img src={getImageUrl(mediaList[lightboxIndex])} alt="" />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
};

export default ProductDetailPage;
