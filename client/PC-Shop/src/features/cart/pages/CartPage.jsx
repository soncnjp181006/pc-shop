import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { cartApi, productsApi, getImageUrl } from '../../../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Trash2, ArrowRight, ChevronLeft,
  ShieldCheck, Truck, RotateCcw, Lock, CreditCard,
  Info, AlertCircle, CheckCircle2, Heart, Star, Gift,
  Zap, Award, Package, Sparkles, Minus, Plus, X, Tag
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
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [freeShippingThreshold] = useState(5000000); // 5M VND for PC parts
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name, isBulk }
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  const navigate = useNavigate();

  useEffect(() => { 
    fetchCart(); 
    fetchRecommended(); 
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

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
          // Default select all on first load
          setSelectedItems(new Set(data.items.map(item => item.id)));
        }
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        setError("Không thể tải giỏ hàng. Vui lòng đăng nhập lại.");
      }
    } catch {
      setError("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommended = async () => {
    try {
      const res = await productsApi.getAll({ limit: 12, active_only: true });
      if (res.ok) {
        const data = await res.json();
        setRecommendedProducts(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateQty = async (itemId, newQty) => {
    if (newQty < 1) return;
    
    // Optimistic update
    const oldItems = [...tempItems];
    setTempItems(prev => prev.map(it => 
      it.id === itemId ? { ...it, quantity: newQty, subtotal: it.price * newQty } : it
    ));

    setIsSyncing(true);
    try {
      const response = await cartApi.updateItem(itemId, newQty);
      if (response.ok) {
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        setTempItems(oldItems);
        showToast("Lỗi khi cập nhật số lượng", "error");
      }
    } catch (error) {
      setTempItems(oldItems);
      showToast("Lỗi kết nối", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteItem = (itemId) => {
    const item = tempItems.find(it => it.id === itemId);
    if (item) {
      setDeleteConfirm({ id: itemId, name: item.variant.product.name, isBulk: false });
    }
  };

  const handleClearSelected = () => {
    if (selectedItems.size === 0) return;
    setDeleteConfirm({ 
      id: null, 
      name: `${selectedItems.size} sản phẩm đã chọn`, 
      isBulk: true 
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setIsSyncing(true);
    try {
      if (deleteConfirm.isBulk) {
        // Bulk delete logic - deleting one by one since backend might not have bulk yet
        const idsToDelete = Array.from(selectedItems);
        await Promise.all(idsToDelete.map(id => cartApi.deleteItem(id)));
        
        setTempItems(prev => prev.filter(it => !selectedItems.has(it.id)));
        setSelectedItems(new Set());
        showToast(`Đã xóa ${idsToDelete.length} sản phẩm khỏi giỏ hàng`);
      } else {
        const response = await cartApi.deleteItem(deleteConfirm.id);
        if (response.ok) {
          setTempItems(prev => prev.filter(it => it.id !== deleteConfirm.id));
          setSelectedItems(prev => { 
            const n = new Set(prev); 
            n.delete(deleteConfirm.id); 
            return n; 
          });
          showToast("Đã xóa sản phẩm khỏi giỏ hàng");
        }
      }
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      showToast("Lỗi khi xóa sản phẩm", "error");
    } finally {
      setIsSyncing(false);
      setDeleteConfirm(null);
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

  const handleApplyVoucher = (e) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;
    
    // Simulating voucher logic
    if (voucherCode.toUpperCase() === 'PCSHOP2026') {
      setAppliedVoucher({ code: 'PCSHOP2026', discount: 200000, label: 'Giảm 200k' });
      showToast("Đã áp dụng mã giảm giá!");
      setVoucherCode('');
    } else {
      showToast("Mã giảm giá không hợp lệ", "error");
    }
  };

  const counts = useMemo(() => {
    const selected = tempItems.filter(it => selectedItems.has(it.id));
    return {
      types: selected.length,
      total: selected.reduce((acc, it) => acc + (it.quantity || 0), 0)
    };
  }, [tempItems, selectedItems]);

  const selectedSubtotal = useMemo(() =>
    tempItems.filter(it => selectedItems.has(it.id)).reduce((acc, it) => acc + (it.subtotal || 0), 0)
  , [tempItems, selectedItems]);

  const shippingFee = useMemo(() => {
    if (selectedItems.size === 0 || selectedSubtotal >= freeShippingThreshold) return 0;
    return 35000;
  }, [selectedSubtotal, selectedItems, freeShippingThreshold]);

  const discountAmount = useMemo(() => appliedVoucher ? appliedVoucher.discount : 0, [appliedVoucher]);
  
  const finalTotal = useMemo(() => 
    Math.max(0, selectedSubtotal + shippingFee - discountAmount)
  , [selectedSubtotal, shippingFee, discountAmount]);

  const progressPercent = useMemo(() => Math.min((selectedSubtotal / freeShippingThreshold) * 100, 100), [selectedSubtotal, freeShippingThreshold]);

  if (loading) return (
    <div className="cart-loader-container">
      <div className="cart-skeleton-header" />
      <div className="cart-skeleton-layout">
        <div className="cart-skeleton-items">
          {[1, 2, 3].map(i => <div key={i} className="skeleton-item glass-panel" />)}
        </div>
        <div className="cart-skeleton-summary glass-panel" />
      </div>
    </div>
  );

  const isEmpty = tempItems.length === 0;

  return (
    <div className="cart-modern-container">
      {toast && createPortal(
        <div className={`cart-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && createPortal(
        <div className="delete-confirm-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-confirm-modal glass-panel" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm-header">
              <div className="warning-icon-box">
                <AlertCircle size={32} className="alert-icon" />
              </div>
              <h2>Xác nhận xóa</h2>
            </div>
            <p className="delete-confirm-message">
              Bạn có chắc chắn muốn xóa <strong>{deleteConfirm.name}</strong>?
            </p>
            <p className="delete-confirm-note">Hành động này sẽ xóa vĩnh viễn sản phẩm khỏi giỏ hàng của bạn.</p>
            <div className="delete-confirm-actions">
              <button 
                className="btn-cancel-delete"
                onClick={() => setDeleteConfirm(null)}
                disabled={isSyncing}
              >
                Quay lại
              </button>
              <button 
                className="btn-confirm-delete"
                onClick={confirmDelete}
                disabled={isSyncing}
              >
                {isSyncing ? 'Đang xử lý...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="container">
        {/* Header Section */}
        <header className="cart-modern-header">
          <div className="header-info">
            <h1 className="title-modular">Giỏ hàng của bạn</h1>
            <p className="subtitle-modular">Quản lý các sản phẩm bạn đã chọn để thanh toán</p>
          </div>
          <Link to="/products" className="btn-continue-shopping">
            <ChevronLeft size={18} /> Tiếp tục mua sắm
          </Link>
        </header>

        {isEmpty ? (
          <div className="cart-empty-wrapper">
            <div className="cart-empty-state glass-panel animate-fade-in">
              <div className="empty-visual">
                <div className="empty-icon-ring">
                  <ShoppingBag size={80} strokeWidth={1} />
                </div>
                <div className="empty-sparkle s1"><Sparkles size={20} /></div>
                <div className="empty-sparkle s2"><Sparkles size={16} /></div>
              </div>
              <h2>Giỏ hàng đang chờ bạn</h2>
              <p>Có vẻ như bạn chưa chọn được linh kiện nào cho dàn máy mơ ước của mình.</p>
              <div className="empty-actions">
                <button className="btn-primary-glow" onClick={() => navigate('/products')}>
                  Khám phá ngay
                </button>
                <button className="btn-secondary-outline" onClick={() => navigate('/home')}>
                  Về trang chủ
                </button>
              </div>
            </div>

            {recommendedProducts.length > 0 && (
              <div className="empty-recommendations">
                <h3 className="section-title"><Sparkles size={20} /> Sản phẩm đang hot</h3>
                <div className="recommendations-grid">
                  {recommendedProducts.slice(0, 4).map(product => (
                    <div key={product.id} className="rec-card glass-panel" onClick={() => navigate(`/products/${product.id}`)}>
                      <div className="rec-img">
                        <img src={getImageUrl(product.image_url)} alt={product.name} />
                      </div>
                      <div className="rec-info">
                        <h4>{product.name}</h4>
                        <span className="price">{product.base_price.toLocaleString()} ₫</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="cart-main-layout">
            {/* Left: Items List */}
            <div className="cart-content-left">
              {/* Trust & Promo Row */}
              <div className="cart-trust-row">
                <div className="trust-card glass-panel">
                  <Truck size={20} className="t-icon" />
                  <div className="t-content">
                    <strong>Giao hàng nhanh</strong>
                    <span>Toàn quốc trong 24-48h</span>
                  </div>
                </div>
                <div className="trust-card glass-panel">
                  <ShieldCheck size={20} className="t-icon" />
                  <div className="t-content">
                    <strong>Bảo hành chính hãng</strong>
                    <span>Cam kết chất lượng 100%</span>
                  </div>
                </div>
                <div className="trust-card glass-panel">
                  <RotateCcw size={20} className="t-icon" />
                  <div className="t-content">
                    <strong>Đổi trả dễ dàng</strong>
                    <span>30 ngày dùng thử</span>
                  </div>
                </div>
              </div>

              <div className="section-actions-bar glass-panel">
                <div className="check-all-wrapper" onClick={selectAll}>
                  <div className={`custom-checkbox ${selectedItems.size === tempItems.length ? 'checked' : ''}`} />
                  <span>Chọn tất cả ({tempItems.length})</span>
                </div>
                {selectedItems.size > 0 && (
                  <button className="btn-clear-selected" onClick={handleClearSelected}>
                    <Trash2 size={16} /> Xóa đã chọn ({selectedItems.size})
                  </button>
                )}
              </div>

              <div className="items-list-stack">
                {tempItems.map(item => (
                  <div
                    key={item.id}
                    className={`cart-item-card-v2 glass-panel ${selectedItems.has(item.id) ? 'selected' : ''}`}
                  >
                    <div className="item-selection" onClick={() => toggleSelect(item.id)}>
                      <div className={`custom-checkbox ${selectedItems.has(item.id) ? 'checked' : ''}`} />
                    </div>

                    <div className="item-main-content">
                      <div className="item-image-box" onClick={() => navigate(`/products/${item.variant.product_id}`)}>
                        <img src={getImageUrl(item.variant.product.image_url)} alt={item.variant.product.name} />
                      </div>

                      <div className="item-info-box">
                        <div className="item-header">
                          <h3 className="item-name" onClick={() => navigate(`/products/${item.variant.product_id}`)}>
                            {item.variant.product.name}
                          </h3>
                          <button className="btn-icon-remove" onClick={() => handleDeleteItem(item.id)}>
                            <X size={18} />
                          </button>
                        </div>

                        <div className="item-meta">
                          <div className="variant-tag">
                            <Package size={12} />
                            {Object.values(item.variant.attributes).join(' / ')}
                          </div>
                          <span className="stock-status in-stock">Sẵn hàng</span>
                        </div>

                        <div className="item-controls-row">
                          <div className="qty-control">
                            <button 
                              className="qty-btn" 
                              onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                              disabled={isSyncing || item.quantity <= 1}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="qty-value">{item.quantity}</span>
                            <button 
                              className="qty-btn" 
                              onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                              disabled={isSyncing}
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <div className="price-display">
                            <span className="unit-price">{(item.price || 0).toLocaleString()} ₫</span>
                            <span className="subtotal-price">{(item.subtotal || 0).toLocaleString()} ₫</span>
                          </div>
                        </div>

                        <div className="item-footer-actions">
                          <button className="btn-text-action">
                            <Heart size={14} /> Lưu lại
                          </button>
                          <div className="divider" />
                          <button className="btn-text-action">
                            <Info size={14} /> Chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Summary Panel */}
            <aside className="cart-summary-right">
              <div className="summary-sticky-card glass-panel">
                <div className="shipping-upsell">
                  <div className="upsell-header">
                    <Truck size={20} className={selectedSubtotal >= freeShippingThreshold ? 'success' : ''} />
                    <span>Miễn phí vận chuyển</span>
                  </div>
                  <div className="upsell-progress">
                    <div className="progress-track">
                      <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <p className="progress-note">
                      {selectedSubtotal >= freeShippingThreshold ? 
                        'Bạn đã đủ điều kiện miễn phí ship!' : 
                        `Mua thêm ${(freeShippingThreshold - selectedSubtotal).toLocaleString()} ₫ để được miễn phí ship`
                      }
                    </p>
                  </div>
                </div>

                <div className="summary-section">
                  <h2 className="summary-title">Tổng quan đơn hàng</h2>
                  
                  <div className="summary-rows">
                    <div className="summary-row">
                      <span>Tạm tính ({counts.total} món)</span>
                      <span>{selectedSubtotal.toLocaleString()} ₫</span>
                    </div>
                    <div className="summary-row">
                      <span>Phí vận chuyển</span>
                      <span className={shippingFee === 0 ? 'free-text' : ''}>
                        {shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString()} ₫`}
                      </span>
                    </div>
                    {appliedVoucher && (
                      <div className="summary-row discount">
                        <span className="voucher-label">
                          <Tag size={12} /> {appliedVoucher.code}
                        </span>
                        <span>-{appliedVoucher.discount.toLocaleString()} ₫</span>
                      </div>
                    )}
                  </div>

                  <div className="voucher-input-box">
                    <form onSubmit={handleApplyVoucher}>
                      <input 
                        type="text" 
                        placeholder="Mã giảm giá (Ví dụ: PCSHOP2026)" 
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                      />
                      <button type="submit" disabled={!voucherCode.trim()}>Áp dụng</button>
                    </form>
                    {appliedVoucher && (
                      <div className="applied-voucher-info">
                        <span>Đã giảm {appliedVoucher.discount.toLocaleString()} ₫</span>
                        <button onClick={() => setAppliedVoucher(null)}>Gỡ bỏ</button>
                      </div>
                    )}
                  </div>

                  <div className="total-divider" />
                  
                  <div className="summary-total">
                    <div className="total-label">
                      <strong>Tổng tiền</strong>
                      <span>(Đã bao gồm VAT)</span>
                    </div>
                    <div className="total-amount">{finalTotal.toLocaleString()} ₫</div>
                  </div>

                  <button
                    className="btn-checkout-glow"
                    disabled={selectedItems.size === 0 || isSyncing}
                    onClick={() => navigate('/checkout')}
                  >
                    {selectedItems.size === 0 ? 'Chọn sản phẩm để thanh toán' : 'Tiến hành thanh toán'}
                    <ArrowRight size={20} />
                  </button>
                </div>

                <div className="summary-footer">
                  <div className="trust-item">
                    <Lock size={14} />
                    <span>Bảo mật thanh toán 256-bit SSL</span>
                  </div>
                  <div className="payment-methods">
                    <img src="https://img.icons8.com/color/48/visa.png" alt="Visa" />
                    <img src="https://img.icons8.com/color/48/mastercard.png" alt="Mastercard" />
                    <img src="https://img.icons8.com/color/48/paypal.png" alt="Paypal" />
                  </div>
                </div>
              </div>

              <div className="help-box glass-panel">
                <h3>Cần hỗ trợ?</h3>
                <p>Liên hệ với chuyên gia PC của chúng tôi để được tư vấn tốt nhất.</p>
                <button className="btn-contact">Chat với chúng tôi</button>
              </div>
            </aside>
          </div>
        )}

        {/* Bottom Recommendations */}
        {!isEmpty && recommendedProducts.length > 0 && (
          <section className="cart-recommendations-bottom">
            <div className="section-header">
              <div className="title-group">
                <Sparkles size={24} className="accent-icon" />
                <h2>Có thể bạn quan tâm</h2>
              </div>
              <Link to="/products" className="view-all">Xem tất cả <ArrowRight size={16} /></Link>
            </div>
            <div className="recommendations-scroll">
              {recommendedProducts.map(product => (
                <div key={product.id} className="product-mini-card glass-panel" onClick={() => navigate(`/products/${product.id}`)}>
                  <div className="p-img">
                    <img src={getImageUrl(product.image_url)} alt={product.name} />
                  </div>
                  <div className="p-info">
                    <h4>{product.name}</h4>
                    <div className="p-bottom">
                      <span className="p-price">{product.base_price.toLocaleString()} ₫</span>
                      <button className="btn-add-mini"><Plus size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CartPage;
