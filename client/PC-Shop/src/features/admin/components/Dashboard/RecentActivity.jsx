import React from 'react';
import { Card, Badge } from '../Common/Common';
import { ShoppingBag, UserPlus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import './Dashboard.css';

const RecentActivity = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'order': return <div className="activity-icon-v2 bg-primary"><ShoppingBag size={18} /></div>;
      case 'user': return <div className="activity-icon-v2 bg-info"><UserPlus size={18} /></div>;
      case 'alert': return <div className="activity-icon-v2 bg-danger"><AlertTriangle size={18} /></div>;
      default: return <div className="activity-icon-v2 bg-success"><CheckCircle2 size={18} /></div>;
    }
  };

  return (
    <Card title="Hoạt động gần đây" className="activity-card-v2">
      <div className="activity-list-v2">
        {activities.length === 0 ? (
          <p className="empty-text">Không có hoạt động mới</p>
        ) : (
          activities.map((activity, idx) => (
            <div key={idx} className="activity-item-v2">
              {getActivityIcon(activity.type)}
              <div className="activity-content-v2">
                <div className="activity-header-v2">
                  <span className="activity-title-v2">{activity.title}</span>
                  <span className="activity-time-v2">{activity.time}</span>
                </div>
                <p className="activity-desc-v2">{activity.description}</p>
                {activity.status && (
                  <Badge variant={activity.statusVariant || 'neutral'}>{activity.status}</Badge>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default RecentActivity;
