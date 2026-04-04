import React, { useState, useEffect, useMemo } from 'react';
import { cartApi, getImageUrl } from '../../../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Trash2, ArrowRight, ChevronLeft, 
  ShieldCheck, Truck, RotateCcw, Lock, CreditCard, 
  Info, AlertCircle, CheckCircle2 
} from 'lucide-react';
import './CartPage.css';

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [tempItems, setTempItems] = useState([]);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();

  useEffect(() => { fetchCart(); }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCart = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await cartApi.getCart();
      if (response.ok) {
        const data = await response.json();
        setCart(data);
        setTempItems(data.items || []);
        if (data.items?.length > 0) {
          setSelectedItems(new Set(data.items.map(item => item.id)));
        }
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        setError("Không thể tải giỏ hàng.");
      }
    } catch {
      setError("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (itemId, newQty) => {
    if (newQty < 1) return;
    setIsSyncing(true);
    try {
      const response = await cartApi.updateItem(itemId, newQty);
      if (response.ok) {
        setTempItems(prev => prev.map(it => it.id === itemId ? { ...it, quantity: newQty, subtotal: it.price * newQty } : it));
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    setIsSyncing(true);
    try {
      const response = await cartApi.deleteItem(itemId);
      if (response.ok) {
        setTempItems(prev => prev.filter(it => it.id !== itemId));
        setSelectedItems(prev => { const n = new Set(prev); n.delete(itemId); return n; });
        window.dispatchEvent(new Event('cartUpdated'));
        showToast("Đã xóa sản phẩm khỏi giỏ hàng");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedItems(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectAll = () => {
    if (selectedItems.size === tempItems.length) setSelectedItems(new Set());
    else setSelectedItems(new Set(tempItems.map(it => it.id)));
  };

  const counts = useMemo(() => {
    const selected = tempItems.filter(it => selectedItems.has(it.id));
    return {
      types: selected.length,
      total: selected.reduce((acc, it) => acc + (it.quantity || 0), 0)
    };
  }, [tempItems, selectedItems]);

  const selectedTotal = useMemo(() => 
    tempItems.filter(it => selectedItems.has(it.id)).reduce((acc, it) => acc + (it.subtotal || 0), 0)
  , [tempItems, selectedItems]);

  if (loading) return (
    <div className="cart-loader">
      <div className="spinner-modular" />
    </div>
  );

  const isEmpty = tempItems.length === 0;

  return (
    <div className="cart-modern-container">
      {toast && (
        <div className={`cart-toast ${toast.type}`}>
          <CheckCircle2 size={18} /> {toast.message}
        </div>
      )}

      <div className="container">
        {/* Header Section */}
        <header className="cart-modern-header">
          <div className="header-info">
            <h1 className="title-modular">Giỏ hàng <span>({counts.total})</span></h1>
            <p className="subtitle-modular">Quản lý các linh kiện cao cấp của bạn</p>
          </div>
          <button className="btn-back" onClick={() => navigate('/products')}>
            <ChevronLeft size={18} /> Tiếp tục mua sắm
          </button>
        </header>

        {isEmpty ? (
          <div className="cart-empty-state glass-panel">
            <div className="empty-icon-box">
              <ShoppingBag size={64} strokeWidth={1} />
            </div>
            <h2>Giỏ hàng trống rỗng</h2>
            <p>Có vẻ như bạn chưa chọn được linh kiện ưng ý nào.</p>
            <button className="btn-primary" onClick={() => navigate('/products')}>Khám phá sản phẩm</button>
          </div>
        ) : (
          <div className="cart-main-layout">
            {/* Left: Items List */}
            <div className="cart-items-section">
              <div className="section-actions-bar glass-panel">
                <div className="check-all-box" onClick={selectAll}>
                  <div className={`custom-checkbox ${selectedItems.size === tempItems.length ? 'checked' : ''}`} />
                  <span>Chọn tất cả</span>
                </div>
                <button className="btn-clear-marked" disabled={selectedItems.size === 0}>
                  Xóa mục đã chọn
                </button>
              </div>

              <div className="items-stack">
                {tempItems.map(item => (
                  <div key={item.id} className={`cart-item-card glass-panel ${selectedItems.has(item.id) ? 'selected' : ''}`}>
                    <div className="item-check" onClick={() => toggleSelect(item.id)}>
                      <div className={`custom-checkbox ${selectedItems.has(item.id) ? 'checked' : ''}`} />
                    </div>
                    
                    <div className="item-img" onClick={() => navigate(`/products/${item.variant.product_id}`)}>
                      <img src={getImageUrl(item.variant.product.image_url)} alt="" />
                    </div>

                    <div className="item-details">
                      <div className="item-title-row">
                        <h3 className="item-name" onClick={() => navigate(`/products/${item.variant.product_id}`)}>
                          {item.variant.product.name}
                        </h3>
                        <button className="btn-remove-item" onClick={() => handleDeleteItem(item.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="item-variant-chip">
                        {Object.values(item.variant.attributes).join(' / ')}
                      </div>

                      <div className="item-bottom-row">
                        <div className="item-qty-stepper">
                          <button onClick={() => handleUpdateQty(item.id, item.quantity - 1)} disabled={isSyncing}>-</button>
                          <input type="number" value={item.quantity} readOnly />
                          <button onClick={() => handleUpdateQty(item.id, item.quantity + 1)} disabled={isSyncing}>+</button>
                        </div>
                        <div className="item-price-info">
                          <span className="unit-price">{(item.price || 0).toLocaleString()} ₫</span>
                          <span className="sub-price">{(item.subtotal || 0).toLocaleString()} ₫</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Summary Panel */}
            <aside className="cart-summary-section">
              <div className="summary-sticky glass-panel">
                <h2 className="summary-title">Tóm tắt đơn hàng</h2>
                <div className="summary-list">
                  <div className="summary-row">
                    <span>Số loại sản phẩm</span>
                    <span>{counts.types}</span>
                  </div>
                  <div className="summary-row">
                    <span>Số lượng sản phẩm</span>
                    <span>{counts.total}</span>
                  </div>
                  <div className="summary-row">
                    <span>Tạm tính</span>
                    <span>{selectedTotal.toLocaleString()} ₫</span>
                  </div>
                  <div className="summary-row promo">
                    <span>Mã giảm giá</span>
                    <button className="btn-add-promo">Thêm mã</button>
                  </div>
                  <div className="summary-row shipping">
                    <span>Vận chuyển</span>
                    <span className="free">Miễn phí</span>
                  </div>
                  <div className="summary-divider" />
                  <div className="summary-row total">
                    <span>Tổng cộng</span>
                    <span className="total-value">{selectedTotal.toLocaleString()} ₫</span>
                  </div>
                </div>

                <button 
                  className="btn-checkout-modular" 
                  disabled={selectedItems.size === 0}
                  onClick={() => navigate('/checkout')}
                >
                  Tiến hành thanh toán <ArrowRight size={18} />
                </button>

                <div className="trust-footer">
                  <div className="trust-point"><Lock size={14} /> Thanh toán bảo mật SSL</div>
                  <div className="trust-point"><RotateCcw size={14} /> Đổi trả trong 30 ngày</div>
                </div>

                {/* Moved Feature Grid inside for sticky consistency */}
                <div className="cart-features-grid">
                  <div className="feat-box">
                    <Truck size={20} />
                    <strong>Giao hàng 2h</strong>
                    <span>Nội thành HN/HCM</span>
                  </div>
                  <div className="feat-box">
                    <ShieldCheck size={20} />
                    <strong>Bảo hành tận nơi</strong>
                    <span>Gói VIP Care+</span>
                  </div>
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
