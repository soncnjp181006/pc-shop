import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Trash2, 
  ShoppingCart, 
  Heart, 
  Search, 
  Filter, 
  ArrowRight, 
  ChevronLeft,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  Package,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { favoritesApi } from '../../../utils/favoritesApi';
import { cartApi, getImageUrl } from '../../../utils/api';
import { formatVnd } from '../../../utils/format';
import './FavoritesPage.css';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name, isBulk }
  const [isActionLoading, setIsActionLoading] = useState(false);

  const token = localStorage.getItem('access_token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    loadFavorites();
    window.scrollTo(0, 0);
  }, [token, navigate]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await favoritesApi.getFavorites(token);
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      } else {
        setError('Không thể tải danh sách yêu thích. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError('Đã xảy ra lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = (favoriteId, productName) => {
    setDeleteConfirm({ id: favoriteId, name: productName, isBulk: false });
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
    setIsActionLoading(true);
    try {
      if (deleteConfirm.isBulk) {
        const idsToDelete = Array.from(selectedItems);
        // Assuming backend doesn't have bulk delete for favorites yet, we do it sequentially
        // or just map through them. For a better UX, we'd want a bulk endpoint.
        await Promise.all(idsToDelete.map(id => favoritesApi.removeFavorite(id, token)));
        
        setFavorites(prev => prev.filter(f => !selectedItems.has(f.id)));
        setSelectedItems(new Set());
        showToast(`Đã xóa ${idsToDelete.length} sản phẩm khỏi danh sách`);
      } else {
        const response = await favoritesApi.removeFavorite(deleteConfirm.id, token);
        if (response.ok) {
          setFavorites(prev => prev.filter(f => f.id !== deleteConfirm.id));
          setSelectedItems(prev => {
            const n = new Set(prev);
            n.delete(deleteConfirm.id);
            return n;
          });
          showToast(`Đã xóa "${deleteConfirm.name}"`);
        } else {
          showToast('Lỗi khi xóa sản phẩm', 'error');
        }
      }
    } catch (error) {
      showToast('Lỗi kết nối', 'error');
    } finally {
      setIsActionLoading(false);
      setDeleteConfirm(null);
    }
  };

  const handleAddToCart = async (productId, productName) => {
    setIsActionLoading(true);
    try {
      const response = await cartApi.addItem(null, 1, productId);
      if (response.ok) {
        showToast(`Đã thêm "${productName}" vào giỏ hàng`);
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        showToast('Không thể thêm vào giỏ hàng', 'error');
      }
    } catch (error) {
      showToast('Lỗi kết nối', 'error');
    } finally {
      setIsActionLoading(false);
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
    if (selectedItems.size === filteredFavorites.length && filteredFavorites.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredFavorites.map(f => f.id)));
    }
  };

  const filteredFavorites = useMemo(() => {
    return favorites.filter(f => 
      f.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.product.brand && f.product.brand.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [favorites, searchTerm]);

  if (loading) {
    return (
      <div className="favorites-loader-container">
        <div className="favorites-skeleton-header" />
        <div className="favorites-skeleton-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton-card glass-panel" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-modern-container">
      {toast && createPortal(
        <div className={`favorites-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && createPortal(
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="warning-icon-box">
                <AlertCircle size={32} />
              </div>
              <h2>Xác nhận xóa</h2>
            </div>
            <p>Bạn có chắc chắn muốn xóa <strong>{deleteConfirm.name}</strong> khỏi danh sách yêu thích?</p>
            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => setDeleteConfirm(null)}>Hủy</button>
              <button className="btn-modal-confirm" onClick={confirmDelete} disabled={isActionLoading}>
                {isActionLoading ? <Loader2 className="animate-spin" size={18} /> : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="container">
        {/* Header Section */}
        <header className="favorites-header-v2">
          <div className="header-title-box">
            <h1 className="title-modular">Sản phẩm yêu thích</h1>
            <p className="subtitle-modular">Lưu trữ những linh kiện bạn đang quan tâm</p>
          </div>
          <Link to="/products" className="btn-back-to-store">
            <ChevronLeft size={18} /> Tiếp tục mua sắm
          </Link>
        </header>

        {favorites.length === 0 ? (
          <div className="favorites-empty-state glass-panel animate-fade-in">
            <div className="empty-visual">
              <div className="empty-heart-ring">
                <Heart size={80} strokeWidth={1} />
              </div>
              <div className="empty-sparkle s1"><Sparkles size={20} /></div>
              <div className="empty-sparkle s2"><Sparkles size={16} /></div>
            </div>
            <h2>Chưa có sản phẩm nào</h2>
            <p>Hãy thả tim cho những sản phẩm bạn yêu thích để xem lại chúng tại đây nhé.</p>
            <button className="btn-primary-glow" onClick={() => navigate('/products')}>
              Khám phá sản phẩm
            </button>
          </div>
        ) : (
          <div className="favorites-content-layout">
            {/* Toolbar */}
            <div className="favorites-toolbar glass-panel">
              <div className="toolbar-left">
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Tìm trong yêu thích..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button className="clear-search" onClick={() => setSearchTerm('')}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="toolbar-right">
                <div className="selection-info" onClick={selectAll}>
                  <div className={`custom-checkbox ${selectedItems.size === filteredFavorites.length && filteredFavorites.length > 0 ? 'checked' : ''}`} />
                  <span>Chọn tất cả ({filteredFavorites.length})</span>
                </div>
                {selectedItems.size > 0 && (
                  <button className="btn-bulk-delete" onClick={handleClearSelected}>
                    <Trash2 size={16} /> Xóa đã chọn ({selectedItems.size})
                  </button>
                )}
              </div>
            </div>

            {filteredFavorites.length === 0 ? (
              <div className="no-results-found glass-panel">
                <Search size={48} strokeWidth={1} />
                <p>Không tìm thấy sản phẩm phù hợp với "{searchTerm}"</p>
                <button className="btn-text" onClick={() => setSearchTerm('')}>Xóa bộ lọc</button>
              </div>
            ) : (
              <div className="favorites-grid-v2">
                {filteredFavorites.map((favorite) => (
                  <div 
                    key={favorite.id} 
                    className={`favorite-card-v2 glass-panel ${selectedItems.has(favorite.id) ? 'selected' : ''}`}
                  >
                    <div className="card-selection" onClick={() => toggleSelect(favorite.id)}>
                      <div className={`custom-checkbox ${selectedItems.has(favorite.id) ? 'checked' : ''}`} />
                    </div>

                    <div className="card-image-box" onClick={() => navigate(`/products/${favorite.product.id}`)}>
                      <img src={getImageUrl(favorite.product.image_url)} alt={favorite.product.name} />
                      <div className={`stock-status-tag ${favorite.product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                        {favorite.product.stock_quantity > 0 ? 'Còn hàng' : 'Hết hàng'}
                      </div>
                    </div>

                    <div className="card-info-box">
                      <div className="card-header">
                        <span className="brand-label">{favorite.product.brand || 'PC SHOP'}</span>
                        <button className="btn-remove-fav" onClick={() => handleRemoveFavorite(favorite.id, favorite.product.name)}>
                          <X size={18} />
                        </button>
                      </div>

                      <h3 className="product-name" onClick={() => navigate(`/products/${favorite.product.id}`)}>
                        {favorite.product.name}
                      </h3>

                      <div className="product-meta">
                        <div className="meta-item">
                          <Package size={14} />
                          <span>Mới 100%</span>
                        </div>
                      </div>

                      <div className="card-footer">
                        <div className="price-box">
                          <span className="current-price">{formatVnd(favorite.product.base_price)}</span>
                        </div>
                        <button 
                          className="btn-quick-add"
                          onClick={() => handleAddToCart(favorite.product.id, favorite.product.name)}
                          disabled={favorite.product.stock_quantity === 0 || isActionLoading}
                        >
                          <ShoppingCart size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
