import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, SlidersHorizontal, LayoutGrid, List,
  ChevronDown, ChevronRight, Tag, CircleDollarSign,
  PackageCheck, Sparkles, Heart, ShoppingCart, X,
  ArrowUpDown, CheckCircle2, XCircle, Star, Layers,
  RotateCcw, Zap, Filter
} from 'lucide-react';
import { productsApi, categoriesApi, getImageUrl, cartApi } from '../../../utils/api';
import './ProductListPage.css';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */
const BRANDS = ['Apple','ASUS','MSI','Gigabyte','Dell','HP','Lenovo','Razer','Corsair','NZXT'];

const PRICE_PRESETS = [
  { label: '< 5 triệu',   min: '',         max: '5000000'  },
  { label: '5 – 10 triệu', min: '5000000',  max: '10000000' },
  { label: '10 – 20 triệu',min: '10000000', max: '20000000' },
  { label: '> 20 triệu',  min: '20000000', max: ''         },
];

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Mới nhất'         },
  { value: 'price_asc',  label: 'Giá: Thấp → Cao'  },
  { value: 'price_desc', label: 'Giá: Cao → Thấp'  },
  { value: 'name_asc',   label: 'Tên: A → Z'       },
];

const INIT_FILTERS = {
  q: '', category_id: '', min_price: '', max_price: '',
  sort: 'newest', brand: '', in_stock: false,
};

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
const findCategoryPath = (nodes, targetId, path = []) => {
  for (const node of nodes) {
    const next = [...path, node.id];
    if (String(node.id) === String(targetId)) return next;
    if (node.children?.length) {
      const r = findCategoryPath(node.children, targetId, next);
      if (r) return r;
    }
  }
  return null;
};

const findCategoryById = (nodes, id) => {
  for (const n of nodes) {
    if (String(n.id) === String(id)) return n;
    if (n.children?.length) {
      const r = findCategoryById(n.children, id);
      if (r) return r;
    }
  }
  return null;
};

const buildApiParams = (filters, page, limit) => {
  const p = { page, limit };
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== '' && v !== false && v !== null && v !== undefined) p[k] = v;
  });
  return p;
};

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════ */

/* Collapsible filter section */
const FilterSection = ({ icon: Icon, title, hasActive, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sidebar-section">
      <button className="filter-section-toggle" onClick={() => setOpen(o => !o)} type="button">
        <div className="toggle-left">
          {Icon && <Icon size={15} className="filter-toggle-icon" />}
          <span>{title}</span>
        </div>
        <div className="toggle-right">
          {hasActive && <span className="active-filter-dot" />}
          <ChevronDown size={13} className={`toggle-chevron ${open ? 'open' : ''}`} />
        </div>
      </button>
      <div className={`filter-section-body ${open ? 'open' : ''}`}>
        <div className="filter-section-inner">{children}</div>
      </div>
    </div>
  );
};

