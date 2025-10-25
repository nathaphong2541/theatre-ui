// src/app/shared/toast/toast.model.ts
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
    id?: string;
    title?: string;
    message: string;
    type?: ToastType;
    duration?: number;       // ms (default 4000)
    dismissible?: boolean;
    icon?: string;
    actionText?: string;
    onAction?: () => void;
    onTimeout?: () => void;  // ✅ callback เมื่อหมดเวลา
}
