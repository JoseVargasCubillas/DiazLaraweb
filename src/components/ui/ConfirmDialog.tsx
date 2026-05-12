import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Accessible confirmation modal with optional reason input not included here —
 * keep it focused: title + description + confirm/cancel.
 */
export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) => {
  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="ui-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onCancel}
        >
          <motion.div
            className={`ui-modal ${variant === 'danger' ? 'ui-modal-danger' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ui-modal-title"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="ui-modal-title" className="ui-modal-title">{title}</h2>
            {description && <p className="ui-modal-desc">{description}</p>}
            <div className="ui-modal-actions">
              <button type="button" className="ui-modal-btn ui-modal-btn-ghost" onClick={onCancel} disabled={loading}>
                {cancelLabel}
              </button>
              <button
                type="button"
                className={`ui-modal-btn ${variant === 'danger' ? 'ui-modal-btn-danger' : 'ui-modal-btn-primary'}`}
                onClick={onConfirm}
                disabled={loading}
                autoFocus
              >
                {loading ? 'Procesando…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
