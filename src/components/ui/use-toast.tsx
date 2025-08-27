"use client";

import * as React from "react";
import {
  ToastProvider as RadixToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastViewport
} from "@radix-ui/react-toast";

type ToastMessage = {
  id: string;
  title?: string;
  description?: string;
};

type ToastContextType = {
  toast: (opts: { title?: string; description?: string }) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const toast = ({ title, description }: { title?: string; description?: string }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToastProvider>
        {children}
        {toasts.map(({ id, title, description }) => (
          <Toast key={id}>
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </RadixToastProvider>
    </ToastContext.Provider>
  );
}
