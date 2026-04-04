import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, productsApi, categoriesApi, adminApi, getImageUrl } from '../../../utils/api';
import { BarChart2, Package, Folder, Users, Eye, EyeOff, Edit, Trash2, Diamond, Lock, Unlock, FileText, DollarSign, Download, CheckSquare, Square, X, Menu } from 'lucide-react';
import './DashboardPage.css';

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [toast, setToast] = useState(null);

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
    fetchVariants(product.id);
  };
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  
  const handleExportCSV = () => {
    if (products.length === 0) return;
    
    const headers = ['ID', 'Tên sản phẩm', 'Slug', 'Hãng', 'Loại hàng', 'Nguồn gốc', 'Danh mục', 'Giá', 'Kho', 'Trạng thái'];
    const rows = products.map(p => [
      p.id,
      p.name,
      p.slug,
      p.brand || '',
      p.product_condition || '',
      p.origin || '',
      p.category_name || '',
      p.base_price,
      p.stock_quantity,
      p.is_active ? 'Đang bán' : 'Ngừng bán'
    ]);
    
    // Sử dụng định dạng Tab-Separated Values (TSV) và lưu với đuôi .xls
    // Đây là cách cực kỳ hiệu quả để Excel tự động chia cột đúng mà không quan tâm đến locale (dấu phẩy hay chấm phẩy)
    let content = "\uFEFF"; // BOM để hỗ trợ tiếng Việt
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
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa hàng loạt',
      message: `Bạn có chắc chắn muốn xóa ${selectedProductIds.length} sản phẩm đã chọn? Thao tác này sẽ xóa vĩnh viễn và không thể hoàn tác.`,
      onConfirm: async () => {
        try {
          // Xóa từng cái (Backend chưa có bulk delete endpoint chuyên dụng)
          const results = await Promise.all(selectedProductIds.map(async (id) => {
            const res = await productsApi.delete(id);
            return { id, ok: res.ok };
          }));
          
          const failed = results.filter(r => !r.ok);
          
          if (failed.length === 0) {
            setToast({ type: 'success', message: `Đã xóa thành công ${selectedProductIds.length} sản phẩm` });
          } else {
            setToast({ 
              type: 'warning', 
              message: `Đã xóa ${selectedProductIds.length - failed.length} mục. ${failed.length} mục thất bại do có dữ liệu liên quan.` 
            });
          }
          
          setSelectedProductIds([]);
          fetchProducts();
        } catch (error) {
          console.error('Lỗi khi xóa hàng loạt:', error);
          setToast({ type: 'error', message: 'Có lỗi hệ thống khi xóa hàng loạt sản phẩm' });
        }
      }
    });
  };

  const handleBulkToggleStatus = async (active) => {
    if (selectedProductIds.length === 0) return;
    
    try {
      await Promise.all(selectedProductIds.map(id => adminApi.updateProductStatus(id, { is_active: active })));
      setToast({ type: 'success', message: `Đã cập nhật trạng thái cho ${selectedProductIds.length} sản phẩm` });
      setSelectedProductIds([]);
      fetchProducts();
    } catch (error) {
      console.error('Lỗi khi cập nhật hàng loạt:', error);
      setToast({ type: 'error', message: 'Có lỗi khi cập nhật một số sản phẩm' });
    }
  };
  const [configData, setConfigData] = useState(() => {
    const saved = localStorage.getItem('admin_config');
    return saved ? JSON.parse(saved) : {
      brands: 'Apple\nASUS\nMSI\nGigabyte\nDell\nHP\nLenovo\nRazer\nCorsair\nNZXT\nLogitech\nSamsung\nLG\nIntel\nAMD\nNVIDIA',
      statuses: 'Đang kinh doanh\nNgừng kinh doanh\nSắp về hàng\nLiên hệ',
      conditions: 'Mới 100% Fullbox\nHàng Like New 99%\nHàng Cũ 95%\nHàng Cũ 90%\nHàng Trôi bảo hành',
      origins: 'Chính hãng (VAT)\nXách tay (Global)\nHàng nhập khẩu'
    };
  });

  const brandsList = (configData.brands || '').split('\n').map(b => b.trim()).filter(b => b);
  const statusesList = (configData.statuses || '').split('\n').map(s => s.trim()).filter(s => s);
  const conditionsList = (configData.conditions || '').split('\n').map(c => c.trim()).filter(c => c);
  const originsList = (configData.origins || '').split('\n').map(o => o.trim()).filter(o => o);

  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [tempConfig, setTempConfig] = useState(configData);

  const handleSaveConfig = () => {
    setConfigData(tempConfig);
    localStorage.setItem('admin_config', JSON.stringify(tempConfig));
    setToast({ type: 'success', message: 'Đã lưu cấu hình danh sách' });
    setShowConfigPanel(false);
  };

  const resetConfigToDefault = () => {
    const defaultData = {
      brands: 'Apple\nASUS\nMSI\nGigabyte\nDell\nHP\nLenovo\nRazer\nCorsair\nNZXT\nLogitech\nSamsung\nLG\nIntel\nAMD\nNVIDIA',
      statuses: 'Đang kinh doanh\nNgừng kinh doanh\nSắp về hàng\nLiên hệ',
      conditions: 'Mới 100% Fullbox\nHàng Like New 99%\nHàng Cũ 95%\nHàng Cũ 90%\nHàng Trôi bảo hành',
      origins: 'Chính hãng (VAT)\nXách tay (Global)\nHàng nhập khẩu'
    };
    setTempConfig(defaultData);
    setToast({ type: 'info', message: 'Đã tải lại cấu hình mặc định (Nhấn Lưu để áp dụng)' });
  };

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(productSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const [productPaging, setProductPaging] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
    sort: 'newest',
    status: 'all',
    brand: '',
    product_condition: '',
    origin: '',
    in_stock: ''
  });
  const [overviewStats, setOverviewStats] = useState({ products: 0, categories: 0, users: 0 });
  const [productModalMode, setProductModalMode] = useState('create');
  const [editingProduct, setEditingProduct] = useState(null);
  const [categoryModalMode, setCategoryModalMode] = useState('create');
  const [editingCategory, setEditingCategory] = useState(null);
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
  // Tối ưu render bảng để tránh giật khi chọn checkbox
  const productTableRows = useMemo(() => {
    // Nếu đang tải và chưa có dữ liệu, hiển thị khung trống ổn định
    if (loading && products.length === 0) {
      return (
        <tr>
          <td colSpan="11" className="text-center" style={{ height: '400px', verticalAlign: 'middle' }}>
            <div className="loader" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '20px', color: 'var(--admin-text-secondary-dark)' }}>Đang tải dữ liệu sản phẩm...</p>
          </td>
        </tr>
      );
    }
    
    // Nếu không có sản phẩm sau khi đã tải xong
    if (!loading && products.length === 0) {
      return (
        <tr>
          <td colSpan="11" className="text-center" style={{ height: '400px', verticalAlign: 'middle' }}>
            <div style={{ color: 'var(--admin-text-secondary-dark)', fontSize: '1.1rem' }}>
              {productSearch.trim() ? 'Không tìm thấy sản phẩm nào khớp với từ khóa.' : 'Danh sách sản phẩm hiện đang trống.'}
            </div>
          </td>
        </tr>
      );
    }

    return products.map(p => {
      const isSelected = selectedProductIds.includes(p.id);
      return (
        <tr key={p.id} className={isSelected ? 'selected-row' : ''}>
          <td>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleSelectProduct(p.id);
              }} 
              style={{ background: 'none', border: 'none', color: isSelected ? 'var(--admin-accent)' : 'inherit', padding: 0, cursor: 'pointer' }}
            >
              {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
            </button>
          </td>
          <td>
            <img src={getImageUrl(p.image_url)} alt={p.name} className="table-img" />
          </td>
          <td title={p.name}>
            <div className="table-product-info">
              <strong>{p.name}</strong>
              <span>ID: {p.id}</span>
              <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>Slug: {p.slug}</span>
            </div>
          </td>
          <td>
            <span className="admin-chip small">{p.brand || '—'}</span>
          </td>
          <td>
            <span className="admin-chip small info" style={{ textTransform: 'none' }}>{p.product_condition || '—'}</span>
          </td>
          <td>
            <span className="admin-chip small success" style={{ textTransform: 'none' }}>{p.origin || '—'}</span>
          </td>
          <td title={p.category_name || 'N/A'}>{p.category_name || 'N/A'}</td>
          <td>
            <strong style={{ color: 'var(--admin-accent)', fontSize: '1.1rem' }}>{p.base_price.toLocaleString()}</strong>
            <span style={{ fontSize: '0.7rem', marginLeft: '4px', opacity: 0.8 }}>₫</span>
          </td>
          <td>
            <span className={`admin-chip small ${p.stock_quantity > 0 ? 'success' : 'danger'}`}>
              {p.stock_quantity}
            </span>
          </td>
          <td>
            <select
              className={`admin-select small ${p.is_active ? 'success' : 'danger'}`}
              style={{ 
                border: 'none',
                color: p.is_active ? 'var(--admin-success)' : 'var(--admin-danger)',
                backgroundColor: p.is_active ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 59, 48, 0.12)',
                fontWeight: '800'
              }}
              value={p.is_active ? 'true' : 'false'}
              onChange={() => handleToggleProductActive(p)}
            >
              <option value="true">Đang bán</option>
              <option value="false">Ngừng bán</option>
            </select>
          </td>
          <td>
            <div className="table-actions">
              <button 
                className="btn-variants" 
                title="Biến thể sản phẩm"
                onClick={() => handleShowVariants(p)}
              ><Diamond size={18} /></button>
              <button className="btn-edit" title="Chỉnh sửa" onClick={() => openEditProductModal(p)}><Edit size={18} /></button>
              <button 
                className="btn-delete" 
                title="Xóa sản phẩm"
                onClick={() => handleDeleteProduct(p.id)}
              ><Trash2 size={18} /></button>
            </div>
          </td>
        </tr>
      );
    });
  }, [products, selectedProductIds, loading, productSearch]);

  const [users, setUsers] = useState([]);
  const [usersPaging, setUsersPaging] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRole, setUsersRole] = useState('');
  const [usersActive, setUsersActive] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    base_price: '',
    category_id: '',
    image_url: '',
    brand: '',
    status: '',
    product_condition: '',
    origin: '',
    additional_media: '', // Thêm trường mới cho nhiều ảnh/video
    is_active: true
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    parent_id: '',
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('admin_sidebar_collapsed') === 'true');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(v => {
      const newVal = !v;
      localStorage.setItem('admin_sidebar_collapsed', String(newVal));
      return newVal;
    });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      setSelectedProduct(null);
      setShowAddModal(false);
      setShowAddCategoryModal(false);
      setVariantFormOpen(false);
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiFetch('/user/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          if (userData.role === 'CUSTOMER') {
            navigate('/home');
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchCategories();
    }
    if (activeTab === 'categories') {
      fetchCategories();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'products') return;
    fetchProducts();
  }, [activeTab, productPaging.page, productPaging.limit, productPaging.sort, productPaging.status, productPaging.brand, productPaging.product_condition, productPaging.origin, productPaging.in_stock, productPaging.category_id, debouncedSearch]);

  useEffect(() => {
    if (activeTab !== 'users') return;
    fetchUsers();
  }, [activeTab, usersPaging.page, usersPaging.limit, usersSearch, usersRole, usersActive]);

  useEffect(() => {
    if (activeTab !== 'overview') return;
    fetchOverviewStats();
  }, [activeTab]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((v) => !v);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getProducts({
        page: productPaging.page,
        limit: productPaging.limit,
        sort: productPaging.sort,
        q: debouncedSearch || undefined,
        active_only: productPaging.status === 'active' ? true : (productPaging.status === 'inactive' ? false : undefined),
        brand: productPaging.brand || undefined,
        product_condition: productPaging.product_condition || undefined,
        origin: productPaging.origin || undefined,
        in_stock: productPaging.in_stock === 'true' ? true : (productPaging.in_stock === 'false' ? false : undefined),
        category_id: productPaging.category_id || undefined
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data);
        setProductPaging((prev) => ({ ...prev, total: data.total, pages: data.pages }));
      }
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await categoriesApi.getTree();
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh mục:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await adminApi.getUsers({
        page: usersPaging.page,
        limit: usersPaging.limit,
        q: usersSearch || undefined,
        role: usersRole || undefined,
        is_active: usersActive === '' ? undefined : usersActive
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data);
        setUsersPaging((prev) => ({ ...prev, total: data.total, pages: data.pages }));
      } else {
        const error = await response.json();
        setToast({ type: 'error', message: error.detail || 'Không thể tải người dùng' });
      }
    } catch (error) {
      console.error('Lỗi khi tải người dùng:', error);
      setToast({ type: 'error', message: 'Không thể tải người dùng' });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchOverviewStats = async () => {
    try {
      const [pRes, cRes, uRes] = await Promise.all([
        productsApi.getAll({ page: 1, limit: 1, active_only: false }),
        categoriesApi.getAll({ active_only: false }),
        adminApi.getUsers({ page: 1, limit: 1 })
      ]);

      let productsTotal = 0;
      if (pRes.ok) {
        const data = await pRes.json();
        productsTotal = data.total || 0;
      }

      let categoriesTotal = 0;
      if (cRes.ok) {
        const data = await cRes.json();
        categoriesTotal = Array.isArray(data) ? data.length : 0;
      }

      let usersTotal = 0;
      if (uRes.ok) {
        const data = await uRes.json();
        usersTotal = data.total || 0;
      }

      setOverviewStats({ products: productsTotal, categories: categoriesTotal, users: usersTotal });
    } catch (error) {
      console.error('Lỗi khi tải tổng quan:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    navigate('/');
  };

  const handleDeleteProduct = async (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa sản phẩm',
      message: 'Bạn có chắc chắn muốn xóa sản phẩm này? Thao tác này sẽ xóa vĩnh viễn và không thể hoàn tác.',
      onConfirm: async () => {
        try {
          const response = await productsApi.delete(id);
          if (response.ok) {
            setToast({ type: 'success', message: 'Đã xóa sản phẩm thành công' });
            fetchProducts();
          } else {
            const error = await response.json();
            setToast({ 
              type: 'error', 
              message: error.detail || 'Không thể xóa sản phẩm. Có thể sản phẩm đang nằm trong giỏ hàng của khách.' 
            });
          }
        } catch (error) {
          console.error('Lỗi khi xóa sản phẩm:', error);
          setToast({ type: 'error', message: 'Lỗi kết nối hoặc hệ thống khi xóa sản phẩm' });
        }
      }
    });
  };

  const openCreateProductModal = () => {
    setProductModalMode('create');
    setEditingProduct(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      base_price: '',
      category_id: '',
      image_url: '',
      brand: '',
      status: '',
      product_condition: '',
      origin: '',
      additional_media: '',
      is_active: true
    });
    setShowAddModal(true);
  };

  const openEditProductModal = (p) => {
    setProductModalMode('edit');
    setEditingProduct(p);
    // Trích xuất media links từ description
    const mediaMatch = (p.description || '').match(/\[MEDIA:(.*?)\]/);
    const mediaLinks = mediaMatch ? mediaMatch[1].split(';').join('\n') : '';
    const cleanDesc = (p.description || '').replace(/\[MEDIA:.*?\]/, '').trim();

    setFormData({
      name: p.name || '',
      slug: p.slug || '',
      description: cleanDesc,
      additional_media: mediaLinks,
      base_price: String(p.base_price ?? ''),
      category_id: String(p.category_id ?? ''),
      image_url: p.image_url || '',
      brand: p.brand || '',
      status: p.status || '',
      product_condition: p.product_condition || '',
      origin: p.origin || '',
      stock_quantity: p.stock_quantity ?? 0,
      is_active: !!p.is_active
    });
    setShowAddModal(true);
  };

  const handleToggleProductActive = async (p) => {
    try {
      const response = await adminApi.updateProductStatus(p.id, { is_active: !p.is_active });
      if (response.ok) {
        setToast({ type: 'success', message: p.is_active ? 'Đã ngừng bán sản phẩm' : 'Đã cho phép bán lại' });
        fetchProducts();
      } else {
        const error = await response.json();
        setToast({ type: 'error', message: error.detail || 'Không thể cập nhật sản phẩm' });
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật sản phẩm:', error);
      setToast({ type: 'error', message: 'Không thể cập nhật sản phẩm' });
    }
  };

  const openCreateCategoryModal = () => {
    setCategoryModalMode('create');
    setEditingCategory(null);
    setCategoryFormData({ name: '', slug: '', parent_id: '', is_active: true });
    setShowAddCategoryModal(true);
  };

  const openEditCategoryModal = (cat) => {
    setCategoryModalMode('edit');
    setEditingCategory(cat);
    setCategoryFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      parent_id: cat.parent_id ? String(cat.parent_id) : '',
      is_active: !!cat.is_active
    });
    setShowAddCategoryModal(true);
  };

  const handleDeleteCategory = async (catId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa danh mục',
      message: 'Xóa danh mục sẽ ẩn danh mục này. Tiếp tục?',
      onConfirm: async () => {
        try {
          const response = await categoriesApi.delete(catId);
          if (response.ok) {
            setToast({ type: 'success', message: 'Đã xóa danh mục' });
            fetchCategories();
          } else {
            const error = await response.json();
            setToast({ type: 'error', message: error.detail || 'Không thể xóa danh mục' });
          }
        } catch (error) {
          console.error('Lỗi khi xóa danh mục:', error);
          setToast({ type: 'error', message: 'Không thể xóa danh mục' });
        }
      }
    });
  };

  const openCreateVariantForm = () => {
    setVariantFormMode('create');
    setEditingVariant(null);
    setVariantFormData({
      sku: '',
      attributes_json: '{}',
      price_override: '',
      stock_quantity: 0,
      is_active: true
    });
    setVariantFormOpen(true);
  };

  const openEditVariantForm = (v) => {
    setVariantFormMode('edit');
    setEditingVariant(v);
    setVariantFormData({
      sku: v.sku || '',
      attributes_json: JSON.stringify(v.attributes || {}, null, 2),
      price_override: v.price_override === null || v.price_override === undefined ? '' : String(v.price_override),
      stock_quantity: v.stock_quantity ?? 0,
      is_active: !!v.is_active
    });
    setVariantFormOpen(true);
  };

  const handleVariantInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVariantFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveVariant = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    let attributes;
    try {
      attributes = JSON.parse(variantFormData.attributes_json || '{}');
    } catch {
      setToast({ type: 'error', message: 'Thuộc tính phải là JSON hợp lệ' });
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
        setToast({ type: 'success', message: variantFormMode === 'create' ? 'Đã thêm biến thể' : 'Đã cập nhật biến thể' });
        setVariantFormOpen(false);
        fetchVariants(selectedProduct.id);
      } else {
        const error = await response.json();
        setToast({ type: 'error', message: error.detail || 'Không thể lưu biến thể' });
      }
    } catch (error) {
      console.error('Lỗi khi lưu biến thể:', error);
      setToast({ type: 'error', message: 'Không thể lưu biến thể' });
    }
  };

  const handleDeleteVariant = async (variantId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa biến thể',
      message: 'Bạn có chắc chắn muốn xóa biến thể này?',
      onConfirm: async () => {
        try {
          const response = await productsApi.deleteVariant(variantId);
          if (response.ok) {
            setToast({ type: 'success', message: 'Đã xóa biến thể' });
            if (selectedProduct) fetchVariants(selectedProduct.id);
          } else {
            const error = await response.json();
            setToast({ type: 'error', message: error.detail || 'Không thể xóa biến thể' });
          }
        } catch (error) {
          console.error('Lỗi khi xóa biến thể:', error);
          setToast({ type: 'error', message: 'Không thể xóa biến thể' });
        }
      }
    });
  };

  const handleUpdateUserRole = async (u, role) => {
    try {
      const response = await adminApi.updateUserRole(u.id, role);
      if (response.ok) {
        setToast({ type: 'success', message: 'Đã cập nhật quyền' });
        fetchUsers();
      } else {
        const error = await response.json();
        setToast({ type: 'error', message: error.detail || 'Không thể cập nhật quyền' });
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật quyền:', error);
      setToast({ type: 'error', message: 'Không thể cập nhật quyền' });
    }
  };

  const handleUpdateUserActive = async (u, isActive) => {
    try {
      const response = await adminApi.updateUserActive(u.id, isActive);
      if (response.ok) {
        setToast({ type: 'success', message: 'Đã cập nhật trạng thái' });
        fetchUsers();
      } else {
        const error = await response.json();
        setToast({ type: 'error', message: error.detail || 'Không thể cập nhật trạng thái' });
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      setToast({ type: 'error', message: 'Không thể cập nhật trạng thái' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (name === 'name') {
      const slug = value.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleCategoryInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (name === 'name') {
      const slug = value.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
      setCategoryFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!formData.category_id) {
      setToast({ type: 'error', message: 'Vui lòng chọn danh mục sản phẩm' });
      return;
    }
    setSubmitting(true);
    try {
      // Chuẩn bị description với media links ẩn
      let finalDescription = formData.description || '';
      
      // Xử lý image_url: Dòng đầu là ảnh chính, các dòng sau là media bổ sung
      const primaryUrlLines = (formData.image_url || '').split('\n').map(l => l.trim()).filter(l => l);
      const mainImageUrl = primaryUrlLines[0] || null;
      const extraFromPrimary = primaryUrlLines.slice(1);
      
      const additionalLines = (formData.additional_media || '').split('\n').map(l => l.trim()).filter(l => l);
      
      // Gộp tất cả media bổ sung (từ primary textarea dòng 2+ và từ additional_media textarea)
      const allExtraMedia = [...extraFromPrimary, ...additionalLines];
      
      if (allExtraMedia.length > 0) {
        const links = allExtraMedia.join(';');
        if (links) {
          // Xóa tag MEDIA cũ nếu có để tránh trùng lặp
          finalDescription = finalDescription.replace(/\[MEDIA:.*?\]/, '');
          finalDescription += `\n\n[MEDIA:${links}]`;
        }
      }

      const payloadBase = {
        name: formData.name,
        slug: formData.slug,
        description: finalDescription || null,
        base_price: parseFloat(formData.base_price),
        category_id: parseInt(formData.category_id),
        image_url: mainImageUrl,
        brand: formData.brand || null,
        status: formData.status || null,
        product_condition: formData.product_condition || null,
        origin: formData.origin || null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        is_active: !!formData.is_active
      };

      const response = productModalMode === 'create'
        ? await productsApi.create({ ...payloadBase, seller_id: user.id })
        : await productsApi.update(editingProduct.id, payloadBase);

      if (response.ok) {
        setToast({ type: 'success', message: productModalMode === 'create' ? 'Đã thêm sản phẩm' : 'Đã cập nhật sản phẩm' });
        setShowAddModal(false);
        setEditingProduct(null);
        setProductModalMode('create');
        setFormData({ name: '', slug: '', description: '', additional_media: '', base_price: '', category_id: '', image_url: '', brand: '', status: '', stock_quantity: 0, is_active: true });
        fetchProducts();
      } else {
        let errorMessage = 'Không thể lưu sản phẩm';
        try {
          const error = await response.json();
          errorMessage = error.detail || errorMessage;
        } catch {
          errorMessage = `Lỗi hệ thống (${response.status})`;
        }
        setToast({ type: 'error', message: errorMessage });
      }
    } catch (error) {
      console.error('Lỗi khi thêm sản phẩm:', error);
      setToast({ type: 'error', message: 'Lỗi kết nối hoặc xử lý dữ liệu' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...categoryFormData,
        parent_id: categoryFormData.parent_id ? parseInt(categoryFormData.parent_id) : null
      };

      const response = categoryModalMode === 'create'
        ? await categoriesApi.create(payload)
        : await categoriesApi.update(editingCategory.id, payload);

      if (response.ok) {
        setToast({ type: 'success', message: categoryModalMode === 'create' ? 'Đã thêm danh mục' : 'Đã cập nhật danh mục' });
        setShowAddCategoryModal(false);
        setEditingCategory(null);
        setCategoryModalMode('create');
        setCategoryFormData({ name: '', slug: '', parent_id: '', is_active: true });
        fetchCategories();
      } else {
        const error = await response.json();
        setToast({ type: 'error', message: error.detail || 'Không thể lưu danh mục' });
      }
    } catch (error) {
      console.error('Lỗi khi thêm danh mục:', error);
      setToast({ type: 'error', message: 'Đã có lỗi xảy ra' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return <div className="loading-container"><div className="loader"></div></div>;

  const flattenCategoryOptions = (nodes, depth = 0) => {
    const out = [];
    nodes.forEach((n) => {
      out.push({ id: n.id, name: n.name, depth });
      if (n.children && n.children.length) {
        out.push(...flattenCategoryOptions(n.children, depth + 1));
      }
    });
    return out;
  };

  const categoryOptions = flattenCategoryOptions(categories);

  const visibleCategories = categories.filter((cat) => {
    if (!categorySearch.trim()) return true;
    const term = categorySearch.trim().toLowerCase();
    const rootMatch = (cat.name || '').toLowerCase().includes(term);
    const childMatch = (cat.children || []).some(c => (c.name || '').toLowerCase().includes(term));
    return rootMatch || childMatch;
  });

  return (
    <div className="admin-dashboard">
      <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-logo-section">
          <img src="/hero.png" alt="PC SHOP" className="admin-logo" />
          <div className="admin-logo-text">
            <span>PC SHOP</span>
            <strong>QUẢN TRỊ VIÊN</strong>
          </div>
        </div>

        <nav className="admin-nav">
          <button 
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="nav-icon"><BarChart2 size={20} /></span>
            <span>Tổng quan</span>
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <span className="nav-icon"><Package size={20} /></span>
            <span>Kho hàng</span>
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <span className="nav-icon"><Folder size={20} /></span>
            <span>Danh mục</span>
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon"><Users size={20} /></span>
            <span>Người dùng</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-card">
            <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <strong>{user.username}</strong>
              <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{user.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="admin-logout-btn">
            <span className="nav-icon"><Unlock size={18} /></span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className={`admin-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
        <header className="admin-header-sticky animate-fade-in">
          <div className="header-info">
            <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
              <Menu size={20} />
            </button>
            <div>
              <h1>{activeTab === 'overview' ? 'Bảng điều khiển' : 
                   activeTab === 'products' ? 'Quản lý kho hàng' : 
                   activeTab === 'categories' ? 'Cấu trúc danh mục' : 'Người dùng & Quyền'}</h1>
              <p>Hệ thống quản lý PC Shop - Apple Design Style</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="admin-theme-toggle" onClick={toggleTheme}>
              {isDarkMode ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            <button className="btn-view-shop" onClick={() => navigate('/home')}>
              <Eye size={18} /> Xem cửa hàng
            </button>
          </div>
        </header>

        <div className="admin-content animate-fade-in">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="stats-grid">
                <div className="admin-stat-card">
                  <div className="stat-icon products-icon"><Package size={28} /></div>
                  <div className="stat-info">
                    <h3>Sản phẩm</h3>
                    <p>{overviewStats.products.toLocaleString()}</p>
                    <span className="stat-trend up">Sẵn sàng bán</span>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="stat-icon users-icon"><Users size={28} /></div>
                  <div className="stat-info">
                    <h3>Khách hàng</h3>
                    <p>{overviewStats.users.toLocaleString()}</p>
                    <span className="stat-trend up">Thành viên hệ thống</span>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="stat-icon orders-icon"><Folder size={28} /></div>
                  <div className="stat-info">
                    <h3>Danh mục</h3>
                    <p>{overviewStats.categories.toLocaleString()}</p>
                    <span className="stat-trend up">Đã phân loại</span>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="stat-icon revenue-icon"><DollarSign size={28} /></div>
                  <div className="stat-info">
                    <h3>Ước tính</h3>
                    <p>—</p>
                    <span className="stat-trend" style={{ background: 'rgba(255,255,255,0.05)' }}>Chưa kích hoạt</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel animate-fade-in" style={{ padding: '40px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>Hoạt động hệ thống</h2>
                <div className="activity-list" style={{ background: 'transparent', padding: 0 }}>
                  <div className="cat-node-content" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="stat-icon products-icon" style={{ width: '40px', height: '40px', fontSize: '1rem' }}><Package size={18} /></div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block' }}>Cập nhật kho hàng</strong>
                      <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Sản phẩm "MacBook Pro M3" vừa được cập nhật số lượng tồn kho.</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>10 phút trước</span>
                  </div>
                  <div className="cat-node-content" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="stat-icon users-icon" style={{ width: '40px', height: '40px', fontSize: '1rem' }}><Users size={18} /></div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block' }}>Người dùng mới</strong>
                      <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Một tài khoản khách hàng mới vừa đăng ký thành công.</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>1 giờ trước</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="management-tab">
              {/* Ô cấu hình to, hiện đại */}
              <div className="admin-config-section glass-panel animate-fade-in">
                <div className="config-header">
                  <div className="config-title">
                    <div className="config-icon-box">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3>Cấu hình Danh mục & Hãng</h3>
                      <p>Quản lý các tùy chọn nhanh cho sản phẩm (Hãng, Trạng thái, Loại hàng, Nguồn gốc)</p>
                    </div>
                  </div>
                  <button 
                    className="btn-view-shop" 
                    onClick={() => {
                      setShowConfigPanel(!showConfigPanel);
                      if (!showConfigPanel) setTempConfig(configData);
                    }}
                  >
                    {showConfigPanel ? 'Đóng cấu hình' : 'Mở bảng điều khiển'}
                  </button>
                </div>

                {showConfigPanel && (
                  <div className="config-grid animate-fade-in">
                    <div className="form-group">
                      <label><Diamond size={14} /> Hãng sản xuất</label>
                      <textarea
                        value={tempConfig.brands}
                        onChange={(e) => setTempConfig(prev => ({ ...prev, brands: e.target.value }))}
                        placeholder="ASUS&#10;MSI..."
                        rows="6"
                      />
                    </div>
                    <div className="form-group">
                      <label><CheckSquare size={14} /> Trạng thái kinh doanh</label>
                      <textarea
                        value={tempConfig.statuses}
                        onChange={(e) => setTempConfig(prev => ({ ...prev, statuses: e.target.value }))}
                        placeholder="Đang kinh doanh..."
                        rows="6"
                      />
                    </div>
                    <div className="form-group">
                      <label><Package size={14} /> Loại hàng (Mới/Cũ)</label>
                      <textarea
                        value={tempConfig.conditions}
                        onChange={(e) => setTempConfig(prev => ({ ...prev, conditions: e.target.value }))}
                        placeholder="Mới 100%&#10;Cũ..."
                        rows="6"
                      />
                    </div>
                    <div className="form-group">
                      <label><Users size={14} /> Nguồn gốc / Bảo hành</label>
                      <textarea
                        value={tempConfig.origins}
                        onChange={(e) => setTempConfig(prev => ({ ...prev, origins: e.target.value }))}
                        placeholder="Chính hãng&#10;Xách tay..."
                        rows="6"
                      />
                    </div>
                    <div className="modal-footer" style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
                      <button className="btn-page" style={{ marginRight: 'auto' }} onClick={resetConfigToDefault}>Mặc định</button>
                      <button className="btn-cancel" onClick={() => setShowConfigPanel(false)}>Hủy</button>
                      <button className="btn-add-new" onClick={handleSaveConfig}>Lưu cấu hình hệ thống</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="table-header-container">
                <div className="table-top-actions">
                  <div className="search-box glass-panel">
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo tên, hãng hoặc ID sản phẩm..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setProductPaging((prev) => ({ ...prev, page: 1 }));
                      }}
                    />
                  </div>
                  <div className="header-button-group" style={{ display: 'flex', gap: '12px' }}>
                    <button
                      className="btn-view-shop"
                      onClick={handleExportCSV}
                      title="Xuất dữ liệu Excel"
                    >
                      <Download size={18} /> <span>Xuất Excel</span>
                    </button>
                    <button
                      className="btn-add-new"
                      onClick={openCreateProductModal}
                    >
                      + Thêm sản phẩm mới
                    </button>
                  </div>
                </div>

                <div className={`bulk-actions-wrapper ${selectedProductIds.length > 0 ? 'active' : ''}`}>
                  <div className="bulk-actions-toolbar glass-panel animate-fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>{selectedProductIds.length}</div>
                      <strong style={{ fontSize: '1rem' }}>Sản phẩm đã chọn</strong>
                      <div style={{ height: '24px', width: '1px', background: 'var(--admin-border-dark)' }}></div>
                      <button className="btn-page" style={{ padding: '6px 16px', fontSize: '0.8rem' }} onClick={() => handleBulkToggleStatus(true)}>Hiện tất cả</button>
                      <button className="btn-page" style={{ padding: '6px 16px', fontSize: '0.8rem' }} onClick={() => handleBulkToggleStatus(false)}>Ẩn tất cả</button>
                    </div>
                    <button className="btn-logout-btn" style={{ padding: '8px 20px', fontSize: '0.85rem' }} onClick={handleBulkDelete}>Xóa vĩnh viễn {selectedProductIds.length} mục</button>
                  </div>
                </div>

                <div className="table-filters glass-panel">
                  <div className="admin-toolbar">
                    <select
                      className="admin-select"
                      value={productPaging.category_id || ''}
                      onChange={(e) => setProductPaging((prev) => ({ ...prev, category_id: e.target.value, page: 1 }))}
                    >
                      <option value="">Tất cả danh mục</option>
                      {categoryOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {`${'—'.repeat(c.depth)} ${c.name}`.trim()}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      className="admin-select"
                      value={productPaging.brand || ''}
                      onChange={(e) => setProductPaging((prev) => ({ ...prev, brand: e.target.value, page: 1 }))}
                    >
                      <option value="">Hãng sản xuất</option>
                      {brandsList.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>

                    <select
                      className="admin-select"
                      value={productPaging.product_condition || ''}
                      onChange={(e) => setProductPaging((prev) => ({ ...prev, product_condition: e.target.value, page: 1 }))}
                    >
                      <option value="">Loại hàng</option>
                      {conditionsList.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    <select
                      className="admin-select"
                      value={productPaging.in_stock || ''}
                      onChange={(e) => setProductPaging((prev) => ({ ...prev, in_stock: e.target.value, page: 1 }))}
                    >
                      <option value="">Tồn kho</option>
                      <option value="true">Còn hàng</option>
                      <option value="false">Hết hàng</option>
                    </select>

                    <select
                      className="admin-select"
                      value={productPaging.sort}
                      onChange={(e) => setProductPaging((prev) => ({ ...prev, sort: e.target.value, page: 1 }))}
                    >
                      <option value="newest">Mới nhất</option>
                      <option value="price_asc">Giá tăng</option>
                      <option value="price_desc">Giá giảm</option>
                    </select>
                  </div>
                  
                  <div className="admin-chips">
                    <span className="admin-chip info">Tổng {productPaging.total} sản phẩm</span>
                    <span className="admin-chip">Trang {productPaging.page}/{productPaging.pages}</span>
                  </div>
                </div>
              </div>

              <div className={`admin-table-container glass-panel ${loading ? 'table-loading' : ''}`}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>
                        <button onClick={toggleSelectAll} style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer' }}>
                          {selectedProductIds.length === products.length && products.length > 0 ? <CheckSquare size={20} color="var(--admin-accent)" /> : <Square size={20} />}
                        </button>
                      </th>
                      <th style={{ width: '100px' }}>Ảnh</th>
                      <th>Thông tin sản phẩm</th>
                      <th style={{ width: '140px' }}>Hãng</th>
                      <th style={{ width: '180px' }}>Loại hàng</th>
                      <th style={{ width: '180px' }}>Nguồn gốc</th>
                      <th style={{ width: '220px' }}>Danh mục</th>
                      <th style={{ width: '180px' }}>Giá cơ bản</th>
                      <th style={{ width: '100px' }}>Kho</th>
                      <th style={{ width: '150px' }}>Trạng thái</th>
                      <th style={{ width: '180px' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productTableRows}
                  </tbody>
                </table>
              </div>

              <div className="admin-pagination">
                <button
                  className="btn-page"
                  disabled={productPaging.page <= 1 || loading}
                  onClick={() => setProductPaging((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                >
                  ← Trước
                </button>
                <div className="admin-chips">
                   <span className="admin-chip">Trang <strong>{productPaging.page}</strong> / {productPaging.pages}</span>
                </div>
                <button
                  className="btn-page"
                  disabled={productPaging.page >= productPaging.pages || loading}
                  onClick={() => setProductPaging((prev) => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                >
                  Sau →
                </button>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="management-tab">
              <div className="table-header-container">
                <div className="table-top-actions">
                  <div className="search-box glass-panel">
                    <input
                      type="text"
                      placeholder="Tìm kiếm danh mục nhanh..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn-add-new"
                    onClick={openCreateCategoryModal}
                  >
                    + Thêm danh mục mới
                  </button>
                </div>
              </div>

              <div className="glass-panel animate-fade-in" style={{ padding: '40px' }}>
                {loading ? (
                  <div className="text-center" style={{ padding: '60px' }}>
                    <div className="loader" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '20px', color: 'var(--admin-text-secondary-dark)' }}>Đang tải cấu trúc danh mục...</p>
                  </div>
                ) : visibleCategories.length > 0 ? (
                  <div className="cat-tree">
                    {visibleCategories.map(cat => (
                      <div key={cat.id} className="cat-node">
                        <div className="cat-node-content">
                          <div className="config-icon-box" style={{ width: '40px', height: '40px', background: 'rgba(0,113,227,0.1)', color: 'var(--admin-accent)', boxShadow: 'none' }}>
                            <Folder size={20} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: '1.1rem' }}>{cat.name}</strong>
                            <span style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block' }}>Slug: {cat.slug} | ID: {cat.id}</span>
                          </div>
                          <div className="table-actions">
                            <button className="btn-edit" onClick={() => openEditCategoryModal(cat)}><Edit size={16} /></button>
                            <button className="btn-delete" onClick={() => handleDeleteCategory(cat.id)}><Trash2 size={16} /></button>
                          </div>
                        </div>
                        {cat.children && cat.children.length > 0 && (
                          <div className="cat-children" style={{ marginLeft: '60px', borderLeft: '2px solid var(--admin-border-dark)', paddingLeft: '24px' }}>
                            {cat.children
                              .filter((sub) => {
                                if (!categorySearch.trim()) return true;
                                return (sub.name || '').toLowerCase().includes(categorySearch.trim().toLowerCase());
                              })
                              .map(sub => (
                              <div key={sub.id} className="cat-node sub">
                                <div className="cat-node-content" style={{ padding: '12px 20px', borderRadius: '16px' }}>
                                  <FileText size={16} style={{ color: 'var(--admin-text-secondary-dark)' }} />
                                  <div style={{ flex: 1 }}>
                                    <span style={{ fontWeight: 600 }}>{sub.name}</span>
                                  </div>
                                  <div className="table-actions">
                                    <button className="btn-edit" style={{ width: '32px', height: '32px' }} onClick={() => openEditCategoryModal(sub)}><Edit size={14} /></button>
                                    <button className="btn-delete" style={{ width: '32px', height: '32px' }} onClick={() => handleDeleteCategory(sub.id)}><Trash2 size={14} /></button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center" style={{ padding: '100px' }}>
                    <Folder size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
                    <p style={{ color: 'var(--admin-text-secondary-dark)' }}>
                      {categorySearch.trim() ? 'Không tìm thấy danh mục nào phù hợp.' : 'Hệ thống chưa có danh mục nào.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="management-tab">
              <div className="table-header-container">
                <div className="table-top-actions">
                  <div className="search-box glass-panel">
                    <input
                      type="text"
                      placeholder="Tìm kiếm người dùng, email..."
                      value={usersSearch}
                      onChange={(e) => {
                        setUsersSearch(e.target.value);
                        setUsersPaging((prev) => ({ ...prev, page: 1 }));
                      }}
                    />
                  </div>
                  <div className="table-actions-right">
                    <div className="admin-toolbar">
                      <select
                        className="admin-select"
                        value={usersRole}
                        onChange={(e) => {
                          setUsersRole(e.target.value);
                          setUsersPaging((prev) => ({ ...prev, page: 1 }));
                        }}
                      >
                        <option value="">Tất cả quyền</option>
                        <option value="CUSTOMER">Khách hàng</option>
                        <option value="SELLER">Người bán</option>
                        <option value="ADMIN">Quản trị viên</option>
                      </select>
                      <select
                        className="admin-select"
                        value={usersActive}
                        onChange={(e) => {
                          setUsersActive(e.target.value);
                          setUsersPaging((prev) => ({ ...prev, page: 1 }));
                        }}
                      >
                        <option value="">Trạng thái</option>
                        <option value="true">Đang hoạt động</option>
                        <option value="false">Đã bị khóa</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-table-container glass-panel">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>ID</th>
                      <th>Thông tin thành viên</th>
                      <th>Email liên hệ</th>
                      <th style={{ width: '200px' }}>Quyền truy cập</th>
                      <th style={{ width: '180px' }}>Trạng thái</th>
                      <th style={{ width: '120px' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsers ? (
                      <tr><td colSpan="6" className="text-center" style={{ height: '300px' }}><div className="loader" style={{ margin: '0 auto' }}></div></td></tr>
                    ) : users.length > 0 ? (
                      users.map((u) => (
                        <tr key={u.id}>
                          <td><strong>{u.id}</strong></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div className="user-avatar" style={{ width: '36px', height: '36px', fontSize: '0.8rem' }}>{u.username.charAt(0).toUpperCase()}</div>
                              <strong>{u.username}</strong>
                            </div>
                          </td>
                          <td>{u.email}</td>
                          <td>
                            <select
                              className={`admin-select small ${u.role === 'ADMIN' ? 'info' : ''}`}
                              style={{ height: '32px', padding: '0 28px 0 12px', width: '100%', fontSize: '0.8rem' }}
                              value={u.role}
                              disabled={u.id === user.id}
                              onChange={(e) => handleUpdateUserRole(u, e.target.value)}
                            >
                              <option value="CUSTOMER">Khách hàng</option>
                              <option value="SELLER">Người bán</option>
                              <option value="ADMIN">Quản trị viên</option>
                            </select>
                          </td>
                          <td>
                            <span className={`status-tag ${u.is_active ? 'active' : 'inactive'}`}>
                              {u.is_active ? 'Đang hoạt động' : 'Tài khoản bị khóa'}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn-toggle"
                                disabled={u.id === user.id}
                                title={u.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                onClick={() => handleUpdateUserActive(u, !u.is_active)}
                              >
                                {u.is_active ? <Lock size={18} /> : <Unlock size={18} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center" style={{ height: '300px' }}>
                          <Users size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
                          <p style={{ color: 'var(--admin-text-secondary-dark)' }}>Không tìm thấy thành viên nào.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="admin-pagination">
                <button
                  className="btn-page"
                  disabled={usersPaging.page <= 1 || loadingUsers}
                  onClick={() => setUsersPaging((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                >
                  ← Trước
                </button>
                <div className="admin-chips">
                   <span className="admin-chip">Trang <strong>{usersPaging.page}</strong> / {usersPaging.pages}</span>
                </div>
                <button
                  className="btn-page"
                  disabled={usersPaging.page >= usersPaging.pages || loadingUsers}
                  onClick={() => setUsersPaging((prev) => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {confirmDialog.isOpen && (
        <div className="admin-modal-overlay" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} style={{ zIndex: 9999 }}>
          <div className="admin-modal glass-panel animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', margin: 'auto' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '8px' }}>
              <h3>{confirmDialog.title}</h3>
              <button className="btn-close" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}><X size={20} /></button>
            </div>
            <div className="modal-content" style={{ paddingTop: '0', paddingBottom: '24px' }}>
              <p style={{ color: 'var(--admin-text-secondary-dark)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '0' }}>{confirmDialog.message}</p>
            </div>
            <div className="modal-footer" style={{ borderTop: 'none', paddingTop: '0', paddingBottom: '32px', justifyContent: 'center', gap: '16px' }}>
              <button className="btn-cancel" style={{ padding: '12px 32px' }} onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>Hủy bỏ</button>
              <button className="btn-logout-btn" style={{ padding: '12px 32px', background: 'var(--admin-danger)', color: 'white', border: 'none' }} onClick={() => {
                if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
              }}>Xác nhận xóa</button>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="admin-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="admin-modal glass-panel animate-fade-in" style={{ maxWidth: '1000px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="config-title">
                <div className="config-icon-box" style={{ width: '40px', height: '40px' }}><Diamond size={20} /></div>
                <div>
                  <h3>Biến thể: {selectedProduct.name}</h3>
                  <p>Quản lý các phiên bản khác nhau của sản phẩm này</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => setSelectedProduct(null)}><X size={20} /></button>
            </div>
            <div className="modal-content">
              <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-add-new" onClick={openCreateVariantForm}>+ Thêm biến thể mới</button>
              </div>

              {variantFormOpen && (
                <form className="glass-panel animate-fade-in" style={{ padding: '32px', marginBottom: '32px', border: '1px solid var(--admin-accent)' }} onSubmit={handleSaveVariant}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Mã định danh (SKU)</label>
                      <input name="sku" value={variantFormData.sku} onChange={handleVariantInputChange} placeholder="Ví dụ: SKU-MAC-M3-16GB" required />
                    </div>
                    <div className="form-group">
                      <label>Giá cộng thêm (VNĐ)</label>
                      <input name="price_override" type="number" value={variantFormData.price_override} onChange={handleVariantInputChange} placeholder="Ví dụ: 2000000" />
                    </div>
                    <div className="form-group">
                      <label>Số lượng trong kho</label>
                      <input name="stock_quantity" type="number" value={variantFormData.stock_quantity} onChange={handleVariantInputChange} />
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input name="is_active" type="checkbox" style={{ width: '20px', height: '20px' }} checked={variantFormData.is_active} onChange={handleVariantInputChange} />
                      <label style={{ margin: 0 }}>Cho phép kinh doanh biến thể này</label>
                    </div>
                    <div className="form-group full-width">
                      <label>Cấu hình thuộc tính (Định dạng JSON)</label>
                      <textarea
                        name="attributes_json"
                        rows="4"
                        value={variantFormData.attributes_json}
                        onChange={handleVariantInputChange}
                        placeholder='Ví dụ: {"ram": "16GB", "ssd": "512GB", "color": "Silver"}'
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer" style={{ borderTop: 'none', padding: '24px 0 0' }}>
                    <button type="button" className="btn-cancel" onClick={() => setVariantFormOpen(false)}>Hủy bỏ</button>
                    <button type="submit" className="btn-add-new" disabled={submitting}>
                      {variantFormMode === 'create' ? 'Lưu biến thể' : 'Cập nhật biến thể'}
                    </button>
                  </div>
                </form>
              )}

              {loadingVariants ? (
                <div className="text-center" style={{ padding: '40px' }}><div className="loader" style={{ margin: '0 auto' }}></div></div>
              ) : variants.length > 0 ? (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: '200px' }}>Mã SKU</th>
                        <th>Cấu hình thuộc tính</th>
                        <th style={{ width: '180px' }}>Giá cộng thêm</th>
                        <th style={{ width: '100px' }}>Kho</th>
                        <th style={{ width: '150px' }}>Trạng thái</th>
                        <th style={{ width: '120px' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map(v => (
                        <tr key={v.id}>
                          <td><strong>{v.sku}</strong></td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {Object.entries(v.attributes || {}).map(([key, value]) => (
                                <span key={key} className="admin-chip small info" style={{ textTransform: 'none' }}>{key}: {String(value)}</span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--admin-accent)' }}>
                              {v.price_override === null || v.price_override === undefined ? '0' : `+${Number(v.price_override).toLocaleString()}`}
                            </strong>
                            <span style={{ fontSize: '0.7rem', marginLeft: '4px' }}>₫</span>
                          </td>
                          <td><span className="admin-chip small">{v.stock_quantity}</span></td>
                          <td>
                            <span className={`admin-chip small ${v.is_active ? 'success' : 'danger'}`}>
                              {v.is_active ? 'Hoạt động' : 'Đã ẩn'}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button className="btn-edit" onClick={() => openEditVariantForm(v)}><Edit size={16} /></button>
                              <button className="btn-delete" onClick={() => handleDeleteVariant(v.id)}><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center" style={{ padding: '60px', opacity: 0.5 }}>
                   <Diamond size={48} style={{ marginBottom: '16px' }} />
                   <p>Sản phẩm này chưa có biến thể nào được tạo.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="admin-modal-overlay" onClick={() => { setShowAddModal(false); setEditingProduct(null); setProductModalMode('create'); }}>
          <div className="admin-modal glass-panel animate-fade-in" style={{ maxWidth: '950px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="config-title">
                <div className="config-icon-box" style={{ width: '40px', height: '40px' }}><Package size={20} /></div>
                <div>
                  <h3>{productModalMode === 'create' ? 'Tạo sản phẩm mới' : 'Cập nhật thông tin sản phẩm'}</h3>
                  <p>Điền đầy đủ các thông tin kỹ thuật bên dưới</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => { setShowAddModal(false); setEditingProduct(null); setProductModalMode('create'); }}><X size={20} /></button>
            </div>
            <form className="modal-content" onSubmit={handleCreateProduct}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên sản phẩm</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: Apple MacBook Pro M3 Max..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Đường dẫn tĩnh (Slug)</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="macbook-pro-m3-max"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Giá niêm yết (VNĐ)</label>
                  <input
                    type="number"
                    name="base_price"
                    value={formData.base_price}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 45000000"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tổng tồn kho</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 100"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phân loại danh mục</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categoryOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {`${'—'.repeat(c.depth)} ${c.name}`.trim()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Thương hiệu (Hãng)</label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                  >
                    <option value="">-- Chọn hãng --</option>
                    {brandsList.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tình trạng KD</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="">-- Chọn trạng thái --</option>
                    {statusesList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Độ mới (Condition)</label>
                  <select
                    name="product_condition"
                    value={formData.product_condition}
                    onChange={handleInputChange}
                  >
                    <option value="">-- Chọn loại hàng --</option>
                    {conditionsList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Nguồn gốc / Bảo hành</label>
                  <select
                    name="origin"
                    value={formData.origin}
                    onChange={handleInputChange}
                  >
                    <option value="">-- Chọn nguồn gốc --</option>
                    {originsList.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Hình ảnh chính (URL hoặc Drive ID)</label>
                  <input
                    type="text"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="Dán ID Google Drive hoặc link ảnh trực tiếp..."
                  />
                  {formData.image_url && (
                    <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <img src={getImageUrl(formData.image_url)} alt="Preview" style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }} />
                      <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>Bản xem trước hình ảnh chính</span>
                    </div>
                  )}
                </div>
                <div className="form-group full-width">
                  <label>Mô tả chi tiết sản phẩm</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Thông số kỹ thuật, đặc điểm nổi bật..."
                    rows="4"
                  ></textarea>
                </div>
                <div className="form-group full-width">
                  <label>Thư viện phương tiện bổ sung (Mỗi link một dòng)</label>
                  <textarea
                    name="additional_media"
                    value={formData.additional_media}
                    onChange={handleInputChange}
                    placeholder="Dán link ảnh hoặc video bổ sung tại đây..."
                    rows="4"
                  ></textarea>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    style={{ width: '20px', height: '20px' }}
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  <label style={{ margin: 0 }}>Hiển thị và cho phép đặt hàng ngay</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => { setShowAddModal(false); setEditingProduct(null); setProductModalMode('create'); }}>Hủy bỏ</button>
                <button type="submit" className="btn-add-new" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : (productModalMode === 'create' ? 'Tạo sản phẩm' : 'Lưu thay đổi')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddCategoryModal && (
        <div className="admin-modal-overlay" onClick={() => { setShowAddCategoryModal(false); setEditingCategory(null); setCategoryModalMode('create'); }}>
          <div className="admin-modal glass-panel animate-fade-in" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="config-title">
                <div className="config-icon-box" style={{ width: '40px', height: '40px' }}><Folder size={20} /></div>
                <div>
                  <h3>{categoryModalMode === 'create' ? 'Tạo danh mục mới' : 'Sửa danh mục'}</h3>
                  <p>Quản lý phân cấp cây danh mục sản phẩm</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => { setShowAddCategoryModal(false); setEditingCategory(null); setCategoryModalMode('create'); }}><X size={20} /></button>
            </div>
            <form className="modal-content" onSubmit={handleCreateCategory}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label>Tên danh mục</label>
                  <input
                    type="text"
                    name="name"
                    value={categoryFormData.name}
                    onChange={handleCategoryInputChange}
                    placeholder="Ví dụ: Phụ kiện Gaming"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Đường dẫn tĩnh (Slug)</label>
                  <input
                    type="text"
                    name="slug"
                    value={categoryFormData.slug}
                    onChange={handleCategoryInputChange}
                    placeholder="phu-kien-gaming"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Danh mục cha (Cấp trên)</label>
                  <select
                    name="parent_id"
                    value={categoryFormData.parent_id}
                    onChange={handleCategoryInputChange}
                  >
                    <option value="">-- Là danh mục gốc --</option>
                    {categoryOptions
                      .filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {`${'—'.repeat(c.depth)} ${c.name}`.trim()}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    style={{ width: '20px', height: '20px' }}
                    checked={categoryFormData.is_active}
                    onChange={handleCategoryInputChange}
                  />
                  <label style={{ margin: 0 }}>Kích hoạt danh mục này</label>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: '24px' }}>
                <button type="button" className="btn-cancel" onClick={() => { setShowAddCategoryModal(false); setEditingCategory(null); setCategoryModalMode('create'); }}>Hủy bỏ</button>
                <button type="submit" className="btn-add-new" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : (categoryModalMode === 'create' ? 'Tạo danh mục' : 'Lưu thay đổi')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
