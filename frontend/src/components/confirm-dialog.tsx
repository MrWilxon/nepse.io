"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
}
interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue>({ confirm: () => Promise.resolve(false) });

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ options: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>(resolve => setState({ options, resolve }));
  }, []);

  const handleResult = (result: boolean) => {
    state?.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => handleResult(false)} />
          <div className="relative card-3d p-6 w-full max-w-sm cmd-content">
            <div className="flex items-start gap-3 mb-4">
              <div className={`p-2 rounded-lg ${state.options.variant === "danger" ? "bg-red-theme" : "bg-amber-theme"}`}>
                <AlertTriangle className={`h-5 w-5 ${state.options.variant === "danger" ? "text-red-theme" : "text-amber-theme"}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-primary-theme">{state.options.title}</h3>
                <p className="text-xs text-muted-theme mt-1">{state.options.message}</p>
              </div>
              <button onClick={() => handleResult(false)} className="text-muted-theme hover:text-primary-theme"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => handleResult(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-theme hover:text-primary-theme border border-theme hover:border-hover-theme transition-colors">
                {state.options.cancelLabel || "Cancel"}
              </button>
              <button onClick={() => handleResult(true)} className={`px-3 py-1.5 rounded-lg text-xs font-medium text-primary-theme transition-colors ${state.options.variant === "danger" ? "bg-red-theme hover:bg-[#dc2626]" : "bg-accent-theme hover:bg-[#E8B830]"}`}>
                {state.options.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
