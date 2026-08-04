"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-dismiss after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: "fixed",
        bottom: "85px", // Above mobile nav if present
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        pointerEvents: "none"
      }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            background: t.type === "error" ? "#fee2e2" : t.type === "success" ? "#d1fae5" : "#ffffff",
            border: `2px solid ${t.type === "error" ? "#dc2626" : t.type === "success" ? "#059669" : "#1a1a1a"}`,
            color: t.type === "error" ? "#991b1b" : t.type === "success" ? "#065f46" : "#1a1a1a",
            padding: "0.85rem 1.25rem",
            borderRadius: "4px",
            boxShadow: "4px 4px 0px rgba(0,0,0,0.15)",
            fontFamily: "var(--font-mono)",
            fontWeight: 800,
            fontSize: "0.85rem",
            pointerEvents: "auto",
            animation: "slideIn 0.2s ease-out forwards",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            {t.type === "error" && <span>[ERROR]</span>}
            {t.type === "success" && <span>[SUCCESS]</span>}
            {t.type === "info" && <span>[INFO]</span>}
            {t.message}
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
