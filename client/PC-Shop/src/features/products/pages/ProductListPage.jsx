import React, { useState, useEffect, useCallback, useRef } from 'react';
import { productsApi, categoriesApi, getImageUrl } from '../../../utils/api';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { cartApi } from '../../../utils/api';
import './ProductListPage.css';

/* ─────────────────────── CONSTANTS ─────────────────────── */
const BRANDS = ['Apple', 'ASUS', 'MSI', 'Gigabyte', 'Dell', 'HP', 'Lenovo', 'Razer', 'Corsair', 'NZXT'];
const PRICE_PRESETS = [
  { label: '< 5tr', min: '', max: '5000000' },
  { label: '5–10tr', min: '5000000', max: '10000000' },
  { label: '10–20tr', min: '10000000', max: '20000000' },
  { label: '> 20tr', min: '20000000', max: '' },
];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
  { value: 'name_asc', label: 'Tên A → Z' },
];

/* ─────────────────────── HELPERS ─────────────────────── */
const findCategoryPath = (nodes, targetId, path = []) => {
  for (const node of nodes) {
    const nextPath = [...path, node.id];
    if (String(node.id) === String(targetId)) return nextPath;
    if (node.children?.length > 0) {
      const res = findCategoryPath(node.children, targetId, nextPath);
      if (res) return res;
    }
  }
  return null;
};

const buildParams = (filters, page, limit) => {
  const p = { page, limit };
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== '' && v !== false && v !== null && v !== undefined) p[k] = v;
  });
  return p;
};

/* ─────────────────────── FILTER SECTION (collapsible) ─────────────────────── */
const FilterSection = ({ icon, title, hasActiveFilter, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sidebar-section">
      <div className="filter-section-toggle" onClick={() => setOpen(o => !o)}>
        <div className="toggle-left">
          <span className="filter-toggle-icon">{icon}</span>
          {title}
        </div>
        <div className="toggle-right">
          {hasActiveFilter && <span className="active-filter-dot" />}
          <span className={`toggle-chevron ${open ? 'open' : ''}`}>▼</span>
        </div>
      </div>
      <div className={`filter-section-body ${open ? 'open' : ''}`}>
        <div className="filter-section-inner">{children}</div>
      </div>
    </div>
  );
};

