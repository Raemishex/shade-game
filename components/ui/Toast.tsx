"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, createContext, useContext, useCallback, ReactNode } from "react";

// ---------- Toast Types ----------
type ToastVariant = "success" | "error" | "info";

interface ToastMessage {
  id: number;
  variant: ToastVariant;
  message: string;
}

const variantStyles: Record<ToastVariant, { bg: string; icon: string }> = {
  success: { bg: "bg-green/20 border-green/30 text-green", icon: "✓" },
  error: { bg: "bg-red/20 border-red/30 text-red", icon: "✕" },
  info: { bg: "bg-blue/20 border-blue/30 text-blue", icon: "ℹ" },
};

// ---------- Toast Item ----------
function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: number) => void }) {
  const style = variantStyles[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm
        font-nunito text-sm ${style.bg}
      `}
    >
      <span className="text-base font-bold">{style.icon}</span>
      <span>{toast.message}</span>
    </motion.div>
  );
}

// ---------- Toast Context ----------
interface ToastContextType {
  showToast: (variant: ToastVariant, message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ---------- Toast Provider ----------
let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((variant: ToastVariant, message: string) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, variant, message }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
