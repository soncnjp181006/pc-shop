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
    if (!selectedVariant) {
      alert("Vui lòng chọn một phiên bản sản phẩm.");
      return;
    }

    setAddingToCart(true);
    try {
      const response = await cartApi.addItem(selectedVariant.id, quantity);
      if (response.ok) {
        // Success feedback
        alert("Đã thêm sản phẩm vào giỏ hàng!");
      } else if (response.status === 401) {
        navigate('/');
      } else {
        alert("Lỗi khi thêm vào giỏ hàng.");
      }
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      alert("Lỗi kết nối server.");
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
  
  if (error) return <div className="error-message">{error}</div>;
  if (!product) return null;

  return (
    <div className="product-page animate-fade-in">
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
            <div className="main-image-card">
              {product.image_url ? (
                <img src={getImageUrl(product.image_url)} alt={product.name} className="detail-img" />
              ) : (
                <div className="image-placeholder-large">PC</div>
              )}
            </div>
            <div className="thumbnail-grid">
              {[1, 2, 3].map(i => (
                <div key={i} className="thumb-card">PC</div>
              ))}
            </div>
          </div>

          <div className="product-info-panel">
            <header className="info-header">
              <span className="badge-new">Chính hãng</span>
              <h1 className="product-title">{product.name}</h1>
              <div className="price-tag">
                {(selectedVariant?.price_override || product.base_price).toLocaleString()} VNĐ
              </div>
            </header>

            <section className="product-description-section">
              <h3>Mô tả sản phẩm</h3>
              <p>{product.description || "Sản phẩm công nghệ cao cấp, mang lại hiệu năng tối ưu cho công việc và giải trí."}</p>
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
                />
                <button onClick={() => setQuantity(q => q + 1)}>+</button>
              </div>

              <div className="action-buttons">
                <button 
                  className="btn-add-cart" 
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                >
                  {addingToCart ? "Đang xử lý..." : "Thêm vào giỏ hàng"}
                </button>
                <button className="btn-buy-now">Mua ngay</button>
              </div>
            </div>

            <footer className="product-meta-footer">
              <div className="meta-item">
                <strong>SKU:</strong> {selectedVariant?.sku || 'N/A'}
              </div>
              <div className="meta-item">
                <strong>Tình trạng:</strong> {selectedVariant?.stock_quantity > 0 ? 'Còn hàng' : 'Hết hàng'}
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
