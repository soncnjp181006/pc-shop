import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  FolderTree,
  Search,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Button, Badge, Card } from '../components/Common/Common';
import { ConfirmDialog, ToastContainer } from '../components/Common/Feedback';
import { categoriesApi } from '../../../utils/api';
import './Pages.css';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
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
      addToast('Không thể tải danh mục', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleToggleCategoryStatus = async (category) => {
    const newStatus = !category.is_active;
    
    // Optimistic UI Update
    setCategories(prev => {
      const updateRecursive = (nodes) => {
        return nodes.map(node => {
          if (node.id === category.id) {
            return { ...node, is_active: newStatus };
          }
          if (node.children) {
            return { ...node, children: updateRecursive(node.children) };
          }
          return node;
        });
      };
      return updateRecursive(prev);
    });

    try {
      const res = await categoriesApi.update(category.id, { is_active: newStatus });
      if (res.ok) {
        addToast(newStatus ? 'Đã hiển thị danh mục' : 'Đã ẩn danh mục', 'success');
      } else {
        throw new Error();
      }
    } catch (error) {
      // Rollback on failure
      setCategories(prev => {
        const updateRecursive = (nodes) => {
          return nodes.map(node => {
            if (node.id === category.id) {
              return { ...node, is_active: !newStatus };
            }
            if (node.children) {
              return { ...node, children: updateRecursive(node.children) };
            }
            return node;
          });
        };
        return updateRecursive(prev);
      });
      addToast('Lỗi khi cập nhật trạng thái', 'error');
    }
  };

  const CategoryItem = ({ category, depth = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div className="category-item-container">
        <div className={`category-row depth-${depth}`}>
          <div className="category-main">
            {hasChildren ? (
              <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
            ) : (
              <div className="expand-placeholder"></div>
            )}
            <FolderTree size={18} className="category-icon" />
            <span className="category-name">{category.name}</span>
            <span className="category-slug">/{category.slug}</span>
          </div>
          
          <div className="category-actions">
            <button 
              className={`status-pill ${category.is_active ? 'active' : 'inactive'}`}
              onClick={() => handleToggleCategoryStatus(category)}
            >
              <span>{category.is_active ? 'Hoạt động' : 'Ẩn'}</span>
            </button>
            <div className="table-actions">
              <button className="action-icon-btn edit" title="Thêm con">
                <Plus size={18} />
              </button>
              <button className="action-icon-btn edit" title="Sửa">
                <Edit size={18} />
              </button>
              <button className="action-icon-btn delete" title="Xóa">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="category-children">
            {category.children.map(child => (
              <CategoryItem key={child.id} category={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-categories">
      <div className="page-header-v2">
        <div className="header-title-group">
          <h1 className="page-title-v2">Danh mục sản phẩm</h1>
          <p className="page-subtitle-v2">Quản lý cấu trúc phân cấp danh mục cho cửa hàng của bạn.</p>
        </div>
        <div className="header-actions-v2">
          <Button variant="primary" icon={<Plus size={18} />}>Thêm danh mục gốc</Button>
        </div>
      </div>

      <Card className="category-tree-card">
        <div className="category-tree-header">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Tìm nhanh danh mục..." />
          </div>
        </div>
        
        <div className="category-tree-content">
          {loading ? (
            <div className="loading-state">Đang tải danh mục...</div>
          ) : categories.length === 0 ? (
            <div className="empty-state">Chưa có danh mục nào</div>
          ) : (
            categories.map(cat => (
              <CategoryItem key={cat.id} category={cat} />
            ))
          )}
        </div>
      </Card>

      <ConfirmDialog {...confirmDialog} onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default CategoriesPage;
