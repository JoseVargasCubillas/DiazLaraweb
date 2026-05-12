import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
  duration?: number; // ms; 0 = sticky
}

interface ToastContextValue {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id' | 'variant'> & { variant?: ToastVariant }) => string;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  dismiss: (id: string) => void;
}

const ToastCtx = createContext<ToastContextValue | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback<ToastContextValue['push']>((t) => {
    const id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `t_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const variant = t.variant ?? 'info';
    const duration = t.duration ?? (variant === 'error' ? 6000 : 4000);
    const next: Toast = { id, variant, title: t.title, message: t.message, duration };
    setToasts((prev) => [...prev, next]);
    if (duration > 0) {
      window.setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const helpers = useMemo(() => ({
    success: (message: string, title?: string) => push({ message, title, variant: 'success' }),
    error: (message: string, title?: string) => push({ message, title, variant: 'error' }),
    info: (message: string, title?: string) => push({ message, title, variant: 'info' }),
    warning: (message: string, title?: string) => push({ message, title, variant: 'warning' }),
  }), [push]);

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, push, dismiss, ...helpers }),
    [toasts, push, dismiss, helpers]
  );

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastCtx.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
};

const ICON: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
};

const ToastViewport = ({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) => {
  // Render in a portal-like fixed container; no portal lib to keep deps minimal.
  useEffect(() => {
    // SSR guard
  }, []);
  return (
    <div className="ui-toast-viewport" aria-live="polite" aria-atomic="false">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className={`ui-toast ui-toast-${t.variant}`}
            role={t.variant === 'error' ? 'alert' : 'status'}
          >
            <span className="ui-toast-icon" aria-hidden>{ICON[t.variant]}</span>
            <div className="ui-toast-body">
              {t.title && <p className="ui-toast-title">{t.title}</p>}
              <p className="ui-toast-message">{t.message}</p>
            </div>
            <button
              type="button"
              className="ui-toast-close"
              onClick={() => dismiss(t.id)}
              aria-label="Cerrar notificación"
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
