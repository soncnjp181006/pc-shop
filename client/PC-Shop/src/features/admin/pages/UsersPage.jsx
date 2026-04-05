import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  User,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  MoreVertical
} from 'lucide-react';
import { Button, Badge, Card } from '../components/Common/Common';
import DataTable from '../components/Common/DataTable';
import { ConfirmDialog, ToastContainer } from '../components/Common/Feedback';
import { adminApi } from '../../../utils/api';
import './Pages.css';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        q: searchValue || undefined
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data);
        setPagination(prev => ({ ...prev, total: data.total, pages: data.pages }));
      }
    } catch (error) {
      console.error('Lỗi khi tải người dùng:', error);
      addToast('Không thể tải danh sách người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [pagination.page, pagination.limit, searchValue]);

  const handleToggleStatus = async (user) => {
    // Cập nhật UI ngay lập tức (Optimistic Update)
    const newStatus = !user.is_active;
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));
    
    try {
      const res = await adminApi.updateUserActive(user.id, newStatus);
      if (res.ok) {
        addToast(newStatus ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản', 'success');
        // Không gọi fetchUsers() ở đây để tránh giật màn hình
      } else {
        // Rollback nếu lỗi từ server
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !newStatus } : u));
        addToast('Không thể cập nhật trạng thái', 'error');
      }
    } catch (error) {
      // Rollback nếu lỗi kết nối
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !newStatus } : u));
      addToast('Lỗi kết nối server', 'error');
    }
  };

  const handleUpdateRole = async (user, newRole) => {
    // Cập nhật UI ngay lập tức (Optimistic Update)
    const oldRole = user.role;
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    
    try {
      const res = await adminApi.updateUserRole(user.id, newRole);
      if (res.ok) {
        addToast(`Đã thay đổi quyền thành ${newRole}`, 'success');
        // Không gọi fetchUsers() ở đây để tránh giật màn hình
      } else {
        // Rollback nếu lỗi từ server
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: oldRole } : u));
        addToast('Không thể cập nhật quyền hạn', 'error');
      }
    } catch (error) {
      // Rollback nếu lỗi kết nối
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: oldRole } : u));
      addToast('Lỗi kết nối server', 'error');
    }
  };

  const columns = [
    { 
      title: 'Người dùng', 
      key: 'name',
      render: (name, row) => (
        <div className="user-cell">
          <div className="user-avatar-v2">
            {name?.charAt(0) || 'U'}
          </div>
          <div className="user-info-v2">
            <span className="user-name-v2">{name}</span>
            <span className="user-email-v2">{row.email}</span>
          </div>
        </div>
      ),
      width: '250px'
    },
    { 
      title: 'Quyền hạn', 
      key: 'role',
      render: (role, row) => (
        <div className="role-selector">
          <Badge variant={role === 'ADMIN' ? 'danger' : (role === 'SELLER' ? 'warning' : 'info')}>
            {role}
          </Badge>
          <select 
            value={role} 
            onChange={(e) => handleUpdateRole(row, e.target.value)}
            className="role-select"
          >
            <option value="CUSTOMER">CUSTOMER</option>
            <option value="SELLER">SELLER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
      ),
      width: '200px'
    },
    { 
      title: 'Ngày đăng ký', 
      key: 'created_at',
      render: (val) => <span className="date-text">{new Date(val).toLocaleDateString()}</span>,
      width: '150px'
    },
    { 
      title: 'Trạng thái', 
      key: 'is_active',
      render: (val, row) => (
        <button 
          className={`status-pill ${val ? 'active' : 'inactive'}`} 
          onClick={() => handleToggleStatus(row)}
        >
          <span>{val ? 'Hoạt động' : 'Đã khóa'}</span>
        </button>
      ),
      width: '160px'
    },
    { 
      title: 'Thao tác', 
      key: 'actions',
      render: (_, row) => (
        <div className="table-actions">
          <button className="action-icon-btn edit" title="Sửa">
            <Edit size={18} />
          </button>
          <button className="action-icon-btn" title="Thêm">
            <MoreVertical size={18} />
          </button>
        </div>
      ),
      width: '100px'
    }
  ];

  return (
    <div className="page-users">
      <div className="page-header-v2">
        <div className="header-title-group">
          <h1 className="page-title-v2">Quản lý người dùng</h1>
          <p className="page-subtitle-v2">Danh sách thành viên, cộng tác viên và quản trị viên.</p>
        </div>
        <div className="header-actions-v2">
          <Button variant="primary" icon={<Plus size={18} />}>Tạo người dùng</Button>
        </div>
      </div>

      <DataTable 
        columns={columns}
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onSearch={setSearchValue}
        searchValue={searchValue}
      />

      <ConfirmDialog {...confirmDialog} onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default UsersPage;
