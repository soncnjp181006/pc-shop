import React, { useState, useEffect } from 'react';
import KPICards from '../components/Dashboard/KPICards';
import DashboardChart from '../components/Dashboard/DashboardChart';
import RecentActivity from '../components/Dashboard/RecentActivity';
import { adminApi, productsApi, categoriesApi } from '../../../utils/api';
import './Pages.css';

const DashboardOverview = () => {
  const [stats, setStats] = useState({ revenue: 125400000, users: 0, products: 0, orders: 156 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pRes, cRes, uRes] = await Promise.all([
          productsApi.getAll({ page: 1, limit: 1, active_only: false }),
          categoriesApi.getAll({ active_only: false }),
          adminApi.getUsers({ page: 1, limit: 1 })
        ]);

        setStats(prev => ({
          ...prev,
          products: pRes.ok ? (pRes.json().then(d => d.total) || 0) : 0,
          users: uRes.ok ? (uRes.json().then(d => d.total) || 0) : 0,
        }));
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const chartData = [
    { label: 'T2', value: 45 },
    { label: 'T3', value: 52 },
    { label: 'T4', value: 38 },
    { label: 'T5', value: 65 },
    { label: 'T6', value: 48 },
    { label: 'T7', value: 72 },
    { label: 'CN', value: 58 },
  ];

  const activities = [
    { type: 'order', title: 'Đơn hàng mới #12345', description: 'Nguyễn Văn A vừa đặt mua Laptop ASUS ROG Strix G15', time: '2 phút trước', status: 'Đang xử lý', statusVariant: 'warning' },
    { type: 'user', title: 'Thành viên mới', description: 'Trần Thị B vừa đăng ký tài khoản thành công', time: '15 phút trước' },
    { type: 'alert', title: 'Sắp hết hàng', description: 'Sản phẩm "Chuột Logitech G502" còn dưới 5 sản phẩm', time: '1 giờ trước', status: 'Cảnh báo', statusVariant: 'danger' },
    { type: 'success', title: 'Thanh toán thành công', description: 'Đơn hàng #12340 đã được thanh toán qua VNPay', time: '3 giờ trước', status: 'Hoàn tất', statusVariant: 'success' },
  ];

  return (
    <div className="page-overview">
      <div className="page-header-v2">
        <h1 className="page-title-v2">Tổng quan hệ thống</h1>
        <p className="page-subtitle-v2">Chào mừng trở lại, đây là những gì đang diễn ra với cửa hàng của bạn hôm nay.</p>
      </div>

      <KPICards stats={stats} />

      <div className="dashboard-grid">
        <DashboardChart title="Lượt truy cập tuần này" data={chartData} />
        <RecentActivity activities={activities} />
      </div>
    </div>
  );
};

export default DashboardOverview;
