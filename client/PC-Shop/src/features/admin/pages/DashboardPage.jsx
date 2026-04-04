import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, productsApi, categoriesApi, adminApi, getImageUrl } from '../../../utils/api';
import { BarChart2, Package, Folder, Users, Eye, EyeOff, Edit, Trash2, Diamond, Lock, Unlock, FileText, DollarSign, Download, CheckSquare, Square } from 'lucide-react';
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
      message: `Bạn có chắc chắn muốn xóa ${selectedProductIds.length} sản phẩm đã chọn?`,
      onConfirm: async () => {
        try {
          // Xóa từng cái (Backend chưa có bulk delete endpoint chuyên dụng)
          await Promise.all(selectedProductIds.map(id => productsApi.delete(id)));
          setToast({ type: 'success', message: `Đã xóa ${selectedProductIds.length} sản phẩm` });
          setSelectedProductIds([]);
          fetchProducts();
        } catch (error) {
          console.error('Lỗi khi xóa hàng loạt:', error);
          setToast({ type: 'error', message: 'Có lỗi khi xóa một số sản phẩm' });
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

  const brandsList = configData.brands.split('\n').map(b => b.trim()).filter(b => b);
  const statusesList = configData.statuses.split('\n').map(s => s.trim()).filter(s => s);
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
      message: 'Bạn có chắc chắn muốn xóa sản phẩm này?',
      onConfirm: async () => {
        try {
          const response = await productsApi.delete(id);
          if (response.ok) {
            setToast({ type: 'success', message: 'Đã xóa sản phẩm' });
            fetchProducts();
          }
        } catch (error) {
          console.error('Lỗi khi xóa sản phẩm:', error);
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
        } catch (e) {
          // Trường hợp không phải JSON (VD: 500 HTML page)
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
      <aside className={`admin-sidebar glass-panel ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-logo-section">
          <img src="/hero.png" alt="PC SHOP" className="admin-logo" />
          <div className="admin-logo-text">
            <span>PC SHOP</span>
            <strong>ADMIN PORTAL</strong>
          </div>
        </div>

        <nav className="admin-nav">
          <button 
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            title={isSidebarCollapsed ? 'Tổng quan' : ''}
          >
            <span className="nav-icon"><BarChart2 size={18} /></span>
            <span>Tổng quan</span>
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
            title={isSidebarCollapsed ? 'Quản lý sản phẩm' : ''}
          >
            <span className="nav-icon"><Package size={18} /></span>
            <span>Quản lý sản phẩm</span>
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
            title={isSidebarCollapsed ? 'Danh mục hệ thống' : ''}
          >
            <span className="nav-icon"><Folder size={18} /></span>
            <span>Danh mục hệ thống</span>
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            title={isSidebarCollapsed ? 'Người dùng & Seller' : ''}
          >
            <span className="nav-icon"><Users size={18} /></span>
            <span>Người dùng & Seller</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-card glass-panel">
            <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <strong>{user.username}</strong>
              <span>{user.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="admin-logout-btn">
            <span className="nav-icon"><Unlock size={16} /></span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className={`admin-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
        <header className="admin-header admin-header-sticky animate-fade-in">
          <div className="header-info" style={{ display: 'flex', alignItems: 'center' }}>
            <button className="sidebar-toggle-btn" onClick={toggleSidebar} title={isSidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}>
              {isSidebarCollapsed ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
            <div>
              <h1>{activeTab === 'overview' ? 'Bảng điều khiển' : 
                   activeTab === 'products' ? 'Quản lý kho hàng' : 
                   activeTab === 'categories' ? 'Cấu trúc danh mục' : 'Quản trị hệ thống'}</h1>
              <p>Chào mừng trở lại, {user.username}!</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="admin-theme-toggle" onClick={toggleTheme} title="Đổi giao diện Sáng/Tối">
              {isDarkMode ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            <button className="btn-view-shop" onClick={() => navigate('/home')}>
              <span><Eye size={16} /></span> Xem shop
            </button>
          </div>
        </header>

        <div className="admin-content animate-fade-in">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="stats-grid">
                <div className="admin-stat-card glass-panel">
                  <div className="stat-icon products-icon"><Package size={24} /></div>
                  <div className="stat-info">
                    <h3>Sản phẩm</h3>
                    <p>{overviewStats.products.toLocaleString()}</p>
                    <span className="stat-trend up">Tổng sản phẩm</span>
                  </div>
                </div>
                <div className="admin-stat-card glass-panel">
                  <div className="stat-icon users-icon"><Users size={24} /></div>
                  <div className="stat-info">
                    <h3>Người dùng</h3>
                    <p>{overviewStats.users.toLocaleString()}</p>
                    <span className="stat-trend up">Tổng người dùng</span>
                  </div>
                </div>
                <div className="admin-stat-card glass-panel">
                  <div className="stat-icon orders-icon"><Folder size={24} /></div>
                  <div className="stat-info">
                    <h3>Danh mục</h3>
                    <p>{overviewStats.categories.toLocaleString()}</p>
                    <span className="stat-trend up">Tổng danh mục</span>
                  </div>
                </div>
                <div className="admin-stat-card glass-panel">
                  <div className="stat-icon revenue-icon"><DollarSign size={24} /></div>
                  <div className="stat-info">
                    <h3>Doanh thu</h3>
                    <p>—</p>
                    <span className="stat-trend">Chưa tích hợp</span>
                  </div>
                </div>
              </div>

              <div className="recent-activity-section glass-panel">
                <h2>Hoạt động gần đây</h2>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-indicator add"></div>
                    <div className="activity-desc">
                      <strong>Thêm sản phẩm mới</strong>: RTX 5090 Ti đã được cập nhật vào kho.
                      <span>15 phút trước</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-indicator update"></div>
                    <div className="activity-desc">
                      <strong>Cập nhật tồn kho</strong>: 15 màn hình Dell UltraSharp vừa được nhập kho.
                      <span>1 giờ trước</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-indicator user"></div>
                    <div className="activity-desc">
                      <strong>Người dùng mới</strong>: Nguyen Van A vừa đăng ký tài khoản.
                      <span>2 giờ trước</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="management-tab">
              {/* Cấu hình danh sách */}
              <div className="admin-config-section glass-panel animate-fade-in" style={{ marginBottom: '24px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showConfigPanel ? '20px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'var(--accent-gradient)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Cấu hình danh mục nhanh</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Quản lý danh sách Hãng sản xuất và Trạng thái hiển thị trong form</p>
                    </div>
                  </div>
                  <button 
                    className="btn-view-shop" 
                    onClick={() => {
                      setShowConfigPanel(!showConfigPanel);
                      if (!showConfigPanel) setTempConfig(configData);
                    }}
                  >
                    {showConfigPanel ? 'Đóng cấu hình' : 'Mở cấu hình'}
                  </button>
                </div>

                {showConfigPanel && (
                  <div className="config-grid animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Diamond size={16} /> Hãng sản xuất
                      </label>
                      <textarea
                        style={{ minHeight: '100px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                        value={tempConfig.brands}
                        onChange={(e) => setTempConfig(prev => ({ ...prev, brands: e.target.value }))}
                        placeholder="ASUS&#10;MSI..."
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <CheckSquare size={16} /> Tình trạng kinh doanh
                      </label>
                      <textarea
                        style={{ minHeight: '100px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                        value={tempConfig.statuses}
                        onChange={(e) => setTempConfig(prev => ({ ...prev, statuses: e.target.value }))}
                        placeholder="Đang kinh doanh..."
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Package size={16} /> Loại hàng (Mới/Cũ)
                      </label>
                      <textarea
                        style={{ minHeight: '100px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                        value={tempConfig.conditions}
                        onChange={(e) => setTempConfig(prev => ({ ...prev, conditions: e.target.value }))}
                        placeholder="Mới 100%&#10;Cũ..."
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Users size={16} /> Nguồn gốc / Bảo hành
                      </label>
                      <textarea
                        style={{ minHeight: '100px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                        value={tempConfig.origins}
                        onChange={(e) => setTempConfig(prev => ({ ...prev, origins: e.target.value }))}
                        placeholder="Chính hãng&#10;Xách tay..."
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
                      <button className="btn-view-shop" style={{ marginRight: 'auto' }} onClick={resetConfigToDefault}>Mặc định</button>
                      <button className="btn-cancel" onClick={() => setShowConfigPanel(false)}>Hủy</button>
                      <button className="btn-submit" onClick={handleSaveConfig}>Lưu cấu hình</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="table-header-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                <div className="table-top-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div className="search-box glass-panel" style={{ flex: '1', maxWidth: '500px', margin: 0 }}>
                    <input
                      type="text"
                      placeholder="Tìm tên, SKU, ID..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setProductPaging((prev) => ({ ...prev, page: 1 }));
                      }}
                      style={{ padding: '12px 20px', fontSize: '0.95rem' }}
                    />
                  </div>
                  <div className="header-button-group" style={{ display: 'flex', gap: '12px' }}>
                    <button
                      className="btn-view-shop"
                      onClick={handleExportCSV}
                      title="Xuất CSV"
                    >
                      <Download size={18} /> <span>Xuất Excel</span>
                    </button>
                    <button
                      className="btn-add-new"
                      onClick={openCreateProductModal}
                    >
                      + Thêm sản phẩm
                    </button>
                  </div>
                </div>

                {selectedProductIds.length > 0 && (
                  <div className="bulk-actions-toolbar glass-panel animate-fade-in" style={{ 
                    padding: '12px 24px', 
                    background: 'rgba(0, 113, 227, 0.1)', 
                    borderColor: 'rgba(0, 113, 227, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderRadius: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <strong style={{ color: '#0071e3' }}>Đã chọn {selectedProductIds.length} mục</strong>
                      <div style={{ height: '20px', width: '1px', background: 'rgba(0, 113, 227, 0.2)' }}></div>
                      <button className="btn-small" onClick={() => handleBulkToggleStatus(true)} style={{ color: '#34c759' }}>Hiện tất cả</button>
                      <button className="btn-small" onClick={() => handleBulkToggleStatus(false)} style={{ color: '#ff3b30' }}>Ẩn tất cả</button>
                    </div>
                    <button className="btn-small danger" onClick={handleBulkDelete}>Xóa {selectedProductIds.length} mục</button>
                  </div>
                )}

                <div className="table-filters glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '16px 24px' }}>
                  <div className="admin-toolbar" style={{flexWrap: 'wrap', gap: '12px', marginBottom: 0}}>
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
                      <option value="">Tất cả hãng</option>
                      {brandsList.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>

                    <select
                      className="admin-select"
                      value={productPaging.product_condition || ''}
                      onChange={(e) => setProductPaging((prev) => ({ ...prev, product_condition: e.target.value, page: 1 }))}
                    >
                      <option value="">Tất cả loại hàng</option>
                      {conditionsList.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    <select
                      className="admin-select"
                      value={productPaging.origin || ''}
                      onChange={(e) => setProductPaging((prev) => ({ ...prev, origin: e.target.value, page: 1 }))}
                    >
                      <option value="">Tất cả nguồn gốc</option>
                      {originsList.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>

                    <select
                      className="admin-select"
                      value={productPaging.in_stock || ''}
                      onChange={(e) => setProductPaging((prev) => ({ ...prev, in_stock: e.target.value, page: 1 }))}
                    >
                      <option value="">Tình trạng kho</option>
                      <option value="true">Còn hàng (&gt;0)</option>
                      <option value="false">Hết hàng (0)</option>
                    </select>

                    <select
                      className="admin-select"
                      value={productPaging.sort}
                      onChange={(e) => setProductPaging((prev) => ({ ...prev, sort: e.target.value, page: 1 }))}
                    >
                      <option value="newest">Mới nhất</option>
                      <option value="price_asc">Giá tăng dần</option>
                      <option value="price_desc">Giá giảm dần</option>
                      <option value="name_asc">Tên (A-Z)</option>
                    </select>

                    <select
                      className="admin-select"
                      value={productPaging.status}
                      onChange={(e) => setProductPaging((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="active">Đang bán</option>
                      <option value="inactive">Ngừng bán</option>
                    </select>
                  </div>
                  
                  <div className="admin-chips">
                    <span className="admin-chip info" style={{ background: 'rgba(0, 113, 227, 0.1)', color: '#0071e3', borderColor: 'rgba(0, 113, 227, 0.2)' }}>Tổng cộng: {productPaging.total}</span>
                    <span className="admin-chip">Trang {productPaging.page}/{productPaging.pages}</span>
                  </div>
                </div>
              </div>

              <div className={`admin-table-container glass-panel ${loading ? 'table-loading' : ''}`}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <button onClick={toggleSelectAll} style={{ background: 'none', border: 'none', color: 'inherit', padding: 0 }}>
                          {selectedProductIds.length === products.length && products.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                      </th>
                      <th>Ảnh</th>
                      <th>Sản phẩm</th>
                      <th>Hãng</th>
                      <th>Loại hàng</th>
                      <th>Nguồn gốc</th>
                      <th>Danh mục</th>
                      <th>Giá cơ bản</th>
                      <th>Kho</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && products.length === 0 ? (
                      <tr><td colSpan="11" className="text-center" style={{ padding: '100px' }}>Đang tải dữ liệu...</td></tr>
                    ) : products.length > 0 ? (
                      products.map(p => (
                        <tr key={p.id} className={selectedProductIds.includes(p.id) ? 'selected-row' : ''}>
                          <td>
                            <button onClick={() => toggleSelectProduct(p.id)} style={{ background: 'none', border: 'none', color: 'inherit', padding: 0 }}>
                              {selectedProductIds.includes(p.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                            </button>
                          </td>
                          <td>
                            <img src={getImageUrl(p.image_url)} alt={p.name} className="table-img" />
                          </td>
                          <td>
                            <div className="table-product-info">
                              <strong>{p.name}</strong>
                              <span>ID: {p.id} | Slug: {p.slug}</span>
                            </div>
                          </td>
                          <td>
                            <span className="admin-chip small">{p.brand || '—'}</span>
                          </td>
                          <td>
                            <span className="admin-chip small info" style={{ fontSize: '0.7rem' }}>{p.product_condition || '—'}</span>
                          </td>
                          <td>
                            <span className="admin-chip small success" style={{ fontSize: '0.7rem' }}>{p.origin || '—'}</span>
                          </td>
                          <td>{p.category_name || 'N/A'}</td>
                          <td>{p.base_price.toLocaleString()} ₫</td>
                          <td>
                            <span className={`admin-chip small ${p.stock_quantity > 0 ? 'success' : 'danger'}`}>
                              {p.stock_quantity}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                              <select
                                className={`admin-select small ${p.is_active ? 'success' : 'danger'}`}
                                style={{ 
                                  padding: '4px 28px 4px 12px', 
                                  fontSize: '0.75rem', 
                                  borderRadius: '20px',
                                  border: 'none',
                                  backgroundPosition: 'right 8px center',
                                  color: p.is_active ? '#34c759' : '#ff3b30',
                                  backgroundColor: p.is_active ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                                  fontWeight: '700'
                                }}
                                value={p.is_active ? 'true' : 'false'}
                                onChange={() => handleToggleProductActive(p)}
                              >
                                <option value="true">Đang bán</option>
                                <option value="false">Ngừng bán</option>
                              </select>
                            </div>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button 
                                className="btn-variants" 
                                title="Biến thể"
                                onClick={() => handleShowVariants(p)}
                              ><Diamond size={16} /></button>
                              <button className="btn-edit" title="Chỉnh sửa" onClick={() => openEditProductModal(p)}><Edit size={16} /></button>
                              <button className="btn-toggle" title={p.is_active ? 'Ngừng bán' : 'Cho phép bán'} onClick={() => handleToggleProductActive(p)}>
                                {p.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                              <button 
                                className="btn-delete" 
                                title="Xóa"
                                onClick={() => handleDeleteProduct(p.id)}
                              ><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-center" style={{ padding: '100px' }}>
                          {productSearch.trim() ? 'Không có sản phẩm nào khớp với tìm kiếm của bạn.' : 'Danh sách sản phẩm trống.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="admin-pagination">
                <button
                  className="btn-page"
                  disabled={productPaging.page <= 1 || loading}
                  onClick={() => setProductPaging((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                >
                  Trước
                </button>
                <span className="page-meta">
                  Trang {productPaging.page} / {productPaging.pages}
                </span>
                <button
                  className="btn-page"
                  disabled={productPaging.page >= productPaging.pages || loading}
                  onClick={() => setProductPaging((prev) => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                >
                  Sau
                </button>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="management-tab">
              <div className="table-header-actions">
                <div className="search-box glass-panel">
                  <input
                    type="text"
                    placeholder="Tìm danh mục..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                  />
                </div>
                <button
                  className="btn-add-new"
                  onClick={openCreateCategoryModal}
                >
                  + Thêm danh mục
                </button>
              </div>
              <div className="category-tree-container glass-panel">
                {loading ? (
                  <p className="text-center">Đang tải...</p>
                ) : visibleCategories.length > 0 ? (
                  <div className="cat-tree">
                    {visibleCategories.map(cat => (
                      <div key={cat.id} className="cat-node">
                        <div className="cat-node-content">
                          <span className="cat-icon"><Folder size={16} /></span>
                          <strong>{cat.name}</strong>
                          <div className="cat-actions">
                            <button className="btn-small" onClick={() => openEditCategoryModal(cat)}>Sửa</button>
                            <button className="btn-small danger" onClick={() => handleDeleteCategory(cat.id)}>Xóa</button>
                          </div>
                        </div>
                        {cat.children && cat.children.length > 0 && (
                          <div className="cat-children">
                            {cat.children
                              .filter((sub) => {
                                if (!categorySearch.trim()) return true;
                                return (sub.name || '').toLowerCase().includes(categorySearch.trim().toLowerCase());
                              })
                              .map(sub => (
                              <div key={sub.id} className="cat-node sub">
                                <span className="cat-icon"><FileText size={16} /></span>
                                {sub.name}
                                <div className="cat-actions">
                                  <button className="btn-small" onClick={() => openEditCategoryModal(sub)}>Sửa</button>
                                  <button className="btn-small danger" onClick={() => handleDeleteCategory(sub.id)}>Xóa</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center">
                    {categorySearch.trim() ? 'Không có danh mục khớp tìm kiếm.' : 'Không có danh mục nào.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="management-tab">
              <div className="table-header-actions">
                <div className="search-box glass-panel">
                  <input
                    type="text"
                    placeholder="Tìm theo username/email..."
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
                      <option value="">Tất cả role</option>
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="SELLER">SELLER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    <select
                      className="admin-select"
                      value={usersActive}
                      onChange={(e) => {
                        setUsersActive(e.target.value);
                        setUsersPaging((prev) => ({ ...prev, page: 1 }));
                      }}
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="true">Đang hoạt động</option>
                      <option value="false">Bị khóa</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="admin-table-container glass-panel">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsers ? (
                      <tr><td colSpan="6" className="text-center">Đang tải dữ liệu...</td></tr>
                    ) : users.length > 0 ? (
                      users.map((u) => (
                        <tr key={u.id}>
                          <td>{u.id}</td>
                          <td><strong>{u.username}</strong></td>
                          <td>{u.email}</td>
                          <td>
                            <select
                              className="admin-select small"
                              value={u.role}
                              disabled={u.id === user.id}
                              onChange={(e) => handleUpdateUserRole(u, e.target.value)}
                            >
                              <option value="CUSTOMER">CUSTOMER</option>
                              <option value="SELLER">SELLER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                          <td>
                            <span className={`status-tag ${u.is_active ? 'active' : 'inactive'}`}>
                              {u.is_active ? 'Hoạt động' : 'Khóa'}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn-toggle"
                                disabled={u.id === user.id}
                                title={u.is_active ? 'Khóa user' : 'Mở khóa user'}
                                onClick={() => handleUpdateUserActive(u, !u.is_active)}
                              >
                                {u.is_active ? <Lock size={16} /> : <Unlock size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center">
                          {usersSearch.trim() ? 'Không có người dùng khớp tìm kiếm.' : 'Không có người dùng nào.'}
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
                  Trước
                </button>
                <span className="page-meta">
                  Trang {usersPaging.page} / {usersPaging.pages}
                </span>
                <button
                  className="btn-page"
                  disabled={usersPaging.page >= usersPaging.pages || loadingUsers}
                  onClick={() => setUsersPaging((prev) => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                >
                  Sau
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
          <div className="admin-modal glass-panel animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', margin: 'auto' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{confirmDialog.title}</h3>
              <button className="btn-close" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>✕</button>
            </div>
            <div className="modal-content" style={{ paddingTop: '0', paddingBottom: '32px' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.95rem', lineHeight: '1.5' }}>{confirmDialog.message}</p>
              <div className="modal-footer compact" style={{ borderTop: 'none', paddingTop: '0', marginTop: '0', gap: '12px' }}>
                <button className="btn-cancel" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>Hủy bỏ</button>
                <button className="btn-submit" style={{ background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', color: '#ff3b30', fontWeight: '700' }} onClick={() => {
                  if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }}>Đồng ý</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="admin-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="admin-modal glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Biến thể của: {selectedProduct.name}</h3>
              <button className="btn-close" onClick={() => setSelectedProduct(null)}>✕</button>
            </div>
            <div className="modal-content">
              <div className="modal-toolbar">
                <button className="btn-add-new" onClick={openCreateVariantForm}>+ Thêm biến thể</button>
              </div>

              {variantFormOpen && (
                <form className="variant-form glass-panel" onSubmit={handleSaveVariant}>
                  <div className="variant-grid">
                    <div className="form-group">
                      <label>SKU</label>
                      <input name="sku" value={variantFormData.sku} onChange={handleVariantInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Giá cộng thêm (VNĐ)</label>
                      <input name="price_override" type="number" value={variantFormData.price_override} onChange={handleVariantInputChange} placeholder="Để trống nếu không có" />
                    </div>
                    <div className="form-group">
                      <label>Tồn kho</label>
                      <input name="stock_quantity" type="number" value={variantFormData.stock_quantity} onChange={handleVariantInputChange} />
                    </div>
                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input name="is_active" type="checkbox" checked={variantFormData.is_active} onChange={handleVariantInputChange} />
                        Đang hoạt động
                      </label>
                    </div>
                    <div className="form-group full-width">
                      <label>Thuộc tính (JSON)</label>
                      <textarea
                        name="attributes_json"
                        rows="5"
                        value={variantFormData.attributes_json}
                        onChange={handleVariantInputChange}
                        placeholder='{"ram":"16GB","color":"black"}'
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer compact">
                    <button type="button" className="btn-cancel" onClick={() => setVariantFormOpen(false)}>Hủy</button>
                    <button type="submit" className="btn-submit" disabled={submitting}>
                      {variantFormMode === 'create' ? 'Lưu biến thể' : 'Cập nhật biến thể'}
                    </button>
                  </div>
                </form>
              )}

              {loadingVariants ? (
                <p>Đang tải biến thể...</p>
              ) : variants.length > 0 ? (
                <div className="admin-table-container glass-panel">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Thuộc tính</th>
                        <th>Giá cộng thêm</th>
                        <th>Tồn kho</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map(v => (
                        <tr key={v.id}>
                          <td><strong>{v.sku}</strong></td>
                          <td>
                            {Object.entries(v.attributes || {}).map(([key, value]) => (
                              <span key={key} className="attr-tag">{key}: {String(value)}</span>
                            ))}
                          </td>
                          <td>{v.price_override === null || v.price_override === undefined ? '—' : `+${Number(v.price_override).toLocaleString()} ₫`}</td>
                          <td>{v.stock_quantity}</td>
                          <td>
                            <span className={`status-tag ${v.is_active ? 'active' : 'inactive'}`}>{v.is_active ? 'Hoạt động' : 'Ẩn'}</span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button className="btn-edit" title="Sửa" onClick={() => openEditVariantForm(v)}><Edit size={16} /></button>
                              <button className="btn-delete" title="Xóa" onClick={() => handleDeleteVariant(v.id)}><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Chưa có biến thể nào cho sản phẩm này.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="admin-modal-overlay" onClick={() => { setShowAddModal(false); setEditingProduct(null); setProductModalMode('create'); }}>
          <div className="admin-modal glass-panel animate-fade-in product-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{productModalMode === 'create' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}</h3>
              <button className="btn-close" onClick={() => { setShowAddModal(false); setEditingProduct(null); setProductModalMode('create'); }}>✕</button>
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
                    placeholder="Ví dụ: Card đồ họa ASUS ROG Strix..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Đường dẫn (Slug)</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="asus-rog-strix"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Giá cơ bản (VNĐ)</label>
                  <input
                    type="number"
                    name="base_price"
                    value={formData.base_price}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 15000000"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Số lượng tồn kho</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 50"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Danh mục</label>
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
                  <label>Hãng sản xuất</label>
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
                  <label>Tình trạng kinh doanh</label>
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
                  <label>Loại hàng (Mới/Cũ)</label>
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
                  <label>Link ảnh sản phẩm (Google Drive/URL)</label>
                  <textarea
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="Dán link ảnh tại đây (Mỗi link một dòng)..."
                    className="media-textarea"
                  ></textarea>
                  {formData.image_url && (
                    <div className="image-preview-container">
                      <img src={getImageUrl(formData.image_url)} alt="Preview" />
                      <span>Xem trước ảnh</span>
                    </div>
                  )}
                </div>
                <div className="form-group full-width">
                  <label>Mô tả sản phẩm</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Nhập chi tiết về sản phẩm..."
                    rows="3"
                  ></textarea>
                </div>
                <div className="form-group full-width">
                  <label>Ảnh & Video bổ sung (Mỗi link một dòng)</label>
                  <textarea
                    name="additional_media"
                    value={formData.additional_media}
                    onChange={handleInputChange}
                    placeholder="Dán link ảnh hoặc video bổ sung tại đây...&#10;Hỗ trợ: Google Drive, YouTube, Link trực tiếp"
                    rows="4"
                    className="media-textarea"
                  ></textarea>
                  <p className="field-hint">Hệ thống tự nhận diện Ảnh hoặc Video để hiển thị trong bộ sưu tập.</p>
                </div>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    Cho phép bán sản phẩm này ngay lập tức
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => { setShowAddModal(false); setEditingProduct(null); setProductModalMode('create'); }}>Hủy bỏ</button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : (productModalMode === 'create' ? 'Lưu sản phẩm' : 'Cập nhật')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddCategoryModal && (
        <div className="admin-modal-overlay" onClick={() => { setShowAddCategoryModal(false); setEditingCategory(null); setCategoryModalMode('create'); }}>
          <div className="admin-modal glass-panel animate-fade-in product-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{categoryModalMode === 'create' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}</h3>
              <button className="btn-close" onClick={() => { setShowAddCategoryModal(false); setEditingCategory(null); setCategoryModalMode('create'); }}>✕</button>
            </div>
            <form className="modal-content" onSubmit={handleCreateCategory}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên danh mục</label>
                  <input
                    type="text"
                    name="name"
                    value={categoryFormData.name}
                    onChange={handleCategoryInputChange}
                    placeholder="Ví dụ: Linh kiện PC"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Đường dẫn (Slug)</label>
                  <input
                    type="text"
                    name="slug"
                    value={categoryFormData.slug}
                    onChange={handleCategoryInputChange}
                    placeholder="linh-kien-pc"
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label>Danh mục cha (Để trống nếu là danh mục gốc)</label>
                  <select
                    name="parent_id"
                    value={categoryFormData.parent_id}
                    onChange={handleCategoryInputChange}
                  >
                    <option value="">-- Danh mục gốc --</option>
                    {categoryOptions
                      .filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {`${'—'.repeat(c.depth)} ${c.name}`.trim()}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={categoryFormData.is_active}
                      onChange={handleCategoryInputChange}
                    />
                    Hiển thị danh mục này
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => { setShowAddCategoryModal(false); setEditingCategory(null); setCategoryModalMode('create'); }}>Hủy bỏ</button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : (categoryModalMode === 'create' ? 'Lưu danh mục' : 'Cập nhật')}
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
