import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsApi, cartApi, getImageUrl } from '../../../utils/api';
import { Truck, RefreshCcw, ShieldCheck, Frown } from 'lucide-react';
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
    setTimeout(() => setToast(null), 3500);
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
          } else {
            fetchProductDetail(false);
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
        if (showLoading) setError("Không tìm thấy sản phẩm.");
      }
    } catch {
      if (showLoading) setError("Có lỗi xảy ra khi tải dữ liệu.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (variants.length > 0 && !selectedVariant) {
      showToast('Vui lòng chọn một phiên bản sản phẩm.', 'error');
      return;
    }

    const currentAvailable = selectedVariant ? selectedVariant.available_stock : product.available_stock;
    if (quantity > currentAvailable) {
      showToast(`Chỉ còn ${currentAvailable} sản phẩm có sẵn.`, 'error');
      return;
    }

    const variantId = selectedVariant ? parseInt(selectedVariant.id) : null;
    const productId = parseInt(id);

    setAddingToCart(true);
    try {
      const response = await cartApi.addItem(variantId, quantity, productId);
      if (response.ok) {
        showToast('Đã thêm vào giỏ hàng! 🛒', 'success');
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          showToast('Vui lòng đăng nhập để thêm vào giỏ hàng.', 'error');
          setTimeout(() => navigate('/'), 2000);
        } else {
          showToast(errorData.detail || 'Lỗi khi thêm vào giỏ hàng.', 'error');
        }
      }
    } catch {
      showToast('Lỗi kết nối server.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner" />
      <p>Đang tải thông tin sản phẩm...</p>
    </div>
  );

  if (error) return (
    <div className="loading-container">
      <div className="error-state">
        <div className="error-icon"><Frown size={48} strokeWidth={1.5} color="var(--text-tertiary)" /></div>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/products')}>Quay lại danh sách</button>
      </div>
    </div>
  );

  if (!product) return null;

  // Media list
  const mediaMatch = (product.description || '').match(/\[MEDIA:(.*?)\]/);
  const extraLinks = mediaMatch ? mediaMatch[1].split(';').filter(l => l.trim()) : [];
  const mediaList = [product.image_url, ...extraLinks].filter(Boolean);

  const isVideo = (url) => url.includes('youtube.com') || url.includes('youtu.be') || url.includes('.mp4');
  const currentMedia = mediaList[activeMediaIdx];

  const currentStock = selectedVariant?.available_stock ?? product.available_stock;
  const isOutOfStock = currentStock <= 0;
  const currentPrice = selectedVariant?.price_override || product.base_price;

  return (
    <div className="product-page animate-fade-in">
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      <div className="product-container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span className="separator">›</span>
          <Link to="/products">Sản phẩm</Link>
          <span className="separator">›</span>
          <span className="current">{product.name}</span>
        </nav>

        <div className="product-grid-detail">
          {/* ── Gallery Section ── */}
          <div className="product-gallery">
            {/* Main Image */}
            {mediaList.length === 0 ? (
              <div className="main-image-card placeholder">PC Shop</div>
            ) : (
              <>
                <div className="main-image-card">
                  {isVideo(currentMedia) ? (
                    <div className="video-main-container">
                      <iframe
                        src={currentMedia.replace('watch?v=', 'embed/')}
                        title="Product Video"
                        frameBorder="0"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <img
                      src={getImageUrl(currentMedia)}
                      alt={product.name}
                      className="detail-img"
                      onClick={() => setLightboxIndex(activeMediaIdx)}
                    />
                  )}

                  {mediaList.length > 1 && (
                    <div className="slider-controls">
                      <button className="slider-btn prev" onClick={() => setActiveMediaIdx(i => (i - 1 + mediaList.length) % mediaList.length)}>‹</button>
                      <button className="slider-btn next" onClick={() => setActiveMediaIdx(i => (i + 1) % mediaList.length)}>›</button>
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {mediaList.length > 1 && (
                  <div className="media-gallery-premium">
                    {mediaList.map((link, idx) => (
                      <div
                        key={idx}
                        className={`media-item-card ${idx === activeMediaIdx ? 'active' : ''} ${isVideo(link) ? 'video-type' : ''}`}
                        onClick={() => { setActiveMediaIdx(idx); if (!isVideo(link)) setLightboxIndex(idx); }}
                      >
                        {isVideo(link) ? (
                          <div className="video-thumb">
                            <span className="play-icon">▶</span>
                            <img src="/hero.png" alt="Video" />
                          </div>
                        ) : (
                          <img src={getImageUrl(link)} alt={`Thumb ${idx}`} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Lightbox */}
            {lightboxIndex !== null && (
              <div className="media-lightbox" onClick={() => setLightboxIndex(null)}>
                <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                  <button className="lightbox-close" onClick={() => setLightboxIndex(null)}>×</button>
                  {isVideo(mediaList[lightboxIndex]) ? (
                    <iframe
                      src={mediaList[lightboxIndex].replace('watch?v=', 'embed/')}
                      title="Lightbox Video"
                      frameBorder="0"
                      allowFullScreen
                    />
                  ) : (
                    <img src={getImageUrl(mediaList[lightboxIndex])} alt="Full view" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Info Panel ── */}
          <div className="product-info-panel">
            {/* Badges */}
            <div className="badge-row">
              <span className="badge-new">✦ Chính hãng</span>
              <span className={`badge-instock ${isOutOfStock ? 'unavailable' : 'available'}`}>
                <span className="stock-dot" />
                {isOutOfStock ? 'Hết hàng' : 'Còn hàng'}
              </span>
            </div>

            {/* Title */}
            <h1 className="product-title">{product.name}</h1>

            {/* Rating (decorative) */}
            <div className="rating-row">
              <div className="stars">★★★★★</div>
              <span className="rating-count">4.9 (128 đánh giá)</span>
              <span className="rating-sep" />
              <span className="sold-count">Đã bán 500+</span>
            </div>

            {/* Price Block */}
            <div className="price-block">
              <div className="price-tag">{currentPrice.toLocaleString()} ₫</div>
            </div>

            {/* Stock Info */}
            <div className="stock-info-row">
              <div className={`stock-status ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
                {isOutOfStock
                  ? '⚠ Hết hàng (đã được đặt hết)'
                  : `✓ Có sẵn: ${currentStock} sản phẩm`}
              </div>
              <span className="stock-info-small">Kho: {selectedVariant?.stock_quantity ?? product.stock_quantity}</span>
            </div>

            {/* Description */}
            <div className="product-description-section">
              <div className="section-label">Mô tả</div>
              <p>
                {(product.description || 'Sản phẩm công nghệ cao cấp, mang lại hiệu năng tối ưu cho công việc và giải trí.')
                  .replace(/\[MEDIA:.*?\]/, '')
                  .split('\n').map((line, i) => (
                    <React.Fragment key={i}>{line}<br /></React.Fragment>
                  ))}
              </p>
            </div>

            {/* Variants */}
            {variants.length > 0 && (
              <div className="options-section">
                <div className="section-label">Chọn phiên bản</div>
                <div className="variants-grid">
                  {variants.map(variant => (
                    <button
                      key={variant.id}
                      className={`variant-option ${selectedVariant?.id === variant.id ? 'selected' : ''}`}
                      onClick={() => setSelectedVariant(variant)}
                    >
                      <span className="variant-name">{Object.values(variant.attributes).join(' - ')}</span>
                      {variant.price_override && (
                        <span className="variant-price-diff">{variant.price_override.toLocaleString()} ₫</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Purchase Controls */}
            <div className="purchase-controls">
              <div className="purchase-row">
                <div className="quantity-picker">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <button onClick={() => setQuantity(q => q + 1)}>+</button>
                </div>

                <div className="action-buttons">
                  <button
                    className="btn-add-cart"
                    onClick={handleAddToCart}
                    disabled={addingToCart || isOutOfStock}
                  >
                    {addingToCart ? (
                      <>
                        <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>
                        </svg>
                        Thêm vào giỏ
                      </>
                    )}
                  </button>
                  <button
                    className="btn-buy-now"
                    disabled={isOutOfStock}
                    onClick={() => navigate('/checkout', { state: { product, variant: selectedVariant, quantity } })}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    Mua ngay
                  </button>
                </div>
              </div>

              {/* Guarantee Strip */}
              <div className="guarantee-strip">
                <div className="guarantee-item">
                  <span className="guarantee-icon"><Truck size={18} /></span>
                  <span className="guarantee-label">Giao hàng nhanh 2-4 ngày</span>
                </div>
                <div className="guarantee-item">
                  <span className="guarantee-icon"><RefreshCcw size={18} /></span>
                  <span className="guarantee-label">Đổi trả trong 30 ngày</span>
                </div>
                <div className="guarantee-item">
                  <span className="guarantee-icon"><ShieldCheck size={18} /></span>
                  <span className="guarantee-label">Bảo hành chính hãng</span>
                </div>
              </div>
            </div>

            {/* Meta Footer */}
            <footer className="product-meta-footer">
              <div className="meta-item">
                <strong>SKU</strong>
                <span>{selectedVariant?.sku || 'N/A'}</span>
              </div>
              <div className="meta-item">
                <strong>Tình trạng</strong>
                <span>{isOutOfStock ? 'Hết hàng' : 'Còn hàng'}</span>
              </div>
              <div className="meta-item">
                <strong>Vận chuyển</strong>
                <span>Miễn phí nội thành</span>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
