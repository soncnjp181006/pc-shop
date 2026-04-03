import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsApi, cartApi, getImageUrl } from '../../../utils/api';
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
    fetchProductDetail();
  }, [id]);

  const fetchProductDetail = async () => {
    setLoading(true);
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
        
        if (variantsData.length > 0) {
          setSelectedVariant(variantsData[0]);
        }
      } else {
        setError("Không tìm thấy sản phẩm.");
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết sản phẩm:', err);
      setError("Có lỗi xảy ra khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    // Nếu có variants nhưng chưa chọn
    if (variants.length > 0 && !selectedVariant) {
      showToast('Vui lòng chọn một phiên bản sản phẩm.', 'error');
      return;
    }

    const currentAvailable = selectedVariant ? selectedVariant.available_stock : product.available_stock;
    if (quantity > currentAvailable) {
      showToast(`Chỉ còn ${currentAvailable} sản phẩm có sẵn. Một số đã được người khác thêm vào giỏ hàng.`, 'error');
      return;
    }

    const variantId = selectedVariant ? parseInt(selectedVariant.id) : null;
    const productId = parseInt(id);

    setAddingToCart(true);
    try {
      console.log('Adding to cart:', { variantId, productId, quantity });
      const response = await cartApi.addItem(variantId, quantity, productId);
      
      if (response.ok) {
        showToast('Đã thêm sản phẩm vào giỏ hàng! 🛒', 'success');
        // Dispatch custom event to notify Header to refresh cart count
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Lỗi API thêm vào giỏ hàng:', response.status, errorData);
        
        if (response.status === 401) {
          showToast('Vui lòng đăng nhập để thêm vào giỏ hàng.', 'error');
          setTimeout(() => navigate('/'), 2000);
        } else {
          showToast(errorData.detail || 'Lỗi khi thêm vào giỏ hàng.', 'error');
        }
      }
    } catch (error) {
      console.error('Lỗi kết nối khi thêm vào giỏ hàng:', error);
      showToast('Lỗi kết nối server.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Đang tải thông tin sản phẩm...</p>
    </div>
  );
  
  if (error) return (
    <div className="loading-container">
      <div className="error-state">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/products')}>Quay lại</button>
      </div>
    </div>
  );
  if (!product) return null;

  return (
    <div className="product-page animate-fade-in">
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>✕</button>
        </div>
      )}
      <div className="product-container">
        <nav className="breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span className="separator">/</span>
          <Link to="/products">Sản phẩm</Link>
          <span className="separator">/</span>
          <span className="current">{product.name}</span>
        </nav>

        <div className="product-grid-detail">
          <div className="product-gallery">
            {(() => {
              // Hợp nhất ảnh chính và ảnh bổ sung
              const mediaMatch = (product.description || '').match(/\[MEDIA:(.*?)\]/);
              const extraLinks = mediaMatch ? mediaMatch[1].split(';').filter(l => l.trim()) : [];
              const mediaList = [product.image_url, ...extraLinks].filter(Boolean);
              
              if (mediaList.length === 0) return (
                <div className="main-image-card placeholder">PC Shop</div>
              );

              const currentMedia = mediaList[activeMediaIdx];
              const isVideo = (url) => url.includes('youtube.com') || url.includes('youtu.be') || url.includes('.mp4');

              return (
                <>
                  <div className="main-image-card">
                    {isVideo(currentMedia) ? (
                      <div className="video-main-container">
                        <iframe
                          src={currentMedia.replace('watch?v=', 'embed/')}
                          title="Product Video"
                          frameBorder="0"
                          allowFullScreen
                        ></iframe>
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

                  {mediaList.length > 1 && (
                    <div className="media-gallery-premium">
                      {mediaList.map((link, idx) => (
                        <div 
                          key={idx} 
                          className={`media-item-card ${idx === activeMediaIdx ? 'active' : ''} ${isVideo(link) ? 'video-type' : ''}`}
                          onClick={() => {
                            setActiveMediaIdx(idx);
                            setLightboxIndex(idx);
                          }}
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

                  {/* Lightbox Modal */}
                  {lightboxIndex !== null && (
                    <div className="media-lightbox" onClick={() => setLightboxIndex(null)}>
                      <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={() => setLightboxIndex(null)}>&times;</button>
                        {isVideo(mediaList[lightboxIndex]) ? (
                          <iframe
                            src={mediaList[lightboxIndex].replace('watch?v=', 'embed/')}
                            title="Lightbox Video"
                            frameBorder="0"
                            allowFullScreen
                          ></iframe>
                        ) : (
                          <img src={getImageUrl(mediaList[lightboxIndex])} alt="Full view" />
                        )}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <div className="product-info-panel">
            <header className="info-header">
              <span className="badge-new">Chính hãng</span>
              <h1 className="product-title">{product.name}</h1>
              <div className="price-tag">
                {(selectedVariant?.price_override || product.base_price).toLocaleString()} VNĐ
              </div>
              <div className={`stock-status ${(selectedVariant?.available_stock ?? product.available_stock) > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {(selectedVariant?.available_stock ?? product.available_stock) > 0 
                  ? `Có sẵn: ${selectedVariant?.available_stock ?? product.available_stock}` 
                  : 'Hết hàng (đã được đặt hết)'}
              </div>
              <div className="stock-info-small">
                (Tổng kho: {selectedVariant?.stock_quantity ?? product.stock_quantity})
              </div>
            </header>

            <section className="product-description-section">
              <h3>Mô tả sản phẩm</h3>
              <p>
                {(product.description || "Sản phẩm công nghệ cao cấp, mang lại hiệu năng tối ưu cho công việc và giải trí.")
                  .replace(/\[MEDIA:.*?\]/, '')
                  .split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}<br/>
                    </React.Fragment>
                  ))
                }
              </p>
            </section>

            {variants.length > 0 && (
              <section className="options-section">
                <h3>Chọn phiên bản</h3>
                <div className="variants-grid">
                  {variants.map(variant => (
                    <button
                      key={variant.id}
                      className={`variant-option ${selectedVariant?.id === variant.id ? 'selected' : ''}`}
                      onClick={() => setSelectedVariant(variant)}
                    >
                      <span className="variant-name">
                        {Object.values(variant.attributes).join(' - ')}
                      </span>
                      {variant.price_override && (
                        <span className="variant-price-diff">
                          {variant.price_override.toLocaleString()} VNĐ
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="purchase-controls">
              <div className="quantity-picker">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ color: '#00e5ff', opacity: 1, visibility: 'visible', textAlign: 'center' }}
                />
                <button onClick={() => setQuantity(q => q + 1)}>+</button>
              </div>

              <div className="action-buttons">
                <button 
                  className="btn-add-cart" 
                  onClick={handleAddToCart}
                  disabled={addingToCart || (selectedVariant ? selectedVariant.available_stock <= 0 : product.available_stock <= 0)}
                >
                  {addingToCart ? "Đang xử lý..." : "Thêm vào giỏ hàng"}
                </button>
                <button 
                  className="btn-buy-now"
                  disabled={(selectedVariant ? selectedVariant.available_stock <= 0 : product.available_stock <= 0)}
                  onClick={() => navigate('/checkout', { state: { product, variant: selectedVariant, quantity } })}
                >
                  Mua ngay
                </button>
              </div>
            </div>

            <footer className="product-meta-footer">
              <div className="meta-item">
                <strong>SKU:</strong> {selectedVariant?.sku || 'N/A'}
              </div>
              <div className="meta-item">
                <strong>Tình trạng:</strong> {(selectedVariant?.stock_quantity ?? product.stock_quantity) > 0 ? 'Còn hàng' : 'Hết hàng'}
              </div>
              <div className="meta-item">
                <strong>Vận chuyển:</strong> Miễn phí nội thành
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
