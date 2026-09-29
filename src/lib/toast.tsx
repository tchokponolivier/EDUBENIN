import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };
    setToasts(prev => [...prev.slice(-4), newToast]); // Keep max 5 toasts

    const duration = toast.duration ?? 4500;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => {
    showToast({ type: 'success', message, title });
  }, [showToast]);

  const error = useCallback((message: string, title?: string) => {
    showToast({ type: 'error', message, title: title || 'Erreur' });
  }, [showToast]);

  const warning = useCallback((message: string, title?: string) => {
    showToast({ type: 'warning', message, title: title || 'Attention' });
  }, [showToast]);

  const info = useCallback((message: string, title?: string) => {
    showToast({ type: 'info', message, title });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, success, error, warning, info, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map(t => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 ${
                isSuccess
                  ? 'bg-emerald-900/95 text-white border-emerald-700 shadow-emerald-950/20'
                  : isError
                  ? 'bg-red-900/95 text-white border-red-700 shadow-red-950/20'
                  : isWarning
                  ? 'bg-amber-900/95 text-white border-amber-700 shadow-amber-950/20'
                  : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-950/20'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isError && <AlertCircle className="w-5 h-5 text-red-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-blue-400" />}
              </div>

              <div className="flex-1 min-w-0">
                {t.title && <h4 className="font-bold text-xs uppercase tracking-wider mb-0.5 opacity-90">{t.title}</h4>}
                <p className="text-xs font-medium leading-relaxed opacity-95 break-words">{t.message}</p>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-white/70 hover:text-white transition p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback safe dummy if context is unmounted
    return {
      toasts: [],
      showToast: () => {},
      success: (msg: string) => console.log('Toast success:', msg),
      error: (msg: string) => console.error('Toast error:', msg),
      warning: (msg: string) => console.warn('Toast warning:', msg),
      info: (msg: string) => console.info('Toast info:', msg),
      removeToast: () => {}
    };
  }
  return context;
}
