"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";
interface Toast { id: number; type: ToastType; message: string; duration?: number; }
interface ToastContextValue { toast: (type: ToastType, message: string, duration?: number) => void; }

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

const icons: Record<ToastType, any> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors: Record<ToastType, string> = {
  success: "border-[#22c55e]/30 bg-green-theme text-green-theme",
  error: "border-[#ef4444]/30 bg-red-theme text-red-theme",
  warning: "border-[#f59e0b]/30 bg-amber-theme text-amber-theme",
  info: "border-[#2563eb]/30 bg-blue-theme text-blue-theme",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message, duration }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
        {toasts.map(t => {
          const Icon = icons[t.type];
          return (
            <div key={t.id} className={`toast-enter flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg ${colors[t.type]}`}>
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs font-medium flex-1">{t.message}</span>
              <button onClick={() => setToasts(prev => prev.filter(tt => tt.id !== t.id))} className="hover:opacity-70">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
