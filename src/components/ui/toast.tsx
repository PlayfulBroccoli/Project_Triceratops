"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Toast = { id: number; msg: string; tone: "success" | "error" | "info" };
type Ctx = { toasts: Toast[]; toast: (msg: string, tone?: Toast["tone"]) => void; dismiss: (id: number) => void };

const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback((msg: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, tone }]);
  }, []);

  return (
    <ToastCtx.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const tone =
    toast.tone === "error"
      ? "border-destructive/50 bg-destructive/10 text-destructive"
      : toast.tone === "info"
      ? "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300"
      : "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur animate-in slide-in-from-bottom-2 fade-in ${tone}`}
    >
      <span className="flex-1">{toast.msg}</span>
      <button onClick={onDismiss} className="text-current/70 hover:text-current text-xs">
        ✕
      </button>
    </div>
  );
}
