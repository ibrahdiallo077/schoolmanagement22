// src/hooks/use-toast.ts
import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

// Store global des toasts (simple implémentation)
let toastIdCounter = 0;
const toastListeners: Array<(toasts: Toast[]) => void> = [];
let currentToasts: Toast[] = [];

const addToast = (toast: Omit<Toast, 'id'>) => {
  const id = (++toastIdCounter).toString();
  const newToast: Toast = {
    id,
    duration: 5000,
    ...toast
  };

  currentToasts = [...currentToasts, newToast];
  
  // Notifier tous les listeners
  toastListeners.forEach(listener => listener(currentToasts));

  // Auto-remove after duration
  if (newToast.duration && newToast.duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
  }

  return id;
};

const removeToast = (id: string) => {
  currentToasts = currentToasts.filter(toast => toast.id !== id);
  toastListeners.forEach(listener => listener(currentToasts));
};

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>(currentToasts);

  // S'abonner aux changements
  useState(() => {
    const listener = (newToasts: Toast[]) => {
      setToasts(newToasts);
    };
    
    toastListeners.push(listener);
    
    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  });

  const toast = useCallback((options: ToastOptions) => {
    return addToast(options);
  }, []);

  const dismiss = useCallback((id: string) => {
    removeToast(id);
  }, []);

  return {
    toast,
    dismiss,
    toasts
  };
};

// Hook pour afficher les toasts dans un composant
export const useToastDisplay = () => {
  const [toasts, setToasts] = useState<Toast[]>(currentToasts);

  useState(() => {
    const listener = (newToasts: Toast[]) => {
      setToasts(newToasts);
    };
    
    toastListeners.push(listener);
    
    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  });

  return toasts;
};