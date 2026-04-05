import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  MoreVertical,
  CheckSquare,
  Square
} from 'lucide-react';
import { Button } from './Common';
import './DataTable.css';

const DataTable = ({ 
  columns, 
  data, 
  loading, 
  pagination, 
  onPageChange, 
  onSort, 
  sortConfig,
  onSearch,
  searchValue,
  actions,
  bulkActions,
  selectedRows = [],
  onSelectRow,
  onSelectAll
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleSort = (key) => {
    if (!onSort) return;
    let direction = 'asc';
    if (sortConfig?.key === key && sortConfig?.direction === 'asc') {
      direction = 'desc';
    }
    onSort(key, direction);
  };

  const renderSortIcon = (key) => {
    if (sortConfig?.key !== key) return <ArrowUpDown size={14} className="sort-icon-neutral" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="sort-icon-active" /> 
      : <ArrowDown size={14} className="sort-icon-active" />;
  };

  return (
    <div className="data-table-wrapper">
      <div className="table-toolbar">
        <div className="toolbar-left">
          {onSearch && (
            <div className="table-search">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                value={searchValue}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          )}
          {bulkActions && selectedRows.length > 0 && (
            <div className="bulk-actions">
              <span className="selected-count">Đã chọn {selectedRows.length}</span>
              {bulkActions.map((action, idx) => (
                <Button 
                  key={idx} 
                  variant={action.variant || 'secondary'} 
                  size="sm"
                  onClick={() => action.onClick(selectedRows)}
                  icon={action.icon}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        <div className="toolbar-right">
          {actions}
        </div>
      </div>

      <div className={`table-container ${loading ? 'loading' : ''}`}>
        <table className="admin-table">
          <thead>
            <tr>
              {(onSelectRow || onSelectAll) && (
                <th className="checkbox-col">
                  <button 
                    className={`checkbox-btn ${selectedRows.length === data.length && data.length > 0 ? 'is-checked' : ''}`} 
                    onClick={onSelectAll}
                  >
                    {selectedRows.length === data.length && data.length > 0 && <CheckSquare size={14} className="checked" />}
                  </button>
                </th>
              )}
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={col.sortable ? 'sortable' : ''}
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={{ width: col.width }}
                >
                  <div className="th-content">
                    {col.title}
                    {col.sortable && renderSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: pagination?.limit || 5 }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`}>
                  {(onSelectRow || onSelectAll) && <td className="checkbox-col"><div className="skeleton skeleton-checkbox"></div></td>}
                  {columns.map((col, cIdx) => (
                    <td key={`col-${cIdx}`} style={{ width: col.width }}>
                      <div className="skeleton skeleton-text"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onSelectRow ? 1 : 0)} className="empty-state">
                  Không có dữ liệu hiển thị
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => {
                const isSelected = selectedRows.includes(row.id);
                return (
                  <tr key={row.id || rIdx} className={isSelected ? 'selected' : ''}>
                    {(onSelectRow || onSelectAll) && (
                      <td className="checkbox-col">
                        <button 
                          className={`checkbox-btn ${isSelected ? 'is-checked' : ''}`} 
                          onClick={() => onSelectRow(row.id)}
                        >
                          {isSelected && <CheckSquare size={14} className="checked" />}
                        </button>
                      </td>
                    )}
                    {columns.map((col, cIdx) => (
                      <td key={cIdx}>
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="table-pagination">
          <div className="pagination-info">
            Hiển thị <strong>{(pagination.page - 1) * pagination.limit + 1}</strong> - <strong>{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> trong số <strong>{pagination.total}</strong>
          </div>
          <div className="pagination-controls">
            <button 
              className="page-btn" 
              onClick={() => onPageChange(1)} 
              disabled={pagination.page === 1}
            >
              <ChevronsLeft size={18} />
            </button>
            <button 
              className="page-btn" 
              onClick={() => onPageChange(pagination.page - 1)} 
              disabled={pagination.page === 1}
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="page-numbers">
              {/* Simple page numbers logic */}
              <span className="current-page">Trang {pagination.page} / {pagination.pages}</span>
            </div>

            <button 
              className="page-btn" 
              onClick={() => onPageChange(pagination.page + 1)} 
              disabled={pagination.page === pagination.pages}
            >
              <ChevronRight size={18} />
            </button>
            <button 
              className="page-btn" 
              onClick={() => onPageChange(pagination.pages)} 
              disabled={pagination.page === pagination.pages}
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
