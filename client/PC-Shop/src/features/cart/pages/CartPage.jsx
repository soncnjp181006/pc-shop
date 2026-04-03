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
      <div className="cart-container">
        <header className="cart-header">
          <h1 className="cart-title">Giỏ hàng của bạn</h1>
          {!isEmpty && <span className="cart-count">{cart.items.length} sản phẩm</span>}
        </header>
        
        {isEmpty ? (
          <div className="empty-cart-card">
            <div className="empty-icon">🛒</div>
            <h2>Giỏ hàng đang trống</h2>
            <p>Hãy khám phá những sản phẩm công nghệ tuyệt vời tại PC Shop.</p>
            <Link to="/products" className="btn-primary">Mua sắm ngay</Link>
          </div>
        ) : (
          <div className="cart-grid">
            <div className="cart-items-panel">
              {cart.items.map(item => (
                <div key={item.id} className="cart-item-row">
                  <div className="item-img-card">
                    {item.variant.product?.image_url ? (
                      <img src={getImageUrl(item.variant.product.image_url)} alt="product" className="cart-item-img" />
                    ) : (
                      "PC"
                    )}
                  </div>
                  <div className="item-info">
                    <Link to={`/products/${item.variant.product_id}`} className="item-title">
                      {item.variant.product?.name || `Sản phẩm #${item.variant.product_id}`}
                    </Link>
                    <div className="item-variant-label">
                      {Object.values(item.variant.attributes).join(' - ')}
                    </div>
                    <div className="item-price-each">
                      {(item.variant.price_override || 0).toLocaleString()} VNĐ
                    </div>
                  </div>
                  <div className="item-quantity-control">
                    <button onClick={() => handleUpdateQty(item.id, item.quantity - 1)}>-</button>
                    <span className="qty-val">{item.quantity}</span>
                    <button onClick={() => handleUpdateQty(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <div className="item-subtotal">
                    {((item.variant.price_override || 0) * item.quantity).toLocaleString()} VNĐ
                  </div>
                  <button className="btn-remove" onClick={() => handleDeleteItem(item.id)} title="Xóa">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <aside className="cart-summary-panel">
              <h3>Tóm tắt đơn hàng</h3>
              <div className="summary-details">
                <div className="summary-row">
                  <span>Tạm tính</span>
                  <span>{cart.total_price.toLocaleString()} VNĐ</span>
                </div>
                <div className="summary-row">
                  <span>Giao hàng</span>
                  <span className="free">Miễn phí</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row grand-total">
                  <span>Tổng cộng</span>
                  <span>{cart.total_price.toLocaleString()} VNĐ</span>
                </div>
              </div>
              <button className="btn-checkout">Tiến hành thanh toán</button>
              <p className="secure-text">🔒 Thanh toán an toàn & bảo mật</p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
