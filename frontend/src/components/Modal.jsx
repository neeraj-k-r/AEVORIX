import { Fragment, useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export function Modal({ isOpen, onClose, title, children, size = 'md', showClose = true }) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
        <div className={`relative bg-white rounded-xl shadow-xl w-full ${sizes[size]}`}>
          {(title || showClose) && (
            <div className="flex items-center justify-between p-4 border-b border-card-border">
              {title && <h2 className="text-lg font-semibold text-slate-900">{title}</h2>}
              {showClose && (
                <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );

  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger', loading = false }) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-slate-600">{message}</p>
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : variant === 'primary'
                ? 'bg-primary hover:bg-primary-hover'
                : 'bg-slate-600 hover:bg-slate-700'
            }`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}