import React, { useEffect } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: "bg-[#FDF4F4] text-[#9E2A2B] border-[#9E2A2B]/20",
      btn: "bg-[#9E2A2B] hover:bg-[#842021] text-white shadow-md shadow-[#9E2A2B]/20",
      badge: "bg-[#FAF0E6] text-[#842021] border-[#E8D6C3]",
    },
    warning: {
      iconBg: "bg-[#FFFBEB] text-[#D97706] border-[#D97706]/20",
      btn: "bg-[#D97706] hover:bg-[#B45309] text-white shadow-md shadow-[#D97706]/20",
      badge: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
    },
    info: {
      iconBg: "bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20",
      btn: "bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md shadow-[#2563EB]/20",
      badge: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
    },
  };

  const currentStyle = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 max-w-md w-full shadow-2xl relative space-y-5 overflow-hidden animate-in zoom-in-95">
        <div className="h-2 w-full brick-gradient absolute top-0 left-0 right-0" />

        <div className="flex items-start justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${currentStyle.iconBg}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#2C221E]">{title}</h3>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${currentStyle.badge}`}>
                Confirmation
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-[#7C6E63] hover:text-[#2C221E] p-1.5 rounded-xl hover:bg-[#FAF7F2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[#6B5E53] leading-relaxed">
          {message}
        </p>

        <div className="pt-2 border-t border-[#EFE8DC] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B5E53] hover:bg-[#FAF7F2] border border-[#E5DACB] transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all hover:scale-102 disabled:opacity-50 ${currentStyle.btn}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