/* Category tree node */
const CategoryNode = ({ node, depth, activeId, onSelect, expandedIds, onToggle }) => {
  const hasChildren = !!node.children?.length;
  const expanded    = expandedIds.includes(node.id);
  const active      = String(activeId) === String(node.id);

  return (
    <div className="category-node">
      <div className="category-row" style={{ paddingLeft: `${depth * 14}px` }}>
        {hasChildren ? (
          <button type="button" className="cat-toggle"
            onClick={e => { e.stopPropagation(); onToggle(node.id); }}>
            <ChevronRight size={12} className={`cat-chevron ${expanded ? 'open' : ''}`} />
          </button>
        ) : (
          <span className="cat-leaf" />
        )}
        <button type="button"
          className={`category-item category-select ${active ? 'active' : ''}`}
          onClick={() => { onSelect(node.id); if (hasChildren && !expanded) onToggle(node.id); }}>
          {node.name}
        </button>
      </div>
      {hasChildren && expanded && (
        <div className="category-children">
          {node.children.map(child => (
            <CategoryNode key={child.id} node={child} depth={depth + 1}
              activeId={activeId} onSelect={onSelect}
              expandedIds={expandedIds} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
};

/* Product card */
const ProductCard = ({ product, viewMode, onQuickAdd, favs, onToggleFav }) => {
  const isFaved  = favs.has(product.id);
  const inStock  = product.available_stock > 0;

  return (
    <Link to={`/products/${product.id}`} className="product-card-glossy">
      <div className="card-image-container">
        {product.image_url
          ? <img src={getImageUrl(product.image_url)} alt={product.name} className="product-img" loading="lazy" />
          : <div className="product-img image-placeholder">PC</div>
        }
        <div className="card-overlay">
          <span className="view-detail">Xem chi tiết →</span>
        </div>
        <button
          className={`card-fav-btn ${isFaved ? 'faved' : ''}`}
          onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleFav(product.id); }}
          title={isFaved ? 'Bỏ yêu thích' : 'Yêu thích'}
        >
          <Heart size={15} fill={isFaved ? '#ff4d6d' : 'none'} />
        </button>
      </div>

      <div className="card-body">
        <div className="card-top-row">
          <span className="badge">Chính hãng</span>
          <span className={`card-stock-badge ${inStock ? 'in' : 'out'}`}>
            {inStock
              ? <><CheckCircle2 size={10} /> Còn {product.available_stock}</>
              : <><XCircle size={10} /> Hết hàng</>
            }
          </span>
        </div>
        <h4 className="card-name">{product.name}</h4>
        <div className="card-rating">
          <div className="card-stars">
            {[1,2,3,4,5].map(i => <Star key={i} size={11} fill="#f59e0b" color="#f59e0b" />)}
          </div>
          <span className="card-rating-count">(128)</span>
        </div>
        <div className="card-footer">
          <p className="card-price-modern">{product.base_price.toLocaleString()} ₫</p>
          <button
            className="card-quick-add"
            title="Thêm vào giỏ"
            onClick={e => { e.preventDefault(); e.stopPropagation(); onQuickAdd(product); }}
          >
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </Link>
  );
};

/* Toast */
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`product-toast product-toast--${type}`}>
      {type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      <span>{msg}</span>
      <button onClick={onClose}><X size={14} /></button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  /* ── State ── */
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [viewMode,    setViewMode]    = useState('grid');
  const [favs,        setFavs]        = useState(new Set());
  const [toast,       setToast]       = useState(null);
  const [expandedIds, setExpandedIds] = useState([]);
  const [pagination,  setPagination]  = useState({ page: 1, limit: 20, pages: 1, total: 0 });

  const [filters, setFilters] = useState({
    q:           searchParams.get('q')           || '',
    category_id: searchParams.get('category_id') || '',
    min_price:   searchParams.get('min_price')   || '',
    max_price:   searchParams.get('max_price')   || '',
    sort:        searchParams.get('sort')         || 'newest',
    brand:       searchParams.get('brand')        || '',
    in_stock:    searchParams.get('in_stock') === 'true',
  });

  // separate "page" ref to avoid double-fetch
  const pageRef      = useRef(pagination.page);
  const searchDebRef = useRef(null);
  const [searchInput, setSearchInput] = useState(filters.q);

  /* ── WebSocket realtime stock ── */
  useEffect(() => {
    fetchCategories();

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const port  = window.location.host.replace('5174','8000').replace('5173','8000');
    const wsUrl = `${proto}//${port}/ws/stock`;
    let ws;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        ws.onmessage = e => {
          try {
            const d = JSON.parse(e.data);
            if (d.type === 'stock_updated' && d.product_id) {
              setProducts(prev => prev.map(p =>
                String(p.id) === String(d.product_id)
                  ? { ...p, available_stock: d.available_stock }
                  : p
              ));
            }
          } catch { /* ignore */ }
        };
        ws.onerror  = () => { /* silent */ };
        ws.onclose  = () => setTimeout(connect, 5000);
      } catch { /* no WS */ }
    };

    connect();
    return () => { ws?.close(); };
  }, []);

  /* ── Fetch whenever filters or page changes ── */
  useEffect(() => {
    // Sync URL params
    const urlP = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v !== false && v !== null) urlP[k] = v;
    });
    setSearchParams(urlP, { replace: true });

    // Build API params
    const params = buildApiParams(filters, pagination.page, pagination.limit);
    fetchProducts(params);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  /* ── Auto-expand category path in sidebar ── */
  useEffect(() => {
    if (!filters.category_id || !categories.length) return;
    const path = findCategoryPath(categories, filters.category_id);
    if (path?.length > 1) setExpandedIds(path.slice(0, -1));
  }, [categories, filters.category_id]);

  /* ── Data fetch functions ── */
  const fetchCategories = async () => {
    try {
      const r = await categoriesApi.getTree();
      if (r.ok) setCategories(await r.json());
    } catch { /* ignore */ }
  };

  const fetchProducts = async (params) => {
    setLoading(true);
    try {
      const r = await productsApi.getAll(params);
      if (r.ok) {
        const d = await r.json();
        setProducts(d.data || []);
        setPagination(prev => ({ ...prev, pages: d.pages ?? 1, total: d.total ?? 0 }));
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  /* ── Filter setters ── */
  // Reset page to 1 whenever a filter changes
  const applyFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const toggleBrand = useCallback((brand) => {
    if (brand === '') {
      setFilters(prev => ({ ...prev, brand: '' }));
    } else {
      setFilters(prev => {
        let brands = prev.brand ? prev.brand.split(',') : [];
        if (brands.includes(brand)) {
          brands = brands.filter(b => b !== brand);
        } else {
          brands.push(brand);
        }
        return { ...prev, brand: brands.join(',') };
      });
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const applyPricePreset = useCallback((preset) => {
    setFilters(prev => {
      const isSame = prev.min_price === preset.min && prev.max_price === preset.max;
      return isSame
        ? { ...prev, min_price: '', max_price: '' }
        : { ...prev, min_price: preset.min, max_price: preset.max };
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const toggleInStock = useCallback(() => {
    setFilters(prev => ({ ...prev, in_stock: !prev.in_stock }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(INIT_FILTERS);
    setSearchInput('');
    setExpandedIds([]);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /* ── Debounced search ── */
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(searchDebRef.current);
    searchDebRef.current = setTimeout(() => applyFilter('q', val), 400);
  };

  /* ── Favorite toggle ── */
  const toggleFav = useCallback((id) => {
    setFavs(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  /* ── Quick add to cart ── */
  const handleQuickAdd = useCallback(async (product) => {
    if (!localStorage.getItem('access_token')) {
      setToast({ msg: 'Vui lòng đăng nhập để thêm vào giỏ hàng.', type: 'error' });
      return;
    }
    if (product.available_stock <= 0) {
      setToast({ msg: 'Sản phẩm này đã hết hàng.', type: 'error' });
      return;
    }
    try {
      const r = await cartApi.addItem(null, 1, product.id);
      if (r.ok) {
        setToast({ msg: `Đã thêm "${product.name.slice(0, 28)}..." vào giỏ!`, type: 'success' });
        window.dispatchEvent(new Event('cartUpdated'));
      } else if (r.status === 401) {
        setToast({ msg: 'Phiên đăng nhập hết hạn.', type: 'error' });
      } else {
        const err = await r.json().catch(() => ({}));
        setToast({ msg: err.detail || 'Không thể thêm vào giỏ hàng.', type: 'error' });
      }
    } catch {
      setToast({ msg: 'Lỗi kết nối máy chủ.', type: 'error' });
    }
  }, []);

  /* ── Pagination ── */
  const getPaginationItems = () => {
    const total = pagination.pages || 1;
    const cur   = pagination.page;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const set = new Set([1, total, cur - 1, cur, cur + 1].filter(x => x >= 1 && x <= total));
    const arr = [...set].sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      if (i > 0 && arr[i] - arr[i - 1] > 1) out.push('…');
      out.push(arr[i]);
    }
    return out;
  };

  const activeTags = [];
  if (filters.q)           activeTags.push({ key: 'q',       label: `"${filters.q}"` });
  if (filters.category_id) {
    const cat = findCategoryById(categories, filters.category_id);
    activeTags.push({ key: 'category_id', label: cat?.name || 'Danh mục' });
  }
  if (filters.brand) {
    const brands = filters.brand.split(',');
    brands.forEach(b => activeTags.push({ key: `brand_${b}`, label: b }));
  }
  if (filters.min_price || filters.max_price) {
    const lo = filters.min_price ? `${Number(filters.min_price).toLocaleString()}₫` : '0₫';
    const hi = filters.max_price ? `${Number(filters.max_price).toLocaleString()}₫` : '∞';
    activeTags.push({ key: 'price', label: `${lo} – ${hi}` });
  }
  if (filters.in_stock)    activeTags.push({ key: 'in_stock', label: 'Còn hàng' });

  const removeTag = (key) => {
    if (key === 'price') {
      setFilters(prev => ({ ...prev, min_price: '', max_price: '' }));
      setPagination(prev => ({ ...prev, page: 1 }));
    } else if (key.toString().startsWith('brand_')) {
      const bToRemove = key.replace('brand_', '');
      setFilters(prev => {
        let brands = prev.brand ? prev.brand.split(',') : [];
        brands = brands.filter(b => b !== bToRemove);
        return { ...prev, brand: brands.join(',') };
      });
      setPagination(prev => ({ ...prev, page: 1 }));
    } else {
      applyFilter(key, key === 'in_stock' ? false : '');
    }
  };

  /* ── Check active price preset ── */
  const activePricePreset = PRICE_PRESETS.find(
    p => p.min === filters.min_price && p.max === filters.max_price
  );

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="product-list-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ═══ SIDEBAR ═══ */}
      <aside className="sidebar-fixed">
        {/* Header */}
        <div className="sidebar-brand">
          <Filter size={14} />
          <span>Bộ lọc sản phẩm</span>
        </div>

        {/* Categories */}
        <div className="sidebar-group">
          <div className="group-label">
            <Layers size={13} />
            Danh mục
          </div>
          <div className="category-tree">
            <button type="button"
              className={`category-item category-select ${filters.category_id === '' ? 'active' : ''}`}
              onClick={() => { setExpandedIds([]); applyFilter('category_id', ''); }}>
              Tất cả sản phẩm
            </button>
            {categories.map(cat => (
              <CategoryNode key={cat.id} node={cat} depth={0}
                activeId={filters.category_id}
                onSelect={id => applyFilter('category_id', id)}
                expandedIds={expandedIds}
                onToggle={id => setExpandedIds(prev =>
                  prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                )} />
            ))}
          </div>
        </div>

        {/* Filter block */}
        <div className="sidebar-group filter-group">
          <div className="group-label">
            <SlidersHorizontal size={13} />
            Lọc chi tiết
          </div>

          {/* Thương hiệu */}
          <FilterSection icon={Tag} title="Thương hiệu" hasActive={!!filters.brand} defaultOpen>
            <div className="brand-grid">
              <button
                className={`brand-chip ${filters.brand === '' ? 'active' : ''}`}
                onClick={() => toggleBrand('')}
              >Tất cả</button>
              {BRANDS.map(b => {
                const isActive = (filters.brand || '').split(',').includes(b);
                return (
                  <button
                    key={b}
                    className={`brand-chip ${isActive ? 'active' : ''}`}
                    onClick={() => toggleBrand(b)}
                  >{b}</button>
                );
              })}
            </div>
          </FilterSection>

          {/* Khoảng giá */}
          <FilterSection icon={CircleDollarSign} title="Khoảng giá" hasActive={!!(filters.min_price || filters.max_price)}>
            <div className="price-range-inputs">
              <input
                type="number"
                placeholder="Giá từ"
                value={filters.min_price}
                min="0"
                onChange={e => applyFilter('min_price', e.target.value)}
              />
              <span className="price-sep" />
              <input
                type="number"
                placeholder="Giá đến"
                value={filters.max_price}
                min="0"
                onChange={e => applyFilter('max_price', e.target.value)}
              />
            </div>
            <div className="price-presets">
              {PRICE_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  className={`price-preset-btn ${activePricePreset?.label === preset.label ? 'active' : ''}`}
                  onClick={() => applyPricePreset(preset)}
                >{preset.label}</button>
              ))}
            </div>
          </FilterSection>

          {/* Tình trạng */}
          <FilterSection icon={PackageCheck} title="Tình trạng hàng" hasActive={filters.in_stock}>
            <div
              className="toggle-switch-row"
              onClick={toggleInStock}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && toggleInStock()}
            >
              <span className="toggle-switch-label">
                <CheckCircle2 size={14} />
                Chỉ hiện còn hàng
              </span>
              <div className={`toggle-pill ${filters.in_stock ? 'on' : ''}`} />
            </div>
          </FilterSection>
        </div>

        {/* Active filter chips */}
        {activeTags.length > 0 && (
          <div className="active-filters-row">
            {activeTags.map(tag => (
              <span key={tag.key} className="active-filter-tag">
                {tag.label}
                <button onClick={() => removeTag(tag.key)}><X size={10} /></button>
              </span>
            ))}
          </div>
        )}

        {activeTags.length > 0 && (
          <button className="btn-clear-sidebar" onClick={clearFilters}>
            <RotateCcw size={13} />
            Xóa tất cả bộ lọc
          </button>
        )}
      </aside>

      {/* ═══ MAIN AREA ═══ */}
      <div className="main-content-area animate-fade-in">

        {/* ── Top bar ── */}
        <div className="list-topbar">
          <div className="list-topbar-left">
            <h1 className="list-title">
              <span className="accent-text">Khám phá</span> sản phẩm
            </h1>
            <p className="list-subtitle">Linh kiện PC & phụ kiện gaming cao cấp chính hãng</p>
          </div>

          {/* Inline search */}
          <div className="search-input-wrap">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchInput}
              onChange={handleSearchChange}
            />
            {searchInput && (
              <button className="search-clear-btn" onClick={() => { setSearchInput(''); applyFilter('q', ''); }}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* ── Controls row ── */}
        <div className="list-controls-row">
          <span className="results-count">
            <strong>{pagination.total}</strong> sản phẩm
          </span>

          {/* Sort */}
          <div className="sort-wrapper">
            <ArrowUpDown size={14} />
            <select value={filters.sort} onChange={e => applyFilter('sort', e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* View toggle */}
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')} title="Lưới">
              <LayoutGrid size={16} />
            </button>
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')} title="Danh sách">
              <List size={16} />
            </button>
          </div>
        </div>

        {/* ── Active filter tags (main area) ── */}
        {activeTags.length > 0 && (
          <div className="active-tags-bar">
            {activeTags.map(tag => (
              <span key={tag.key} className="active-tag-item">
                <Zap size={10} />
                {tag.label}
                <button onClick={() => removeTag(tag.key)}><X size={10} /></button>
              </span>
            ))}
            <button className="clear-all-tags" onClick={clearFilters}>
              <RotateCcw size={10} /> Xóa tất cả
            </button>
          </div>
        )}

        {/* ── Products ── */}
        <main className="content">
          {loading ? (
            <div className={`products-grid ${viewMode === 'list' ? 'list-mode' : ''}`}>
              {Array.from({ length: 8 }).map((_, i) => (
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

              {pagination.pages > 1 && (
                <div className="pagination-modern">
                  <button className="page-arrow"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>
                    ←
                  </button>
                  <div className="page-numbers">
                    {getPaginationItems().map((item, idx) =>
                      item === '…' ? (
                        <span key={`d${idx}`} className="page-dots">…</span>
                      ) : (
                        <button key={item}
                          className={`page-index ${pagination.page === item ? 'active' : ''}`}
                          onClick={() => setPagination(p => ({ ...p, page: item }))}>
                          {item}
                        </button>
                      )
                    )}
                  </div>
                  <button className="page-arrow"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>
                    →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-results-premium">
              <Search size={48} className="no-results-icon-svg" strokeWidth={1} />
              <h3>Không tìm thấy sản phẩm</h3>
              <p>Bộ lọc không khớp với bất kỳ sản phẩm nào. Hãy thử điều chỉnh lại tiêu chí tìm kiếm.</p>
              <button className="btn-primary" onClick={clearFilters}>
                <RotateCcw size={14} /> Xóa bộ lọc
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductListPage;
