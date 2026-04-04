import React, { useState, useEffect, useMemo } from 'react';
import { cartApi, getImageUrl } from '../../../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Info, AlertTriangle, ShoppingCart, Lock, CreditCard, Package, Undo2, MessageSquare } from 'lucide-react';
import './CartPage.css';

/* ── Custom Modal ── */
const CustomModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Xác nhận", cancelText = "Hủy", type = "default" }) => {
  if (!isOpen) return null;
  return (
    <div className="custom-modal-overlay">
      <div className={`custom-modal-content animate-pop-in ${type}`}>
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-modal-cancel" onClick={onCancel}>{cancelText}</button>
          <button className={`btn-modal-confirm ${type}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

/* ── Custom Toast ── */
const CustomToast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = { success: <CheckCircle size={18} />, error: <XCircle size={18} />, info: <Info size={18} /> };

  return (
    <div className={`custom-toast animate-slide-in ${type}`}>
      <div className="toast-icon">{icons[type] || <MessageSquare size={18} />}</div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
};

/* ── Progress Steps Component ── */
const ProgressSteps = () => (
  <div className="cart-progress-steps">
    <div className="step-item active">
      <div className="step-circle">1</div>
      <span className="step-label">Giỏ hàng</span>
    </div>
    <div className="step-line" />
    <div className="step-item">
      <div className="step-circle">2</div>
      <span className="step-label">Thanh toán</span>
    </div>
    <div className="step-line" />
    <div className="step-item">
      <div className="step-circle">3</div>
      <span className="step-label">Hoàn tất</span>
    </div>
  </div>
);

/* ── Main Component ── */
const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [tempItems, setTempItems] = useState([]);
  const [deletedIds, setDeletedIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'default' });
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();

  const hasChanges = useMemo(() => {
    if (!cart || !cart.items) return false;
    if (deletedIds.size > 0) return true;
    return tempItems.some(item => {
      const original = cart.items.find(o => o.id === item.id);
      return original && original.quantity !== item.quantity;
    });
  }, [cart, tempItems, deletedIds]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const safeNavigate = (to) => {
    if (hasChanges) {
      setModal({
        isOpen: true,
        title: "Lưu thay đổi?",
        message: "Bạn có thay đổi chưa được lưu. Bạn muốn lưu trước khi rời đi không?",
        confirmText: "Lưu và thoát",
        cancelText: "Rời đi không lưu",
        onConfirm: async () => { await handleSyncCart(); navigate(to); },
        onCancel: () => { setModal(m => ({ ...m, isOpen: false })); navigate(to); },
        type: "primary"
      });
    } else {
      navigate(to);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const fetchCart = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const response = await cartApi.getCart();
      if (response.ok) {
        const data = await response.json();
        setCart(data);
        setTempItems(data.items || []);
        setDeletedIds(new Set());
        if (data.items?.length > 0) {
          setSelectedItems(new Set(data.items.map(item => item.id)));
        }
        window.dispatchEvent(new Event('cartUpdated'));
      } else if (response.status === 401) {
        navigate('/');
      } else {
        if (!isSilent) setError("Không thể tải dữ liệu giỏ hàng. Vui lòng thử lại.");
      }
    } catch {
      if (!isSilent) setError("Có lỗi kết nối máy chủ.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleUpdateQtyLocal = (itemId, newQty) => {
    if (newQty < 1) { handleDeleteItemLocal(itemId); return; }
    setTempItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, quantity: newQty, subtotal: item.price * newQty } : item
    ));
  };

  const handleDeleteItemLocal = (itemId) => {
    setModal({
      isOpen: true,
      title: "Xóa sản phẩm?",
      message: "Sản phẩm sẽ được xóa khỏi giỏ hàng sau khi đồng bộ.",
      onConfirm: () => {
        setDeletedIds(prev => new Set(prev).add(itemId));
        setModal(m => ({ ...m, isOpen: false }));
        showToast("Đã đánh dấu xóa sản phẩm", "info");
      },
      onCancel: () => setModal(m => ({ ...m, isOpen: false })),
      type: "danger"
    });
  };

  const handleUndoDelete = (itemId) => {
    setDeletedIds(prev => { const n = new Set(prev); n.delete(itemId); return n; });
  };

  const showToast = (message, type = "success") => setToast({ message, type });

  const handleSyncCart = async () => {
    setIsSyncing(true);
    try {
      const deletePromises = Array.from(deletedIds).map(id => cartApi.deleteItem(id));
      const changedItems = tempItems.filter(item => {
        if (deletedIds.has(item.id)) return false;
        const original = cart.items.find(o => o.id === item.id);
        return original && original.quantity !== item.quantity;
      });
      const updatePromises = changedItems.map(item => cartApi.updateItem(item.id, item.quantity));
      const results = await Promise.all([...deletePromises, ...updatePromises]);
      if (results.every(r => r.ok)) {
        await fetchCart(true);
        window.dispatchEvent(new Event('cartUpdated'));
        showToast("Giỏ hàng đã được cập nhật!", "success");
      } else {
        showToast("Có lỗi khi cập nhật một số sản phẩm.", "error");
        await fetchCart(false);
      }
    } catch {
      showToast("Lỗi kết nối máy chủ", "error");
    } finally {
      setIsSyncing(false);
      setModal(m => ({ ...m, isOpen: false }));
    }
  };

  const selectedTotal = useMemo(() =>
    tempItems
      .filter(item => selectedItems.has(item.id) && !deletedIds.has(item.id))
      .reduce((acc, item) => acc + (item.subtotal || 0), 0),
    [tempItems, selectedItems, deletedIds]
  );

  const toggleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const n = new Set(prev);
      n.has(itemId) ? n.delete(itemId) : n.add(itemId);
      return n;
    });
  };

  const visibleItems = tempItems.filter(item => !deletedIds.has(item.id));
  const allSelected = visibleItems.length > 0 && visibleItems.every(item => selectedItems.has(item.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(visibleItems.map(item => item.id)));
    }
  };

  /* ── Loading State ── */
  if (loading) return (
    <div className="loading-container">
      <div className="spinner" />
      <p>Đang tải giỏ hàng...</p>
    </div>
  );

  /* ── Error State ── */
  if (error) return (
    <div className="cart-page animate-fade-in">
      <div className="cart-layout">
        <div className="empty-cart-modern">
          <div className="empty-visual-wrapper">
            <span className="empty-cart-icon"><AlertTriangle size={48} strokeWidth={1} /></span>
          </div>
          <h2>Ôi, có lỗi xảy ra!</h2>
          <p>{error}</p>
          <button className="btn-shop-now" onClick={fetchCart}>Thử lại</button>
        </div>
      </div>
    </div>
  );

  const isEmpty = visibleItems.length === 0 && deletedIds.size === 0;

  return (
    <div className="cart-page animate-fade-in">
      <CustomModal {...modal} onCancel={modal.onCancel || (() => setModal(m => ({ ...m, isOpen: false })))} />
      {toast && <CustomToast {...toast} onClose={() => setToast(null)} />}

      <div className="cart-layout">
        <ProgressSteps />

        {/* Header */}
        <header className="cart-header">
          <div className="cart-header-left">
            <h1 className="cart-title">
              <span className="accent">Giỏ</span> hàng
            </h1>
            {!isEmpty && (
              <div className="cart-count">
                <span className="cart-count-badge">{visibleItems.length}</span>
                sản phẩm trong giỏ
              </div>
            )}
          </div>
          <button onClick={() => safeNavigate('/products')} className="continue-shopping">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5m7 7-7-7 7-7"/>
            </svg>
            Tiếp tục mua sắm
          </button>
        </header>

        {/* Empty State */}
        {isEmpty ? (
          <div className="empty-cart-modern">
            <div className="empty-visual-wrapper">
              <span className="empty-cart-icon"><ShoppingCart size={48} strokeWidth={1} /></span>
              <div className="empty-cart-ring" />
            </div>
            <h2>Giỏ hàng của bạn trống</h2>
            <p>Khám phá hàng ngàn linh kiện PC và phụ kiện Gaming cao cấp đang chờ bạn.</p>
            <button onClick={() => safeNavigate('/products')} className="btn-shop-now">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              Khám phá ngay
            </button>
          </div>
        ) : (
          <div className="cart-grid-container">
            {/* Items Column */}
            <div className="cart-items-column">
              {hasChanges && (
                <div className="sync-needed-banner">
                  <span className="sync-text">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 2v6h-6M3 22v-6h6M21 12c0 4.97-4.03 9-9 9-2.39 0-4.56-.93-6.18-2.46M3 12c0-4.97 4.03-9 9-9 2.39 0 4.56.93 6.18 2.46"/>
                    </svg>
                    Có thay đổi chưa được lưu
                  </span>
                  <button className="btn-sync-now" onClick={handleSyncCart} disabled={isSyncing}>
                    {isSyncing ? "Đang xử lý..." : "Lưu ngay"}
                  </button>
                </div>
              )}

              {/* Select All */}
              <div className="select-all-bar">
                <div
                  className={`custom-checkbox ${allSelected ? 'checked' : ''}`}
                  onClick={toggleSelectAll}
                />
                <span>{allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'} ({visibleItems.length})</span>
              </div>

              {/* Item Cards */}
              <div className="cart-items-wrapper">
                {tempItems.map(item => {
                  const isDeleted = deletedIds.has(item.id);
                  const isSelected = selectedItems.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`cart-item-premium ${isSelected ? 'selected' : ''} ${isDeleted ? 'marked-deleted' : ''}`}
                    >
                      {/* Checkbox */}
                      <div className="item-selector">
                        {!isDeleted && (
                          <div
                            className={`custom-checkbox ${isSelected ? 'checked' : ''}`}
                            onClick={() => toggleSelectItem(item.id)}
                          />
                        )}
                      </div>

                      {/* Image */}
                      <div className="item-visual">
                        {item.variant.product?.image_url ? (
                          <img src={getImageUrl(item.variant.product.image_url)} alt="product" />
                        ) : (
                          <div className="image-placeholder">PC</div>
                        )}
                      </div>

                      {/* Body */}
                      <div className="item-body">
                        <div className="item-top-row">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <button
                              onClick={() => safeNavigate(`/products/${item.variant.product_id}`)}
                              className="item-name-premium"
                            >
                              {item.variant.product?.name || `Sản phẩm #${item.variant.product_id}`}
                            </button>
                            <div className="item-variant-tag">
                              {Object.values(item.variant.attributes).join(' · ')}
                            </div>
                          </div>
                          <div className="item-price-col">
                            <span className="unit-price">{(item.price || 0).toLocaleString()} ₫/sp</span>
                            <span className="subtotal-price">{(item.subtotal || 0).toLocaleString()} ₫</span>
                          </div>
                        </div>

                        <div className="item-bottom-row">
                          {isDeleted ? (
                            <>
                              <span className="deleted-label">Đã đánh dấu xóa</span>
                              <button className="btn-undo" onClick={() => handleUndoDelete(item.id)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 10h10a8 8 0 0 1 8 8v2M3 10l6-6m-6 6 6 6"/>
                                </svg>
                                Hoàn tác
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="premium-stepper">
                                <button className="stepper-btn" onClick={() => handleUpdateQtyLocal(item.id, item.quantity - 1)}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14"/></svg>
                                </button>
                                <span className="stepper-value">{item.quantity}</span>
                                <button className="stepper-btn" onClick={() => handleUpdateQtyLocal(item.id, item.quantity + 1)}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                                </button>
                              </div>
                              <button className="btn-remove-premium" onClick={() => handleDeleteItemLocal(item.id)}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                                Xóa
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Panel */}
            <aside className="cart-summary-panel">
              <div className="summary-gradient-top" />
              <div className="summary-inner">
                <h2 className="summary-title">Tóm tắt đơn hàng</h2>
                <div className="summary-content">
                  <div className="summary-row">
                    <span>Số sản phẩm đã chọn</span>
                    <span>{selectedItems.size}</span>
                  </div>
                  <div className="summary-row">
                    <span>Tạm tính</span>
                    <span>{selectedTotal.toLocaleString()} ₫</span>
                  </div>
                  <div className="summary-row shipping">
                    <span>Phí vận chuyển</span>
                    <span className="free-badge">Miễn phí</span>
                  </div>
                  <div className="summary-row total">
                    <span>Tổng cộng</span>
                    <span className="price">{selectedTotal.toLocaleString()} ₫</span>
                  </div>
                </div>

                <button
                  className={`btn-checkout-premium ${selectedItems.size === 0 ? 'disabled' : ''}`}
                  disabled={selectedItems.size === 0}
                  onClick={() => safeNavigate('/checkout')}
                >
                  <div className="checkout-btn-content">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    Tiến hành đặt hàng
                  </div>
                </button>

                <div className="payment-trust-row">
                  <div className="trust-badge">
                    <span className="trust-icon"><Lock size={16} /></span>
                    <span className="trust-label">Bảo mật SSL</span>
                  </div>
                  <div className="trust-badge">
                    <span className="trust-icon"><CreditCard size={16} /></span>
                    <span className="trust-label">Thẻ quốc tế</span>
                  </div>
                  <div className="trust-badge">
                    <span className="trust-icon"><Package size={16} /></span>
                    <span className="trust-label">Giao hàng nhanh</span>
                  </div>
                  <div className="trust-badge">
                    <span className="trust-icon"><Undo2 size={16} /></span>
                    <span className="trust-label">Đổi trả 30 ngày</span>
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
