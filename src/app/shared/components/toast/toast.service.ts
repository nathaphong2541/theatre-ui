// src/app/shared/toast/toast.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ToastOptions, ToastType } from './toast.model';

export interface ToastItem extends Required<ToastOptions> {
    // บังคับทุกฟิลด์หลังเติม default
}
@Injectable({ providedIn: 'root' })
export class ToastService {
    private _toasts$ = new BehaviorSubject<ToastItem[]>([]);
    toasts$ = this._toasts$.asObservable();

    private defaults: Omit<ToastItem, 'message' | 'id'> = {
        title: '',
        type: 'info',
        duration: 4000,
        dismissible: true,
        icon: '',
        actionText: '',
        onAction: () => { },
        message: '' // placeholder (จะถูกแทน)
    } as any;

    show(opts: ToastOptions) {
        const id = opts.id ?? crypto.randomUUID();
        const t: ToastItem = {
            id,
            ...this.defaults,
            ...opts,
        };
        this._toasts$.next([...this._toasts$.value, t]);
        return id;
    }

    success(message: string, o: Partial<ToastOptions> = {}) {
        return this.show({ message, type: 'success', ...o });
    }
    error(message: string, o: Partial<ToastOptions> = {}) {
        return this.show({ message, type: 'error', ...o });
    }
    info(message: string, o: Partial<ToastOptions> = {}) {
        return this.show({ message, type: 'info', ...o });
    }
    warning(message: string, o: Partial<ToastOptions> = {}) {
        return this.show({ message, type: 'warning', ...o });
    }

    dismiss(id: string) {
        this._toasts$.next(this._toasts$.value.filter(t => t.id !== id));
    }

    clear() {
        this._toasts$.next([]);
    }
}
