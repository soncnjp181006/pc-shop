import React from 'react';
import { Card } from '../Common/Common';
import './Dashboard.css';

const DashboardChart = ({ title, data }) => {
  // Simple SVG Bar Chart
  const maxValue = Math.max(...data.map(d => d.value), 10);
  const chartHeight = 200;
  const barWidth = 40;
  const gap = 20;

  return (
    <Card title={title} className="dashboard-chart-card">
      <div className="chart-container">
        <svg 
          viewBox={`0 0 ${data.length * (barWidth + gap) + gap} ${chartHeight + 40}`} 
          className="admin-svg-chart"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <line 
              key={i}
              x1="0" 
              y1={chartHeight * (1 - p)} 
              x2="100%" 
              y2={chartHeight * (1 - p)} 
              className="chart-grid-line"
            />
          ))}

          {data.map((item, idx) => {
            const h = (item.value / maxValue) * chartHeight;
            const x = idx * (barWidth + gap) + gap;
            const y = chartHeight - h;
            
            return (
              <g key={idx} className="chart-bar-group">
                <rect 
                  x={x} 
                  y={y} 
                  width={barWidth} 
                  height={h} 
                  rx="6"
                  className="chart-bar"
                />
                <text 
                  x={x + barWidth / 2} 
                  y={chartHeight + 20} 
                  textAnchor="middle" 
                  className="chart-label"
                >
                  {item.label}
                </text>
                <text 
                  x={x + barWidth / 2} 
                  y={y - 8} 
                  textAnchor="middle" 
                  className="chart-value-text"
                >
                  {item.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </Card>
  );
};

export default DashboardChart;
