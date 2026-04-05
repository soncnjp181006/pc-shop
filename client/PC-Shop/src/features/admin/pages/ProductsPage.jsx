import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Download, 
  Trash2, 
  Edit, 
  Eye, 
  Diamond,
  Search,
  CheckCircle2,
  XCircle,
  Filter,
  Settings,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Save,
  RotateCcw
} from 'lucide-react';
import { Button, Badge, Card, Modal } from '../components/Common/Common';
import DataTable from '../components/Common/DataTable';
import { ConfirmDialog, ToastContainer } from '../components/Common/Feedback';
import { productsApi, adminApi, categoriesApi, getImageUrl } from '../../../utils/api';
import './Pages.css';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  
  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    brand: '',
    product_condition: '',
    origin: '',
    category_id: '',
    in_stock: '',
    status: 'all'
  });

  // Meta Config states
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [configData, setConfigData] = useState({
    brands: '',
    statuses: '',
    conditions: '',
    origins: ''
  });
  const [tempConfig, setTempConfig] = useState(configData);

  // Modal states (Product)
  const [showProductModal, setShowProductModal] = useState(false);
  const [productModalMode, setProductModalMode] = useState('create');
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [productFormData, setProductFormData] = useState({
    name: '',
    slug: '',
    description: '',
    additional_media: '',
    base_price: '',
    category_id: '',
    image_url: '',
    brand: '',
    product_condition: '',
    origin: '',
    stock_quantity: 0,
    is_active: true
  });

  // Variants management
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variantFormOpen, setVariantFormOpen] = useState(false);
  const [variantFormMode, setVariantFormMode] = useState('create');
  const [editingVariant, setEditingVariant] = useState(null);
  const [variantFormData, setVariantFormData] = useState({
    sku: '',
    attributes_json: '{}',
    price_override: '',
    stock_quantity: 0,
    is_active: true
  });

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- Fetching ---
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getProducts({
        page: pagination.page,
        limit: pagination.limit,
        sort: sortConfig.key === 'id' ? (sortConfig.direction === 'desc' ? 'newest' : 'oldest') : undefined,
        q: searchValue || undefined,
        brand: filters.brand || undefined,
        product_condition: filters.product_condition || undefined,
        origin: filters.origin || undefined,
        category_id: filters.category_id || undefined,
        in_stock: filters.in_stock === 'true' ? true : (filters.in_stock === 'false' ? false : undefined),
        active_only: filters.status === 'active' ? true : (filters.status === 'inactive' ? false : undefined)
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data);
        setPagination(prev => ({ ...prev, total: data.total, pages: data.pages }));
      }
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
      addToast('Không thể tải danh sách sản phẩm', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getTree();
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const loadMetaConfig = async () => {
    try {
      const res = await adminApi.getProductMetaConfig();
      if (res.ok) {
        const data = await res.json();
        setConfigData(data);
        setTempConfig(data);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
    loadMetaConfig();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 400);
    return () => clearTimeout(timer);
  }, [pagination.page, pagination.limit, sortConfig, searchValue, filters]);

  // --- Meta Config Handlers ---
  const handleSaveConfig = async () => {
    try {
      const res = await adminApi.updateProductMetaConfig(tempConfig);
      if (res.ok) {
        const data = await res.json();
        setConfigData(data);
        setTempConfig(data);
        addToast('Đã lưu cấu hình thành công', 'success');
        setShowConfigPanel(false);
      } else {
        addToast('Lưu cấu hình thất bại', 'error');
      }
    } catch (error) {
      addToast('Lỗi kết nối server', 'error');
    }
  };

  const resetConfigToDefault = () => {
    const defaultData = {
      brands: 'Apple\nASUS\nMSI\nGigabyte\nDell\nHP\nLenovo\nRazer\nCorsair\nNZXT\nLogitech\nSamsung\nLG\nIntel\nAMD\nNVIDIA',
      statuses: 'Đang kinh doanh\nNgừng kinh doanh\nSắp về hàng\nLiên hệ',
      conditions: 'Mới 100% Fullbox\nHàng Like New 99%\nHàng Cũ 95%\nHàng Cũ 90%\nHàng Trôi bảo hành',
      origins: 'Chính hãng (VAT)\nXách tay (Global)\nHàng nhập khẩu'
    };
    setTempConfig(defaultData);
    addToast('Đã tải lại cấu hình mặc định', 'info');
  };

  const brandsList = (configData.brands || '').split('\n').map(b => b.trim()).filter(b => b);
  const conditionsList = (configData.conditions || '').split('\n').map(c => c.trim()).filter(c => c);
  const originsList = (configData.origins || '').split('\n').map(o => o.trim()).filter(o => o);

  // --- Product CRUD Handlers ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (name === 'name') {
      const slug = value.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
      setProductFormData(prev => ({ ...prev, slug }));
    }
  };

  const openCreateProductModal = () => {
    setProductModalMode('create');
    setEditingProduct(null);
    setProductFormData({
      name: '', slug: '', description: '', additional_media: '',
      base_price: '', category_id: '', image_url: '',
      brand: '', product_condition: '', origin: '',
      stock_quantity: 0, is_active: true
    });
    setShowProductModal(true);
  };

  const openEditProductModal = (p) => {
    setProductModalMode('edit');
    setEditingProduct(p);
    
    // Extract media links from description
    const mediaMatch = (p.description || '').match(/\[MEDIA:(.*?)\]/);
    const mediaLinks = mediaMatch ? mediaMatch[1].split(';').join('\n') : '';
    const cleanDesc = (p.description || '').replace(/\[MEDIA:.*?\]/, '').trim();

    setProductFormData({
      name: p.name || '',
      slug: p.slug || '',
      description: cleanDesc,
      additional_media: mediaLinks,
      base_price: String(p.base_price || ''),
      category_id: String(p.category_id || ''),
      image_url: p.image_url || '',
      brand: p.brand || '',
      product_condition: p.product_condition || '',
      origin: p.origin || '',
      stock_quantity: p.stock_quantity || 0,
      is_active: !!p.is_active
    });
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    try {
      // Process description with media tags
      let finalDescription = productFormData.description || '';
      const mediaLines = (productFormData.additional_media || '')
        .split('\n').map(l => l.trim()).filter(l => l);
      
      if (mediaLines.length > 0) {
        finalDescription += `\n\n[MEDIA:${mediaLines.join(';')}]`;
      }

      const payload = {
        ...productFormData,
        description: finalDescription,
        base_price: parseFloat(productFormData.base_price),
        category_id: parseInt(productFormData.category_id),
        stock_quantity: parseInt(productFormData.stock_quantity)
      };

      const response = productModalMode === 'create'
        ? await productsApi.create(payload)
        : await productsApi.update(editingProduct.id, payload);

      if (response.ok) {
        addToast(productModalMode === 'create' ? 'Đã thêm sản phẩm' : 'Đã cập nhật sản phẩm', 'success');
        setShowProductModal(false);
        fetchProducts();
      } else {
        const error = await response.json();
        addToast(error.detail || 'Lưu thất bại', 'error');
      }
    } catch (error) {
      addToast('Lỗi kết nối', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa sản phẩm',
      message: 'Bạn có chắc chắn muốn xóa sản phẩm này? Thao tác này không thể hoàn tác.',
      onConfirm: async () => {
        try {
          const res = await productsApi.delete(id);
          if (res.ok) {
            addToast('Đã xóa sản phẩm thành công', 'success');
            fetchProducts();
          } else {
            addToast('Không thể xóa sản phẩm (có thể đang có đơn hàng)', 'error');
          }
        } catch (error) {
          addToast('Lỗi hệ thống khi xóa', 'error');
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleToggleProductStatus = async (p) => {
    // Cập nhật UI ngay lập tức để tránh giật
    const newStatus = !p.is_active;
    setProducts(prev => prev.map(item => item.id === p.id ? { ...item, is_active: newStatus } : item));
    
    try {
      const res = await adminApi.updateProductStatus(p.id, { is_active: newStatus });
      if (!res.ok) {
        // Rollback nếu lỗi
        setProducts(prev => prev.map(item => item.id === p.id ? { ...item, is_active: !newStatus } : item));
        addToast('Không thể cập nhật trạng thái', 'error');
      } else {
        addToast(newStatus ? 'Đã hiển thị sản phẩm' : 'Đã ẩn sản phẩm', 'success');
      }
    } catch (error) {
      setProducts(prev => prev.map(item => item.id === p.id ? { ...item, is_active: !newStatus } : item));
      addToast('Lỗi kết nối', 'error');
    }
  };

  // --- Bulk Actions ---
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa hàng loạt',
      message: `Bạn có chắc chắn muốn xóa ${selectedIds.length} sản phẩm đã chọn?`,
      onConfirm: async () => {
        try {
          const results = await Promise.all(selectedIds.map(id => productsApi.delete(id)));
          const failed = results.filter(r => !r.ok);
          if (failed.length === 0) {
            addToast(`Đã xóa thành công ${selectedIds.length} sản phẩm`, 'success');
          } else {
            addToast(`Xóa ${selectedIds.length - failed.length} thành công, ${failed.length} thất bại`, 'warning');
          }
          setSelectedIds([]);
          fetchProducts();
        } catch (error) {
          addToast('Lỗi khi thực hiện xóa hàng loạt', 'error');
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleBulkToggleStatus = async (active) => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id => adminApi.updateProductStatus(id, { is_active: active })));
      addToast(`Đã cập nhật trạng thái cho ${selectedIds.length} sản phẩm`, 'success');
      setSelectedIds([]);
      fetchProducts();
    } catch (error) {
      addToast('Lỗi cập nhật hàng loạt', 'error');
    }
  };

  // --- Export CSV ---
  const handleExportCSV = () => {
    if (products.length === 0) {
      addToast('Không có dữ liệu để xuất', 'warning');
      return;
    }
    
    const headers = ['ID', 'Tên sản phẩm', 'Hãng', 'Loại hàng', 'Nguồn gốc', 'Danh mục', 'Giá', 'Kho', 'Trạng thái'];
    const rows = products.map(p => [
      p.id, p.name, p.brand || '', p.product_condition || '', p.origin || '', 
      p.category_name || '', p.base_price, p.stock_quantity, 
      p.is_active ? 'Đang bán' : 'Ngừng bán'
    ]);
    
    let content = "\uFEFF"; // BOM for Vietnamese support
    content += headers.join("\t") + "\n";
    rows.forEach(row => {
      content += row.map(cell => String(cell).replace(/\t/g, ' ')).join("\t") + "\n";
    });
    
    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `products_export_${new Date().toISOString().slice(0,10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Đã bắt đầu tải file Excel', 'success');
  };

  // --- Variants Management ---
  const fetchVariants = async (productId) => {
    setLoadingVariants(true);
    try {
      const response = await productsApi.getVariants(productId);
      if (response.ok) {
        const data = await response.json();
        setVariants(data);
      }
    } catch (error) {
      console.error('Lỗi khi tải biến thể:', error);
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleShowVariants = (product) => {
    setSelectedProduct(product);
    setVariantFormOpen(false);
    setEditingVariant(null);
    setVariantFormMode('create');
    setShowVariantsModal(true);
    fetchVariants(product.id);
  };

  const handleVariantFormSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedProduct) return;
    
    let attributes;
    try {
      attributes = JSON.parse(variantFormData.attributes_json || '{}');
    } catch {
      addToast('Thuộc tính phải là JSON hợp lệ (ví dụ: {"Màu": "Đen"})', 'error');
      return;
    }

    const payload = {
      product_id: selectedProduct.id,
      sku: variantFormData.sku,
      attributes,
      price_override: variantFormData.price_override === '' ? null : parseFloat(variantFormData.price_override),
      stock_quantity: parseInt(variantFormData.stock_quantity, 10) || 0,
      is_active: !!variantFormData.is_active
    };

    try {
      const response = variantFormMode === 'create'
        ? await productsApi.createVariant(selectedProduct.id, payload)
        : await productsApi.updateVariant(editingVariant.id, payload);
      
      if (response.ok) {
        addToast(variantFormMode === 'create' ? 'Đã thêm biến thể' : 'Đã cập nhật biến thể', 'success');
        setVariantFormOpen(false);
        fetchVariants(selectedProduct.id);
      } else {
        const error = await response.json();
        addToast(error.detail || 'Không thể lưu biến thể', 'error');
      }
    } catch (error) {
      addToast('Lỗi kết nối', 'error');
    }
  };

  const handleDeleteVariant = (vId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa biến thể',
      message: 'Bạn có chắc chắn muốn xóa biến thể này?',
      onConfirm: async () => {
        try {
          const res = await productsApi.deleteVariant(vId);
          if (res.ok) {
            addToast('Đã xóa biến thể', 'success');
            fetchVariants(selectedProduct.id);
          } else {
            addToast('Không thể xóa biến thể', 'error');
          }
        } catch (error) {
          addToast('Lỗi hệ thống khi xóa', 'error');
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // --- Helpers ---
  const flattenCategories = (nodes, depth = 0) => {
    const result = [];
    nodes.forEach(node => {
      result.push({ id: node.id, name: node.name, depth });
      if (node.children) {
        result.push(...flattenCategories(node.children, depth + 1));
      }
    });
    return result;
  };

  const categoryOptions = useMemo(() => flattenCategories(categories), [categories]);

  const columns = [
    { 
      title: 'Sản phẩm', 
      key: 'name',
      render: (name, row) => (
        <div className="product-cell">
          <div className="product-img-wrapper">
            <img src={getImageUrl(row.image_url)} alt={name} className="product-img" />
          </div>
          <div className="product-info">
            <span className="product-name" title={name}>{name}</span>
            <div className="product-id-slug">
              <span className="product-id">ID: {row.id}</span>
              <span className="product-slug">Slug: {row.slug}</span>
            </div>
          </div>
        </div>
      ),
      width: '280px'
    },
    { 
      title: 'Hãng', 
      key: 'brand',
      render: (val) => <span className="brand-text">{val || '—'}</span>,
      width: '100px'
    },
    { 
      title: 'Tình trạng', 
      key: 'product_condition',
      render: (val) => <Badge variant="info">{val || '—'}</Badge>,
      width: '140px'
    },
    { 
      title: 'Nguồn gốc', 
      key: 'origin',
      render: (val) => <Badge variant="neutral">{val || '—'}</Badge>,
      width: '140px'
    },
    { 
      title: 'Danh mục', 
      key: 'category_name',
      render: (val) => <span className="category-text">{val || '—'}</span>,
      width: '120px'
    },
    { 
      title: 'Giá niêm yết', 
      key: 'base_price',
      sortable: true,
      render: (val) => <strong className="price-text">{val?.toLocaleString()} ₫</strong>,
      width: '130px'
    },
    { 
      title: 'Kho', 
      key: 'stock_quantity',
      sortable: true,
      render: (val) => (
        <div className="stock-cell">
          <Badge variant={val > 10 ? 'success' : (val > 0 ? 'warning' : 'danger')}>
            {val}
          </Badge>
        </div>
      ),
      width: '80px'
    },
    { 
      title: 'Trạng thái', 
      key: 'is_active',
      render: (val, row) => (
        <button 
          className={`status-pill ${val ? 'active' : 'inactive'}`} 
          onClick={() => handleToggleProductStatus(row)}
        >
          <span>{val ? 'Đang kinh doanh' : 'Ngừng bán'}</span>
        </button>
      ),
      width: '160px'
    },
    { 
      title: 'Thao tác', 
      key: 'actions',
      render: (_, row) => (
        <div className="table-actions">
          <button className="action-icon-btn diamond" onClick={() => handleShowVariants(row)} title="Biến thể">
            <Diamond size={18} />
          </button>
          <button className="action-icon-btn edit" onClick={() => openEditProductModal(row)} title="Sửa">
            <Edit size={18} />
          </button>
          <button className="action-icon-btn delete" onClick={() => handleDeleteProduct(row.id)} title="Xóa">
            <Trash2 size={18} />
          </button>
        </div>
      ),
      width: '130px'
    }
  ];

  return (
    <div className="page-products admin-scope">
      <div className="page-header-v2">
        <div className="header-title-group">
          <h1 className="page-title-v2">Quản lý sản phẩm</h1>
          <p className="page-subtitle-v2">Tổ chức, cập nhật và quản lý kho hàng của bạn một cách chuyên nghiệp.</p>
        </div>
        <div className="header-actions-v2">
          <Button variant="secondary" className="btn-config" icon={<Settings size={18} />} onClick={() => { setTempConfig(configData); setShowConfigPanel(true); }}>Cấu hình</Button>
          <Button variant="secondary" className="btn-export" icon={<Download size={18} />} onClick={handleExportCSV}>Xuất Excel</Button>
          <Button variant="primary" icon={<Plus size={18} />} onClick={openCreateProductModal}>Thêm sản phẩm</Button>
        </div>
      </div>

      <Card className="products-table-card">
        <div className="table-controls">
          <div className="search-and-filters">
            <div className="table-search-box">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Tìm tên, mã, hãng sản phẩm..." 
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            <Button 
              variant={showFilters ? 'primary' : 'secondary'} 
              className={showFilters ? '' : 'btn-filter'}
              icon={<Filter size={18} />} 
              onClick={() => setShowFilters(!showFilters)}
            >
              Bộ lọc {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>
          </div>

          {showFilters && (
            <div className="advanced-filters-panel">
              <div className="filters-grid">
                <div className="filter-item">
                  <label>Hãng sản xuất</label>
                  <select value={filters.brand} onChange={(e) => setFilters({...filters, brand: e.target.value})}>
                    <option value="">Tất cả hãng</option>
                    {brandsList.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="filter-item">
                  <label>Tình trạng</label>
                  <select value={filters.product_condition} onChange={(e) => setFilters({...filters, product_condition: e.target.value})}>
                    <option value="">Tất cả tình trạng</option>
                    {conditionsList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="filter-item">
                  <label>Nguồn gốc</label>
                  <select value={filters.origin} onChange={(e) => setFilters({...filters, origin: e.target.value})}>
                    <option value="">Tất cả nguồn gốc</option>
                    {originsList.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="filter-item">
                  <label>Danh mục</label>
                  <select value={filters.category_id} onChange={(e) => setFilters({...filters, category_id: e.target.value})}>
                    <option value="">Tất cả danh mục</option>
                    {categoryOptions.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {'\u00A0'.repeat(cat.depth * 2)}{cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-item">
                  <label>Tồn kho</label>
                  <select value={filters.in_stock} onChange={(e) => setFilters({...filters, in_stock: e.target.value})}>
                    <option value="">Tất cả</option>
                    <option value="true">Còn hàng</option>
                    <option value="false">Hết hàng</option>
                  </select>
                </div>
                <div className="filter-item">
                  <label>Trạng thái</label>
                  <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
                    <option value="all">Tất cả</option>
                    <option value="active">Đang bán</option>
                    <option value="inactive">Ngừng bán</option>
                  </select>
                </div>
              </div>
              <div className="filters-actions">
                <Button variant="ghost" size="sm" onClick={() => setFilters({brand: '', product_condition: '', origin: '', category_id: '', in_stock: '', status: 'all'})}>Xóa bộ lọc</Button>
              </div>
            </div>
          )}
        </div>

        <DataTable 
          columns={columns}
          data={products}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          onSort={(key, direction) => setSortConfig({ key, direction })}
          sortConfig={sortConfig}
          selectedRows={selectedIds}
          onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          onSelectAll={() => setSelectedIds(selectedIds.length === products.length ? [] : products.map(p => p.id))}
          bulkActions={[
            { label: 'Xóa đã chọn', icon: <Trash2 size={16} />, variant: 'danger', onClick: handleBulkDelete },
            { label: 'Hiện đã chọn', icon: <CheckCircle2 size={16} />, variant: 'secondary', onClick: () => handleBulkToggleStatus(true) },
            { label: 'Ẩn đã chọn', icon: <XCircle size={16} />, variant: 'secondary', onClick: () => handleBulkToggleStatus(false) },
          ]}
        />
      </Card>

      {/* Product Form Modal */}
      <Modal 
        isOpen={showProductModal} 
        onClose={() => setShowProductModal(false)} 
        title={productModalMode === 'create' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
        size="lg"
        footer={
          <>
            <Button variant="danger" onClick={() => setShowProductModal(false)}>Hủy</Button>
            <Button variant="primary" onClick={handleProductSubmit} loading={submitting}>Lưu sản phẩm</Button>
          </>
        }
      >
        <form className="admin-form" onSubmit={handleProductSubmit}>
          <div className="form-grid">
            <div className="form-section-container">
              <div className="form-section-title">Thông tin cơ bản & Phân loại</div>
              <div className="form-row-4">
                <div className="form-group">
                  <label>Tên sản phẩm</label>
                  <input name="name" value={productFormData.name} onChange={handleInputChange} placeholder="Tên sản phẩm..." required />
                </div>
                <div className="form-group">
                  <label>Slug (URL)</label>
                  <input name="slug" value={productFormData.slug} onChange={handleInputChange} placeholder="slug..." required />
                </div>
                <div className="form-group">
                  <label>Danh mục</label>
                  <select name="category_id" value={productFormData.category_id} onChange={handleInputChange} required>
                    <option value="">Chọn danh mục</option>
                    {categoryOptions.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {'\u00A0'.repeat(cat.depth * 2)}{cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Hãng sản xuất</label>
                  <select name="brand" value={productFormData.brand} onChange={handleInputChange}>
                    <option value="">Chọn hãng</option>
                    {brandsList.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section-container">
              <div className="form-section-title">Giá, Kho & Thuộc tính</div>
              <div className="form-row-4">
                <div className="form-group">
                  <label>Giá niêm yết (₫)</label>
                  <input type="number" name="base_price" value={productFormData.base_price} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Số lượng kho</label>
                  <input type="number" name="stock_quantity" value={productFormData.stock_quantity} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Tình trạng hàng</label>
                  <select name="product_condition" value={productFormData.product_condition} onChange={handleInputChange}>
                    <option value="">Chọn tình trạng</option>
                    {conditionsList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Nguồn gốc</label>
                  <select name="origin" value={productFormData.origin} onChange={handleInputChange}>
                    <option value="">Chọn nguồn gốc</option>
                    {originsList.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-section-container">
                <div className="form-section-title">Media & Trạng thái</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Ảnh đại diện (URL)</label>
                    <input name="image_url" value={productFormData.image_url} onChange={handleInputChange} placeholder="URL ảnh..." />
                  </div>
                  <div className="form-group checkbox" style={{marginTop: '22px'}}>
                    <label className="checkbox-label">
                      <input type="checkbox" name="is_active" checked={productFormData.is_active} onChange={handleInputChange} />
                      <span>Hiển thị ngay</span>
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label>Media bổ sung (1 link/dòng)</label>
                  <textarea name="additional_media" value={productFormData.additional_media} onChange={handleInputChange} rows={1} placeholder="https://..."></textarea>
                </div>
              </div>

              <div className="form-section-container">
                <div className="form-section-title">Mô tả chi tiết</div>
                <div className="form-group" style={{height: '100%'}}>
                  <textarea name="description" value={productFormData.description} onChange={handleInputChange} style={{height: '100%', minHeight: '100px'}} placeholder="Nhập mô tả sản phẩm..."></textarea>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Variants Modal */}
      <Modal
        isOpen={showVariantsModal}
        onClose={() => setShowVariantsModal(false)}
        title={`Biến thể: ${selectedProduct?.name}`}
        size="xl"
      >
        <div className="variants-manager">
          <div className="variants-header">
            <div className="variants-info">
              <p>Quản lý các lựa chọn như Màu sắc, Dung lượng, Cấu hình cho sản phẩm này.</p>
            </div>
            {!variantFormOpen && (
              <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={() => {
                setVariantFormMode('create');
                setEditingVariant(null);
                setVariantFormData({ sku: '', attributes_json: '{}', price_override: '', stock_quantity: 0, is_active: true });
                setVariantFormOpen(true);
              }}>Thêm biến thể</Button>
            )}
          </div>

          {variantFormOpen && (
            <Card className="variant-form-card">
              <form onSubmit={handleVariantFormSubmit} className="variant-form">
                <div className="variant-form-grid">
                  <div className="form-group">
                    <label>Mã SKU</label>
                    <input name="sku" value={variantFormData.sku} onChange={(e) => setVariantFormData({...variantFormData, sku: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Giá riêng (để trống nếu dùng giá gốc)</label>
                    <input type="number" name="price_override" value={variantFormData.price_override} onChange={(e) => setVariantFormData({...variantFormData, price_override: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Kho hàng</label>
                    <input type="number" name="stock_quantity" value={variantFormData.stock_quantity} onChange={(e) => setVariantFormData({...variantFormData, stock_quantity: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Thuộc tính (JSON)</label>
                    <input name="attributes_json" value={variantFormData.attributes_json} onChange={(e) => setVariantFormData({...variantFormData, attributes_json: e.target.value})} placeholder='{"Màu": "Đen"}' required />
                  </div>
                </div>
                <div className="variant-form-footer">
                  <Button variant="danger" size="sm" onClick={() => setVariantFormOpen(false)}>Hủy</Button>
                  <Button variant="primary" size="sm" icon={<Save size={16} />} onClick={handleVariantFormSubmit}>Lưu</Button>
                </div>
              </form>
            </Card>
          )}

          <div className="variants-list">
            {loadingVariants ? (
              <div className="loading-state">Đang tải biến thể...</div>
            ) : variants.length === 0 ? (
              <div className="empty-state">Sản phẩm này chưa có biến thể nào.</div>
            ) : (
              <table className="admin-table mini">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Thuộc tính</th>
                    <th>Giá</th>
                    <th>Kho</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map(v => (
                    <tr key={v.id}>
                      <td><code>{v.sku}</code></td>
                      <td>
                        {Object.entries(v.attributes || {}).map(([key, val]) => (
                          <Badge key={key} variant="neutral" className="attr-badge">{key}: {val}</Badge>
                        ))}
                      </td>
                      <td>{v.price_override ? <strong>{v.price_override.toLocaleString()} ₫</strong> : <span className="text-muted">Giá gốc</span>}</td>
                      <td><Badge variant={v.stock_quantity > 0 ? 'success' : 'danger'}>{v.stock_quantity}</Badge></td>
                      <td>{v.is_active ? <Badge variant="success">Hiện</Badge> : <Badge variant="neutral">Ẩn</Badge>}</td>
                      <td>
                        <div className="table-actions">
                          <Button variant="ghost" size="sm" icon={<Edit size={14} />} onClick={() => {
                            setVariantFormMode('edit');
                            setEditingVariant(v);
                            setVariantFormData({
                              sku: v.sku || '',
                              attributes_json: JSON.stringify(v.attributes || {}, null, 2),
                              price_override: v.price_override === null ? '' : String(v.price_override),
                              stock_quantity: v.stock_quantity || 0,
                              is_active: !!v.is_active
                            });
                            setVariantFormOpen(true);
                          }} />
                          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} className="text-danger" onClick={() => handleDeleteVariant(v.id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Modal>

      {/* Config Panel Modal */}
      <Modal
        isOpen={showConfigPanel}
        onClose={() => setShowConfigPanel(false)}
        title="Cấu hình thuộc tính sản phẩm"
        size="lg"
        footer={
          <>
            <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={resetConfigToDefault}>Mặc định</Button>
            <Button variant="primary" icon={<Save size={16} />} onClick={handleSaveConfig}>Lưu cấu hình</Button>
          </>
        }
      >
        <div className="config-panel">
          <div className="config-alert">
            <AlertCircle size={20} />
            <p>Các thay đổi tại đây sẽ ảnh hưởng đến danh sách lựa chọn khi thêm/sửa sản phẩm và các bộ lọc trên trang khách hàng.</p>
          </div>
          <div className="config-grid-v2">
            <div className="config-item">
              <label>Danh sách hãng sản xuất (Mỗi dòng 1 hãng)</label>
              <textarea value={tempConfig.brands} onChange={(e) => setTempConfig({...tempConfig, brands: e.target.value})} rows={6}></textarea>
            </div>
            <div className="config-item">
              <label>Danh sách tình trạng (Mỗi dòng 1 loại)</label>
              <textarea value={tempConfig.conditions} onChange={(e) => setTempConfig({...tempConfig, conditions: e.target.value})} rows={6}></textarea>
            </div>
            <div className="config-item">
              <label>Danh sách nguồn gốc (Mỗi dòng 1 loại)</label>
              <textarea value={tempConfig.origins} onChange={(e) => setTempConfig({...tempConfig, origins: e.target.value})} rows={6}></textarea>
            </div>
            <div className="config-item">
              <label>Trạng thái kinh doanh (Mỗi dòng 1 loại)</label>
              <textarea value={tempConfig.statuses} onChange={(e) => setTempConfig({...tempConfig, statuses: e.target.value})} rows={6}></textarea>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog {...confirmDialog} onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default ProductsPage;
