import React, { useState, useEffect } from 'react';
import { cartApi, getImageUrl } from '../../../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import './CartPage.css';

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await cartApi.getCart();
      if (response.ok) {
        const data = await response.json();
        setCart(data);
      } else if (response.status === 401) {
        navigate('/');
      }
    } catch (error) {
      console.error('Lỗi khi tải giỏ hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (itemId, newQty) => {
    if (newQty < 1) return;
    try {
      const response = await cartApi.updateItem(itemId, newQty);
      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật số lượng:', error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Xóa sản phẩm này khỏi giỏ hàng?")) return;
    try {
      const response = await cartApi.deleteItem(itemId);
      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Đang tải giỏ hàng...</p>
    </div>
  );

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  return (
    <div className="cart-page animate-fade-in">
      <div className="container cart-layout">
        <header className="cart-header">
          <div className="header-text">
            <h1 className="cart-title">Giỏ hàng <span className="accent">Của bạn</span></h1>
            {!isEmpty && <span className="cart-count">Tất cả {cart.items.length} sản phẩm</span>}
          </div>
          <Link to="/products" className="continue-shopping">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7 7l-7-7 7-7"/></svg>
            Tiếp tục mua sắm
          </Link>
        </header>
        
        {isEmpty ? (
          <div className="empty-cart-premium">
            <div className="empty-icon-box">🛒</div>
            <h2>Giỏ hàng chưa có gì</h2>
            <p>Hàng ngàn sản phẩm công nghệ đỉnh cao đang chờ bạn khám phá.</p>
            <Link to="/products" className="btn btn-primary btn-lg">Bắt đầu mua sắm</Link>
          </div>
        ) : (
          <div className="cart-grid">
            <div className="cart-items-section">
              {cart.items.map(item => (
                <div key={item.id} className="cart-item-premium">
                  <div className="item-visual">
                    <div className="item-img-wrapper">
                      {item.variant.product?.image_url ? (
                        <img src={getImageUrl(item.variant.product.image_url)} alt="product" />
                      ) : (
                        <span className="no-img">PC</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="item-details">
                    <Link to={`/products/${item.variant.product_id}`} className="item-name">
                      {item.variant.product?.name || `Sản phẩm #${item.variant.product_id}`}
                    </Link>
                    <div className="item-variant-info">
                      {Object.values(item.variant.attributes).join(' • ')}
                    </div>
                    <div className="item-price-unit">
                      {(item.variant.price_override || 0).toLocaleString()} VNĐ
                    </div>
                  </div>

                  <div className="item-controls">
                    <div className="qty-stepper">
                      <button className="step-btn" onClick={() => handleUpdateQty(item.id, item.quantity - 1)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14"/></svg>
                      </button>
                      <span className="qty-number">{item.quantity}</span>
                      <button className="step-btn" onClick={() => handleUpdateQty(item.id, item.quantity + 1)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                      </button>
                    </div>
                    <button className="btn-remove-lite" onClick={() => handleDeleteItem(item.id)}>
                      Xóa
                    </button>
                  </div>

                  <div className="item-total-price">
                    {((item.variant.price_override || 0) * item.quantity).toLocaleString()} VNĐ
                  </div>
                </div>
              ))}
            </div>

            <aside className="cart-summary-section">
              <div className="summary-card">
                <h3>Chi tiết thanh toán</h3>
                <div className="summary-rows">
                  <div className="s-row">
                    <span>Tạm tính</span>
                    <span className="s-val">{cart.total_price.toLocaleString()} VNĐ</span>
                  </div>
                  <div className="s-row">
                    <span>Vận chuyển</span>
                    <span className="s-val free">Miễn phí</span>
                  </div>
                  <div className="s-divider"></div>
                  <div className="s-row grand-total">
                    <span>Tổng đơn hàng</span>
                    <span className="s-val">{cart.total_price.toLocaleString()} VNĐ</span>
                  </div>
                </div>
                <button className="btn btn-primary btn-checkout">
                  Thanh toán ngay
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7l7 7-7 7"/></svg>
                </button>
                <div className="summary-meta">
                  <p>💳 Hỗ trợ thẻ tín dụng, ví điện tử</p>
                  <p>🛡️ Cam kết bảo mật 100%</p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
