import React, { useState, useEffect, useMemo } from 'react';
import { cartApi, getImageUrl } from '../../../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import './CartPage.css';

// Thành phần Modal tùy chỉnh
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

// Thành phần Toast tùy chỉnh
const CustomToast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`custom-toast animate-slide-in ${type}`}>
      <div className="toast-icon">
        {type === 'success' ? '✅' : '⚠️'}
      </div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose}>&times;</button>
    </div>
  );
};

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [tempItems, setTempItems] = useState([]); // Lưu trạng thái chỉnh sửa tạm thời
  const [deletedIds, setDeletedIds] = useState(new Set()); // Lưu các ID đã xóa tạm thời
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'default' });
  const [toast, setToast] = useState(null);
  
  const navigate = useNavigate();

  // Kiểm tra thay đổi
  const hasChanges = useMemo(() => {
    if (!cart || !cart.items) return false;
    if (deletedIds.size > 0) return true;
    return tempItems.some(item => {
      const original = cart.items.find(o => o.id === item.id);
      return original && original.quantity !== item.quantity;
    });
  }, [cart, tempItems, deletedIds]);

  // Bảo vệ khi đóng tab hoặc làm mới trang
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Hàm điều hướng an toàn (thay thế cho Link/navigate trực tiếp)
  const safeNavigate = (to) => {
    if (hasChanges) {
      setModal({
        isOpen: true,
        title: "Lưu thay đổi?",
        message: "Bạn có các thay đổi chưa được lưu trong giỏ hàng. Bạn có muốn lưu chúng trước khi rời đi không?",
        confirmText: "Lưu và thoát",
        cancelText: "Rời đi không lưu",
        onConfirm: async () => {
          await handleSyncCart();
          navigate(to);
        },
        onCancel: () => {
          setModal({ ...modal, isOpen: false });
          navigate(to);
        },
        type: "primary"
      });
    } else {
      navigate(to);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

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
        
        if (data.items && data.items.length > 0) {
          const allIds = data.items.map(item => item.id);
          setSelectedItems(new Set(allIds));
        }
        window.dispatchEvent(new Event('cartUpdated'));
      } else if (response.status === 401) {
        navigate('/');
      } else {
        if (!isSilent) setError("Không thể tải dữ liệu giỏ hàng. Vui lòng thử lại sau.");
      }
    } catch (error) {
      console.error('Lỗi khi tải giỏ hàng:', error);
      if (!isSilent) setError("Có lỗi kết nối máy chủ.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleUpdateQtyLocal = (itemId, newQty) => {
    if (newQty < 1) {
      handleDeleteItemLocal(itemId);
      return;
    }
    setTempItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: newQty, subtotal: item.price * newQty } : item
    ));
  };

  const handleDeleteItemLocal = (itemId) => {
    setModal({
      isOpen: true,
      title: "Xác nhận xóa",
      message: "Bạn có muốn xóa sản phẩm này khỏi danh sách chờ cập nhật không?",
      onConfirm: () => {
        setDeletedIds(prev => new Set(prev).add(itemId));
        setModal({ ...modal, isOpen: false });
        showToast("Đã đánh dấu xóa sản phẩm", "info");
      },
      onCancel: () => setModal({ ...modal, isOpen: false }),
      type: "danger"
    });
  };

  const handleUndoDelete = (itemId) => {
    setDeletedIds(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleSyncCart = async () => {
    setIsSyncing(true);
    try {
      // 1. Xử lý xóa
      const deletePromises = Array.from(deletedIds).map(id => cartApi.deleteItem(id));
      
      // 2. Xử lý cập nhật số lượng
      const changedItems = tempItems.filter(item => {
        if (deletedIds.has(item.id)) return false;
        const original = cart.items.find(o => o.id === item.id);
        return original && original.quantity !== item.quantity;
      });
      const updatePromises = changedItems.map(item => cartApi.updateItem(item.id, item.quantity));

      const results = await Promise.all([...deletePromises, ...updatePromises]);
      const allOk = results.every(res => res.ok);

      if (allOk) {
        // Cập nhật ngầm không hiện loading spinner
        await fetchCart(true);
        window.dispatchEvent(new Event('cartUpdated'));
        showToast("Đã đồng bộ giỏ hàng thành công!");
      } else {
        showToast("Có lỗi khi đồng bộ một số sản phẩm.", "error");
        await fetchCart(false);
      }
    } catch (error) {
      console.error('Lỗi khi đồng bộ:', error);
      showToast("Lỗi kết nối máy chủ", "error");
    } finally {
      setIsSyncing(false);
      setModal({ ...modal, isOpen: false });
    }
  };

  const selectedTotal = useMemo(() => {
    return tempItems
      .filter(item => selectedItems.has(item.id) && !deletedIds.has(item.id))
      .reduce((acc, item) => acc + (item.subtotal || 0), 0);
  }, [tempItems, selectedItems, deletedIds]);

  const toggleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visibleItems = tempItems.filter(item => !deletedIds.has(item.id));
    if (selectedItems.size === visibleItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(visibleItems.map(item => item.id)));
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Đang tải giỏ hàng...</p>
    </div>
  );

  if (error) return (
    <div className="cart-page animate-fade-in">
      <div className="container cart-layout">
        <div className="empty-cart-premium">
          <div className="empty-icon-box">⚠️</div>
          <h2>Ôi, có lỗi xảy ra!</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchCart}>Thử lại</button>
        </div>
      </div>
    </div>
  );

  const visibleItems = tempItems.filter(item => !deletedIds.has(item.id));
  const isEmpty = visibleItems.length === 0 && deletedIds.size === 0;

  return (
    <div className="cart-page animate-fade-in">
      <CustomModal {...modal} onCancel={modal.onCancel || (() => setModal({ ...modal, isOpen: false }))} />
      {toast && <CustomToast {...toast} onClose={() => setToast(null)} />}
      
      <div className="container cart-layout">
        <header className="cart-header">
          <div className="header-text">
            <h1 className="cart-title">Giỏ hàng <span className="accent">TikTok Style</span></h1>
            {!isEmpty && <span className="cart-count">Tất cả {visibleItems.length} sản phẩm</span>}
          </div>
          <button onClick={() => safeNavigate('/products')} className="continue-shopping btn-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7 7l-7-7 7-7"/></svg>
            Tiếp tục mua sắm
          </button>
        </header>
        
        {isEmpty ? (
          <div className="empty-cart-premium">
            <div className="empty-icon-box">🛒</div>
            <h2>Giỏ hàng chưa có gì</h2>
            <p>Hàng ngàn sản phẩm công nghệ đỉnh cao đang chờ bạn khám phá.</p>
            <button onClick={() => safeNavigate('/products')} className="btn btn-primary btn-lg">Bắt đầu mua sắm</button>
          </div>
        ) : (
          <div className="cart-content-wrapper">
            <div className="cart-table-header">
              <div className="col-check">
                <input 
                  type="checkbox" 
                  checked={selectedItems.size === visibleItems.length && visibleItems.length > 0} 
                  onChange={toggleSelectAll}
                  id="select-all"
                />
                <label htmlFor="select-all">Tất cả ({visibleItems.length} sản phẩm)</label>
              </div>
              <div className="col-price mobile-hidden">Đơn giá</div>
              <div className="col-qty mobile-hidden">Số lượng</div>
              <div className="col-subtotal mobile-hidden">Số tiền</div>
              <div className="col-action mobile-hidden">Thao tác</div>
            </div>

            <div className="cart-items-list">
              {tempItems.map(item => {
                const isDeleted = deletedIds.has(item.id);
                return (
                  <div key={item.id} className={`cart-item-tiktok ${selectedItems.has(item.id) ? 'selected' : ''} ${isDeleted ? 'marked-deleted' : ''}`}>
                    <div className="col-check">
                      {!isDeleted && (
                        <input 
                          type="checkbox" 
                          checked={selectedItems.has(item.id)} 
                          onChange={() => toggleSelectItem(item.id)} 
                        />
                      )}
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
                        <button 
                          onClick={() => safeNavigate(`/products/${item.variant.product_id}`)} 
                          className="item-name btn-link text-left"
                        >
                          {item.variant.product?.name || `Sản phẩm #${item.variant.product_id}`}
                        </button>
                        <div className="item-variant-info">
                          Phân loại: {Object.values(item.variant.attributes).join(' • ')}
                        </div>
                        {isDeleted && <span className="deleted-label">Đã đánh dấu xóa</span>}
                        {!isDeleted && (
                          <div className="mobile-only price-qty-row">
                            <span className="mobile-price">{(item.price || 0).toLocaleString()} VNĐ</span>
                            <div className="qty-stepper mini">
                              <button className="step-btn" onClick={() => handleUpdateQtyLocal(item.id, item.quantity - 1)}>-</button>
                              <span className="qty-number">{item.quantity}</span>
                              <button className="step-btn" onClick={() => handleUpdateQtyLocal(item.id, item.quantity + 1)}>+</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-price mobile-hidden">
                      {(item.price || 0).toLocaleString()} VNĐ
                    </div>

                    <div className="col-qty mobile-hidden">
                      {!isDeleted && (
                        <div className="qty-stepper">
                          <button className="step-btn" onClick={() => handleUpdateQtyLocal(item.id, item.quantity - 1)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14"/></svg>
                          </button>
                          <span className="qty-number">{item.quantity}</span>
                          <button className="step-btn" onClick={() => handleUpdateQtyLocal(item.id, item.quantity + 1)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="col-subtotal mobile-hidden">
                      {(item.subtotal || 0).toLocaleString()} VNĐ
                    </div>

                    <div className="col-action">
                      {isDeleted ? (
                        <button className="btn-undo" onClick={() => handleUndoDelete(item.id)}>Hoàn tác</button>
                      ) : (
                        <button className="btn-delete" onClick={() => handleDeleteItemLocal(item.id)}>Xóa</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky Checkout Bar */}
            <div className="checkout-sticky-bar">
              <div className="container bar-content">
                <div className="bar-left mobile-hidden">
                  <input 
                    type="checkbox" 
                    checked={selectedItems.size === visibleItems.length && visibleItems.length > 0} 
                    onChange={toggleSelectAll}
                    id="select-all-bottom"
                  />
                  <label htmlFor="select-all-bottom">Chọn tất cả ({visibleItems.length})</label>
                  
                  <button 
                    className={`btn-sync-cart ${hasChanges ? 'highlight' : ''}`} 
                    onClick={handleSyncCart}
                    disabled={!hasChanges || isSyncing}
                  >
                    {isSyncing ? "Đang cập nhật..." : "Xác nhận thay đổi"}
                  </button>
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
