import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, Warning, Info } from '@phosphor-icons/react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => {
          let Icon = Info;
          let color = 'var(--primary)';
          if (toast.type === 'success') {
            Icon = CheckCircle;
            color = 'var(--status-ready, oklch(0.60 0.15 140))';
          } else if (toast.type === 'error') {
            Icon = Warning;
            color = 'oklch(0.60 0.18 20)';
          }

          return (
            <div key={toast.id} className="toast" style={{ borderLeft: `4px solid ${color}` }}>
              <Icon size={20} style={{ color }} />
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
