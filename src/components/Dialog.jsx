import React, { useEffect } from 'react';
import './Dialog.css'; // We'll create this CSS file next

const Dialog = ({ isOpen, title, message, confirmText = 'OK', cancelText, onConfirm, onCancel, type = 'alert' }) => {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen && onCancel) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="dialog-overlay" onClick={onCancel}> {/* Close on overlay click */}
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}> {/* Prevent closing when clicking inside */}
        {title && <h3 className="dialog-title">{title}</h3>}
        <p className="dialog-message">{message}</p>
        <div className="dialog-buttons">
          {type === 'confirm' && onCancel && (
            <button className="dialog-button cancel" onClick={onCancel}>
              {cancelText || 'Cancel'}
            </button>
          )}
          <button className="dialog-button confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dialog;