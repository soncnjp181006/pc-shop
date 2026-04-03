import React, { useState, useEffect, useMemo } from 'react';
import { cartApi, getImageUrl } from '../../../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import './CartPage.css';

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
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
        // Mặc định chọn tất cả sản phẩm
        if (data.items && data.items.length > 0) {
          const allIds = data.items.map(item => item.id);
          setSelectedItems(new Set(allIds));
        }
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
    if (newQty < 1) {
      handleDeleteItem(itemId);
      return;
    }
    try {
      const response = await cartApi.updateItem(itemId, newQty);
      if (response.ok) {
        const updatedItem = await response.json();
        setCart(prev => ({
          ...prev,
          items: prev.items.map(item => item.id === itemId ? updatedItem : item),
          total_price: prev.items.reduce((acc, item) => {
            const price = item.id === itemId ? updatedItem.subtotal : item.subtotal;
            return acc + price;
          }, 0)
        }));
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
        setCart(prev => ({
          ...prev,
          items: prev.items.filter(item => item.id !== itemId)
        }));
        setSelectedItems(prev => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);
    }
  };

  const toggleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === cart.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cart.items.map(item => item.id)));
    }
  };

  const selectedTotal = useMemo(() => {
    if (!cart || !cart.items) return 0;
    return cart.items
      .filter(item => selectedItems.has(item.id))
      .reduce((acc, item) => acc + (item.subtotal || 0), 0);
  }, [cart, selectedItems]);

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
            <h1 className="cart-title">Giỏ hàng <span className="accent">TikTok Style</span></h1>
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
          <div className="cart-content-wrapper">
            <div className="cart-table-header">
              <div className="col-check">
                <input 
                  type="checkbox" 
                  checked={selectedItems.size === cart.items.length && cart.items.length > 0} 
                  onChange={toggleSelectAll}
                  id="select-all"
                />
                <label htmlFor="select-all">Tất cả ({cart.items.length} sản phẩm)</label>
              </div>
              <div className="col-price mobile-hidden">Đơn giá</div>
              <div className="col-qty mobile-hidden">Số lượng</div>
              <div className="col-subtotal mobile-hidden">Số tiền</div>
              <div className="col-action mobile-hidden">Thao tác</div>
            </div>

            <div className="cart-items-list">
              {cart.items.map(item => (
                <div key={item.id} className={`cart-item-tiktok ${selectedItems.has(item.id) ? 'selected' : ''}`}>
                  <div className="col-check">
                    <input 
                      type="checkbox" 
                      checked={selectedItems.has(item.id)} 
                      onChange={() => toggleSelectItem(item.id)} 
                    />
                  </div>
                  
                  <div className="col-info">
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
                        Phân loại: {Object.values(item.variant.attributes).join(' • ')}
                      </div>
                      <div className="mobile-only price-qty-row">
                        <span className="mobile-price">{(item.price || 0).toLocaleString()} VNĐ</span>
                        <div className="qty-stepper mini">
                          <button className="step-btn" onClick={() => handleUpdateQty(item.id, item.quantity - 1)}>-</button>
                          <span className="qty-number">{item.quantity}</span>
                          <button className="step-btn" onClick={() => handleUpdateQty(item.id, item.quantity + 1)}>+</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-price mobile-hidden">
                    {(item.price || 0).toLocaleString()} VNĐ
                  </div>

                  <div className="col-qty mobile-hidden">
                    <div className="qty-stepper">
                      <button className="step-btn" onClick={() => handleUpdateQty(item.id, item.quantity - 1)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14"/></svg>
                      </button>
                      <span className="qty-number">{item.quantity}</span>
                      <button className="step-btn" onClick={() => handleUpdateQty(item.id, item.quantity + 1)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                      </button>
                    </div>
                  </div>

                  <div className="col-subtotal mobile-hidden">
                    {(item.subtotal || 0).toLocaleString()} VNĐ
                  </div>

                  <div className="col-action">
                    <button className="btn-delete" onClick={() => handleDeleteItem(item.id)}>
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Sticky Checkout Bar */}
            <div className="checkout-sticky-bar">
              <div className="container bar-content">
                <div className="bar-left mobile-hidden">
                  <input 
                    type="checkbox" 
                    checked={selectedItems.size === cart.items.length && cart.items.length > 0} 
                    onChange={toggleSelectAll}
                    id="select-all-bottom"
                  />
                  <label htmlFor="select-all-bottom">Chọn tất cả ({cart.items.length})</label>
                  <button className="btn-clear-selected" onClick={() => setSelectedItems(new Set())}>Bỏ chọn</button>
                </div>
                
                <div className="bar-right">
                  <div className="total-info">
                    <span className="total-label">Tổng thanh toán ({selectedItems.size} sản phẩm):</span>
                    <span className="total-amount">{selectedTotal.toLocaleString()} VNĐ</span>
                  </div>
                  <button 
                    className={`btn-checkout-tiktok ${selectedItems.size === 0 ? 'disabled' : ''}`}
                    disabled={selectedItems.size === 0}
                  >
                    Mua hàng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
