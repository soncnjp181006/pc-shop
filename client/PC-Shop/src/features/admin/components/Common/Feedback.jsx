import React, { useEffect } from 'react';
import { Button, Modal } from './Common';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import './Feedback.css';

export const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Xác nhận', 
  message, 
  confirmText = 'Đồng ý', 
  cancelText = 'Hủy',
  variant = 'danger',
  loading = false
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelText}</Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmText}</Button>
        </>
      }
    >
      <div className="confirm-dialog-content">
        <AlertCircle size={48} className={`confirm-icon icon-${variant}`} />
        <p className="confirm-message">{message}</p>
      </div>
    </Modal>
  );
};

export const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <Info size={20} />
  };

  return (
    <div className={`admin-toast toast-${type}`}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}><X size={16} /></button>
    </div>
  );
};

export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="admin-toast-container">
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          {...toast} 
          onClose={() => removeToast(toast.id)} 
        />
      ))}
    </div>
  );
};
