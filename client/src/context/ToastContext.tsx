import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Global callback holder for standalone toast calls
let globalToastHandler: ((toast: Omit<ToastItem, "id">) => void) | null = null;

export const toast = {
  success: (message: string, title?: string) => {
    globalToastHandler?.({ type: "success", message, title });
  },
  error: (message: string, title?: string) => {
    globalToastHandler?.({ type: "error", message, title });
  },
  warning: (message: string, title?: string) => {
    globalToastHandler?.({ type: "warning", message, title });
  },
  info: (message: string, title?: string) => {
    globalToastHandler?.({ type: "info", message, title });
  },
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (newToast: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const toastItem: ToastItem = { ...newToast, id };

      setToasts((prev) => [...prev.slice(-4), toastItem]); // Keep at most 5 active toasts

      const duration = newToast.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  // Sync global helper
  React.useEffect(() => {
    globalToastHandler = showToast;
    return () => {
      globalToastHandler = null;
    };
  }, [showToast]);

  const success = useCallback(
    (message: string, title?: string) => showToast({ type: "success", message, title }),
    [showToast]
  );
  const error = useCallback(
    (message: string, title?: string) => showToast({ type: "error", message, title }),
    [showToast]
  );
  const warning = useCallback(
    (message: string, title?: string) => showToast({ type: "warning", message, title }),
    [showToast]
  );
  const info = useCallback(
    (message: string, title?: string) => showToast({ type: "info", message, title }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, dismiss }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div
        aria-live="assertive"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-[#2A7B54] shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-[#9E2A2B] shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />,
            info: <Info className="w-5 h-5 text-[#2563EB] shrink-0" />,
          };

          const borders = {
            success: "border-[#2A7B54]/30 bg-[#F4FAF6]",
            error: "border-[#9E2A2B]/30 bg-[#FDF4F4]",
            warning: "border-[#D97706]/30 bg-[#FFFBEB]",
            info: "border-[#2563EB]/30 bg-[#EFF6FF]",
          };

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-2xl border shadow-lg backdrop-blur-md flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-bottom-5 ${borders[t.type]}`}
            >
              {icons[t.type]}
              <div className="flex-1 min-w-0">
                {t.title && <h4 className="text-xs font-black text-[#2C221E] uppercase tracking-wider mb-0.5">{t.title}</h4>}
                <p className="text-xs font-semibold text-[#4A3E35] leading-relaxed break-words">{t.message}</p>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-[#7C6E63] hover:text-[#2C221E] p-1 rounded-lg hover:bg-black/5 transition-colors shrink-0"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
