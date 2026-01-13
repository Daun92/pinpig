/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useToastStore, selectToasts, type ToastType } from '@/stores/toastStore';

const typeStyles: Record<ToastType, { bg: string; icon: React.ReactNode; iconColor: string }> = {
  success: {
    bg: 'bg-semantic-positive/10 border-semantic-positive/30',
    icon: <CheckCircle size={18} />,
    iconColor: 'text-semantic-positive',
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30',
    icon: <AlertTriangle size={18} />,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  danger: {
    bg: 'bg-semantic-negative/10 border-semantic-negative/30',
    icon: <AlertCircle size={18} />,
    iconColor: 'text-semantic-negative',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/30',
    icon: <Info size={18} />,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
};

interface ToastItemProps {
  id: string;
  type: ToastType;
  message: string;
  subMessage?: string;
  onClose: (id: string) => void;
}

function ToastItem({ id, type, message, subMessage, onClose }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const style = typeStyles[type];

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 200);
  };

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg
        ${style.bg}
        transform transition-all duration-200 ease-out
        ${isVisible && !isExiting ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      `}
      onClick={handleClose}
    >
      <span className={`shrink-0 mt-0.5 ${style.iconColor}`}>
        {style.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-body text-ink-black">{message}</p>
        {subMessage && (
          <p className="text-sub text-ink-mid mt-0.5">{subMessage}</p>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        className="shrink-0 w-6 h-6 flex items-center justify-center text-ink-light hover:text-ink-mid transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore(selectToasts);
  const hideToast = useToastStore((state) => state.hideToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem
            id={toast.id}
            type={toast.type}
            message={toast.message}
            subMessage={toast.subMessage}
            onClose={hideToast}
          />
        </div>
      ))}
    </div>
  );
}

// Hook for easy toast usage
export function useToast() {
  const showToast = useToastStore((state) => state.showToast);

  return {
    success: (message: string, subMessage?: string) =>
      showToast({ type: 'success', message, subMessage }),
    warning: (message: string, subMessage?: string) =>
      showToast({ type: 'warning', message, subMessage }),
    danger: (message: string, subMessage?: string) =>
      showToast({ type: 'danger', message, subMessage }),
    info: (message: string, subMessage?: string) =>
      showToast({ type: 'info', message, subMessage }),
    show: showToast,
  };
}
