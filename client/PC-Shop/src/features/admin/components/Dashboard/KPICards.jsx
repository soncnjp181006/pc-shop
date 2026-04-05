import React from 'react';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Card } from '../Common/Common';
import './Dashboard.css';

const KPICard = ({ title, value, icon, trend, trendValue, variant = 'primary' }) => {
  return (
    <Card className={`kpi-card-v2 variant-${variant}`}>
      <div className="kpi-header">
        <div className="kpi-icon-wrapper">
          {icon}
        </div>
        <div className="kpi-trend">
          {trend === 'up' ? (
            <span className="trend-up"><TrendingUp size={14} /> +{trendValue}%</span>
          ) : (
            <span className="trend-down"><TrendingDown size={14} /> -{trendValue}%</span>
          )}
        </div>
      </div>
      <div className="kpi-content">
        <h4 className="kpi-title">{title}</h4>
        <div className="kpi-value">{value}</div>
      </div>
    </Card>
  );
};

const KPICards = ({ stats }) => {
  return (
    <div className="kpi-grid">
      <KPICard 
        title="Tổng doanh thu" 
        value={(stats.revenue || 0).toLocaleString() + ' ₫'} 
        icon={<DollarSign size={24} />} 
        trend="up" 
        trendValue="12.5"
        variant="primary"
      />
      <KPICard 
        title="Khách hàng" 
        value={(stats.users || 0).toLocaleString()} 
        icon={<Users size={24} />} 
        trend="up" 
        trendValue="5.2"
        variant="info"
      />
      <KPICard 
        title="Sản phẩm" 
        value={(stats.products || 0).toLocaleString()} 
        icon={<Package size={24} />} 
        trend="down" 
        trendValue="2.1"
        variant="success"
      />
      <KPICard 
        title="Đơn hàng" 
        value={(stats.orders || 0).toLocaleString()} 
        icon={<ShoppingCart size={24} />} 
        trend="up" 
        trendValue="8.4"
        variant="warning"
      />
    </div>
  );
};

export default KPICards;
