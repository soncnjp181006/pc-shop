import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './Common.css';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  icon,
  loading,
  ...props 
}) => {
  return (
    <button 
      className={`admin-btn btn-${variant} btn-${size} ${className} ${loading ? 'loading' : ''}`}
      disabled={loading}
      {...props}
    >
      {loading && <span className="btn-spinner"></span>}
      {!loading && icon && <span className="btn-icon">{icon}</span>}
      <span className="btn-content">{children}</span>
    </button>
  );
};

export const Card = ({ children, title, subtitle, extra, className = '', noPadding = false }) => {
  return (
    <div className={`admin-card ${className}`}>
      {(title || extra) && (
        <div className="card-header">
          <div className="card-title-group">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {extra && <div className="card-extra">{extra}</div>}
        </div>
      )}
      <div className={`card-body ${noPadding ? 'no-padding' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export const Badge = ({ children, variant = 'neutral', className = '' }) => {
  return (
    <span className={`admin-badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
};

export const Skeleton = ({ width, height, circle, className = '' }) => {
  const style = {
    width: width || '100%',
    height: height || '20px',
    borderRadius: circle ? '50%' : 'var(--admin-radius-sm)'
  };
  return <div className={`admin-skeleton ${className}`} style={style}></div>;
};

export const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className={`modal-container modal-${size}`} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>
        {title && (
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};