/* ─────────────────────── CATEGORY TREE ─────────────────────── */
const CategoryNode = ({ node, depth, filters, onSelect, expandedIds, onToggle }) => {
  const hasChildren = node.children?.length > 0;
  const expanded = expandedIds.includes(node.id);
  const active = String(filters.category_id) === String(node.id);

  return (
    <div className="category-node">
      <div className="category-row" style={{ paddingLeft: `${depth * 12}px` }}>
        {hasChildren ? (
          <button type="button" className="cat-toggle" onClick={e => { e.stopPropagation(); onToggle(node.id); }}>
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="cat-leaf">◦</span>
        )}
        <button
          type="button"
          className={`category-item category-select ${active ? 'active' : ''}`}
          onClick={() => { onSelect(node.id); if (hasChildren && !expanded) onToggle(node.id); }}
        >
          {node.name}
        </button>
      </div>
      {hasChildren && expanded && (
        <div className="category-children">
          {node.children.map(child => (
            <CategoryNode key={child.id} node={child} depth={depth + 1}
              filters={filters} onSelect={onSelect} expandedIds={expandedIds} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────── PRODUCT CARD ─────────────────────── */
const ProductCard = ({ product, viewMode, onQuickAdd, favs, onToggleFav }) => {
  const isFaved = favs.has(product.id);
  const inStock = product.available_stock > 0;

  return (
    <Link to={`/products/${product.id}`} className="product-card-glossy">
      <div className="card-image-container">
        {product.image_url
          ? <img src={getImageUrl(product.image_url)} alt={product.name} className="product-img" loading="lazy" />
          : <div className="product-img image-placeholder">PC</div>}
        <div className="card-overlay">
          <span className="view-detail">Xem chi tiết →</span>
        </div>
        <button
          className={`card-fav-btn ${isFaved ? 'faved' : ''}`}
          onClick={e => { e.preventDefault(); onToggleFav(product.id); }}
          title={isFaved ? 'Bỏ yêu thích' : 'Yêu thích'}
        >
          {isFaved ? '♥' : '♡'}
        </button>
      </div>

      <div className="card-body">
        <div className="card-top-row">
          <span className="badge">Chính hãng</span>
          <span className={`card-stock-badge ${inStock ? 'in' : 'out'}`}>
            {inStock ? `Còn ${product.available_stock}` : 'Hết hàng'}
          </span>
        </div>
        <h4 className="card-name">{product.name}</h4>
        <div className="card-rating">
          <span className="card-stars">★★★★★</span>
          <span className="card-rating-count">(128)</span>
        </div>
        <div className="card-footer">
          <p className="card-price-modern">{product.base_price.toLocaleString()} ₫</p>
          <button
            className="card-quick-add"
            title="Thêm vào giỏ"
            onClick={e => { e.preventDefault(); onQuickAdd(product); }}
          >
            +
          </button>
        </div>
      </div>
    </Link>
  );
};

/* ─────────────────────── TOAST ─────────────────────── */
const ToastBanner = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 2800); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      padding: '12px 20px', borderRadius: 12,
      background: type === 'success' ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.12)',
      border: `1px solid ${type === 'success' ? 'rgba(52,199,89,0.35)' : 'rgba(255,59,48,0.35)'}`,
      color: type === 'success' ? '#34c759' : '#ff3b30',
      fontWeight: 700, fontSize: '0.88rem',
      display: 'flex', alignItems: 'center', gap: 10,
      backdropFilter: 'blur(20px)',
      boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
      animation: 'tagAppear 0.3s ease',
      maxWidth: 340,
    }}>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', opacity: 0.6, cursor: 'pointer', fontSize: '1.1rem', padding: 0 }}>×</button>
    </div>
  );
};

/* ─────────────────────── MAIN PAGE ─────────────────────── */
const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [favs, setFavs] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, pages: 1, total: 0 });

  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    category_id: searchParams.get('category_id') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    sort: searchParams.get('sort') || 'newest',
    brand: searchParams.get('brand') || '',
    in_stock: searchParams.get('in_stock') === 'true',
    condition: searchParams.get('condition') || '',
  });

  // Search debounce ref
  const searchRef = useRef(null);

  /* ── WebSocket for realtime stock ── */
  useEffect(() => {
    fetchCategories();

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host.replace('5173', '8000').replace('5174', '8000')}/ws/stock`;
    let socket;

    const connectWS = () => {
      try {
        socket = new WebSocket(wsUrl);
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'stock_updated' && data.product_id) {
              setProducts(prev => prev.map(p =>
                String(p.id) === String(data.product_id)
                  ? { ...p, available_stock: data.available_stock }
                  : p
              ));
            }
          } catch { /* ignore parse errors */ }
        };
        socket.onerror = () => { /* silently fail */ };
        socket.onclose = () => setTimeout(connectWS, 5000);
      } catch { /* WS not available, skip */ }
    };

    connectWS();
    return () => { if (socket) socket.close(); };
  }, []);

  /* ── Fetch on filter/page change ── */
  useEffect(() => {
    const params = buildParams(filters, pagination.page, pagination.limit);
    // Sync URL
    const urlParams = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v !== false && v !== null) urlParams[k] = v;
    });
    setSearchParams(urlParams);
    // Fetch
    fetchProducts(params);
  }, [filters, pagination.page]);

  /* ── Auto-expand category path ── */
  useEffect(() => {
    if (!filters.category_id || categories.length === 0) return;
    const path = findCategoryPath(categories, filters.category_id);
    if (path?.length > 1) setExpandedCategoryIds(path.slice(0, -1));
  }, [categories, filters.category_id]);

  const fetchCategories = async () => {
    try {
      const res = await categoriesApi.getTree();
      if (res.ok) setCategories(await res.json());
    } catch { /* ignore */ }
  };

  const fetchProducts = async (params) => {
    setLoading(true);
    try {
      const res = await productsApi.getAll(params);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data || []);
        setPagination(prev => ({ ...prev, pages: data.pages ?? 1, total: data.total ?? 0 }));
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  /* ── Filter helpers ── */
  const setFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => setFilter('q', val), 380);
  };

  const clearFilters = () => {
    setFilters({ q: '', category_id: '', min_price: '', max_price: '', sort: 'newest', brand: '', in_stock: false, condition: '' });
    setExpandedCategoryIds([]);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const toggleFav = (id) => setFavs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  /* ── Quick Add to Cart ── */
  const handleQuickAdd = async (product) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setToast({ msg: 'Vui lòng đăng nhập để thêm vào giỏ hàng.', type: 'error' });
      return;
    }
    if (product.available_stock <= 0) {
      setToast({ msg: 'Sản phẩm này đã hết hàng.', type: 'error' });
      return;
    }
    try {
      const res = await cartApi.addItem(null, 1, product.id);
      if (res.ok) {
        setToast({ msg: `Đã thêm "${product.name.slice(0,30)}..." vào giỏ!`, type: 'success' });
        window.dispatchEvent(new Event('cartUpdated'));
      } else if (res.status === 401) {
        setToast({ msg: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', type: 'error' });
      } else {
        const err = await res.json().catch(() => ({}));
        setToast({ msg: err.detail || 'Không thể thêm vào giỏ hàng.', type: 'error' });
      }
    } catch {
      setToast({ msg: 'Lỗi kết nối máy chủ.', type: 'error' });
    }
  };

  /* ── Pagination ── */
  const getPaginationItems = () => {
    const total = pagination.pages || 1;
    const cur = pagination.page;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const items = new Set([1, total, cur, cur - 1, cur + 1].filter(p => p >= 1 && p <= total));
    const sorted = [...items].sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('…');
      out.push(sorted[i]);
    }
    return out;
  };

  /* ── Active tags (for display) ── */
  const activeTags = [];
  if (filters.q) activeTags.push({ key: 'q', label: `Tìm: "${filters.q}"` });
  if (filters.category_id) {
    const findCat = (nodes, id) => { for (const n of nodes) { if (String(n.id) === String(id)) return n; if (n.children?.length) { const r = findCat(n.children, id); if (r) return r; } } return null; };
    const cat = findCat(categories, filters.category_id);
    if (cat) activeTags.push({ key: 'category_id', label: cat.name });
  }
  if (filters.brand) activeTags.push({ key: 'brand', label: filters.brand });
  if (filters.min_price || filters.max_price) activeTags.push({ key: 'price', label: `${Number(filters.min_price || 0).toLocaleString()}–${filters.max_price ? Number(filters.max_price).toLocaleString() : '∞'} ₫` });
  if (filters.in_stock) activeTags.push({ key: 'in_stock', label: 'Còn hàng' });
  if (filters.condition) activeTags.push({ key: 'condition', label: filters.condition === 'new' ? 'Hàng mới' : 'Hàng cũ' });

  const removeTag = (key) => {
    const reset = { q: '', category_id: '', brand: '', price: '', in_stock: false, condition: '' };
    if (key === 'price') setFilters(p => ({ ...p, min_price: '', max_price: '' }));
    else setFilter(key, reset[key] ?? '');
  };

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <div className="product-list-page">
      {toast && <ToastBanner msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ════════ SIDEBAR ════════ */}
      <aside className="sidebar-fixed">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-title">Bộ lọc sản phẩm</div>
        </div>

        {/* Categories */}
        <div className="sidebar-group">
          <div className="group-label"><span className="label-icon">📁</span> Danh mục</div>
          <div className="category-tree">
            <button
              type="button"
              className={`category-item category-select ${filters.category_id === '' ? 'active' : ''}`}
              onClick={() => { setExpandedCategoryIds([]); setFilter('category_id', ''); }}
            >
              Tất cả sản phẩm
            </button>
            {categories.map(cat => (
              <CategoryNode
                key={cat.id}
                node={cat}
                depth={0}
                filters={filters}
                onSelect={id => setFilter('category_id', id)}
                expandedIds={expandedCategoryIds}
                onToggle={id => setExpandedCategoryIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])}
              />
            ))}
          </div>
        </div>

        {/* Filter group */}
        <div className="sidebar-group filter-group">
          <div className="group-label"><span className="label-icon">⚙️</span> Lọc chi tiết</div>

          {/* Brand */}
          <FilterSection icon="🏷️" title="Thương hiệu" hasActiveFilter={!!filters.brand} defaultOpen>
            <div className="brand-grid">
              <button
                className={`brand-chip ${filters.brand === '' ? 'active' : ''}`}
                onClick={() => setFilter('brand', '')}
              >Tất cả</button>
              {BRANDS.map(b => (
                <button
                  key={b}
                  className={`brand-chip ${filters.brand === b ? 'active' : ''}`}
                  onClick={() => setFilter('brand', filters.brand === b ? '' : b)}
                >{b}</button>
              ))}
            </div>
          </FilterSection>

          {/* Price range */}
          <FilterSection icon="💰" title="Khoảng giá" hasActiveFilter={!!(filters.min_price || filters.max_price)}>
            <div className="price-range-inputs">
              <input
                type="number"
                placeholder="Từ"
                value={filters.min_price}
                onChange={e => setFilter('min_price', e.target.value)}
                min="0"
              />
              <span className="price-sep" />
              <input
                type="number"
                placeholder="Đến"
                value={filters.max_price}
                onChange={e => setFilter('max_price', e.target.value)}
                min="0"
              />
            </div>
            <div className="price-presets">
              {PRICE_PRESETS.map(p => {
                const isActive = filters.min_price === p.min && filters.max_price === p.max;
                return (
                  <button
                    key={p.label}
                    className={`price-preset-btn ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (isActive) { setFilters(prev => ({ ...prev, min_price: '', max_price: '' })); setPagination(p => ({ ...p, page: 1 })); }
                      else { setFilters(prev => ({ ...prev, min_price: p.min, max_price: p.max })); setPagination(prev => ({ ...prev, page: 1 })); }
                    }}
                  >{p.label}</button>
                );
              })}
            </div>
          </FilterSection>

          {/* Condition */}
          <FilterSection icon="📦" title="Tình trạng" hasActiveFilter={!!filters.condition}>
            <div className="cond-options">
              <button className={`cond-btn ${filters.condition === '' ? 'active' : ''}`} onClick={() => setFilter('condition', '')}>Tất cả</button>
              <button className={`cond-btn ${filters.condition === 'new' ? 'active' : ''}`} onClick={() => setFilter('condition', filters.condition === 'new' ? '' : 'new')}>Hàng mới</button>
              <button className={`cond-btn ${filters.condition === 'used' ? 'active' : ''}`} onClick={() => setFilter('condition', filters.condition === 'used' ? '' : 'used')}>Hàng cũ</button>
            </div>
          </FilterSection>

          {/* In Stock toggle */}
          <div className="sidebar-section" style={{ marginTop: 4 }}>
            <div className="toggle-switch-row" onClick={() => setFilter('in_stock', !filters.in_stock)}>
              <span className="toggle-switch-label">
                <span className="ts-icon">✅</span>
                Chỉ hiện còn hàng
              </span>
              <div className={`toggle-pill ${filters.in_stock ? 'on' : ''}`} />
            </div>
          </div>
        </div>

        {/* Active filters summary */}
        {activeTags.length > 0 && (
          <div className="active-filters-row">
            {activeTags.map(tag => (
              <span key={tag.key} className="active-filter-tag">
                {tag.label}
                <button onClick={() => removeTag(tag.key)}>×</button>
              </span>
            ))}
          </div>
        )}

        {/* Clear all */}
        {activeTags.length > 0 && (
          <button className="btn-clear-sidebar" onClick={clearFilters}>
            🗑 Xóa tất cả bộ lọc
          </button>
        )}
      </aside>

      {/* ════════ MAIN CONTENT ════════ */}
      <div className="main-content-area animate-fade-in">

        {/* Top bar */}
        <div className="list-topbar">
          <div className="list-topbar-left">
            <h1 className="list-title">
              <span className="accent-text">Khám phá</span> sản phẩm
            </h1>
            <p className="list-subtitle">Linh kiện PC & phụ kiện gaming cao cấp chính hãng</p>
          </div>

          <div className="topbar-search">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                defaultValue={filters.q}
                onChange={handleSearchChange}
                id="product-search"
              />
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div className="list-controls-row" style={{ marginBottom: 16 }}>
          <span className="results-count">
            <strong>{pagination.total}</strong> sản phẩm
          </span>

          {/* Sort */}
          <div className="sort-wrapper">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 6h18M7 12h10M11 18h2"/>
            </svg>
            <select
              value={filters.sort}
              onChange={e => setFilter('sort', e.target.value)}
              id="sort-select"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* View toggle */}
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Lưới">⊞</button>
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="Danh sách">☰</button>
          </div>
        </div>

        {/* Active tag chips */}
        {activeTags.length > 0 && (
          <div className="active-tags-bar">
            {activeTags.map(tag => (
              <span key={tag.key} className="active-tag-item">
                {tag.label}
                <button onClick={() => removeTag(tag.key)}>×</button>
              </span>
            ))}
          </div>
        )}

        {/* Products */}
        <main className="content">
          {loading ? (
            <div className={`products-grid ${viewMode === 'list' ? 'list-mode' : ''}`}>
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="product-card-premium skeleton">
                  <div className="card-image-wrapper" />
                  <div className="card-info">
                    <div className="skeleton-line" />
                    <div className="skeleton-line short" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className={`products-grid ${viewMode === 'list' ? 'list-mode' : ''}`}>
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode={viewMode}
                    onQuickAdd={handleQuickAdd}
                    favs={favs}
                    onToggleFav={toggleFav}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination-modern">
                  <button
                    className="page-arrow"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  >←</button>
                  <div className="page-numbers">
                    {getPaginationItems().map((item, idx) =>
                      item === '…' ? (
                        <span key={`dots-${idx}`} className="page-dots">…</span>
                      ) : (
                        <button
                          key={item}
                          className={`page-index ${pagination.page === item ? 'active' : ''}`}
                          onClick={() => setPagination(p => ({ ...p, page: item }))}
                        >{item}</button>
                      )
                    )}
                  </div>
                  <button
                    className="page-arrow"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  >→</button>
                </div>
              )}
            </>
          ) : (
            <div className="no-results-premium">
              <div className="no-results-icon">🔍</div>
              <h3>Không tìm thấy sản phẩm</h3>
              <p>Bộ lọc của bạn không khớp với sản phẩm nào. Hãy thử điều chỉnh lại tiêu chí tìm kiếm.</p>
              <button className="btn-primary" onClick={clearFilters}>Xóa bộ lọc</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductListPage;
