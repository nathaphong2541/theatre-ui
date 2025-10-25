// src/app/shared/toast/toast-container.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { ToastService } from './toast.service';
import { ToastItem } from './toast.service';
import { Subscription, timer } from 'rxjs';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule],
    template: `
  <!-- ✅ Overlay เบลอพื้นหลัง -->
  <div *ngIf="toasts.length > 0" 
       class="fixed inset-0 z-[9998] backdrop-blur-sm bg-black/30 pointer-events-auto"
       (click)="blockClick($event)">
  </div>

  <!-- ✅ Toast เอง -->
  <div class="pointer-events-none fixed inset-0 z-[9999] flex flex-col items-end gap-2 p-4 sm:p-6"
       [class.items-start]="position.startsWith('left')"
       [class.items-end]="position.startsWith('right')"
       [class.justify-start]="position.endsWith('top')"
       [class.justify-end]="position.endsWith('bottom')">
    <div *ngFor="let t of toasts"
         [@pop] 
         class="pointer-events-auto w-full max-w-sm rounded-2xl border border-dashed shadow-custom p-4
                bg-background/95 backdrop-blur-lg text-foreground">
      <div class="flex items-start gap-3">
        <div class="shrink-0 mt-0.5" [innerHTML]="getIcon(t)"></div>
        <div class="flex-1">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div *ngIf="t.title" class="font-medium line-clamp-1">{{ t.title }}</div>
              <div class="text-sm opacity-90 break-words">{{ t.message }}</div>
            </div>
            <button *ngIf="t.dismissible"
                    class="opacity-60 hover:opacity-100 transition"
                    (click)="close(t.id)"
                    aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.4 4.98 4.98 6.4 10.59 12l-5.6 5.6 1.41 1.41L12 13.41l5.6 5.6 1.41-1.41-5.6-5.6 5.6-5.6L17.6 4.98 12 10.59z"/>
              </svg>
            </button>
          </div>
          <div class="mt-3 flex items-center gap-2" *ngIf="t.actionText">
            <button class="text-sm underline underline-offset-4 hover:opacity-100 opacity-90"
                    (click)="action(t)">
              {{ t.actionText }}
            </button>
          </div>
          <div class="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted/40">
            <div class="h-full" [ngClass]="barClass(t)"
                 [style.width.%]="progress[t.id] || 100"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
    animations: [
        trigger('pop', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(8px) scale(0.98)' }),
                animate('160ms ease-out', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
            ]),
            transition(':leave', [
                animate('140ms ease-in', style({ opacity: 0, transform: 'translateY(-6px) scale(0.98)' }))
            ]),
        ]),
    ],
})
export class ToastContainerComponent implements OnInit, OnDestroy {
    toasts: ToastItem[] = [];
    progress: Record<string, number> = {};
    position: 'right-top' | 'right-bottom' | 'left-top' | 'left-bottom' = 'right-top';

    private sub?: Subscription;
    private timers = new Map<string, { start: number; remaining: number; sub: Subscription }>();
    private hovering = new Set<string>();

    constructor(private toast: ToastService) { }

    ngOnInit(): void {
        this.sub = this.toast.toasts$.subscribe(items => {
            const existingIds = new Set(this.toasts.map(t => t.id));
            this.toasts = items;
            for (const t of items) {
                if (!existingIds.has(t.id)) this.startTimer(t);
            }
            for (const id of Array.from(this.timers.keys())) {
                if (!items.find(i => i.id === id)) this.clearTimer(id);
            }
        });
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        for (const id of Array.from(this.timers.keys())) this.clearTimer(id);
    }

    private startTimer(t: ToastItem) {
        if (t.duration <= 0) {
            this.progress[t.id] = 100;
            return;
        }
        const stepMs = 50;
        const total = t.duration;
        this.timers.set(t.id, {
            start: Date.now(),
            remaining: total,
            sub: timer(0, stepMs).subscribe(() => {
                if (this.hovering.has(t.id)) return;
                const rec = this.timers.get(t.id);
                if (!rec) return;
                rec.remaining -= stepMs;
                this.progress[t.id] = Math.max(0, Math.round((rec.remaining / total) * 100));
                if (rec.remaining <= 0) {
                    this.clearTimer(t.id);
                    this.toast.dismiss(t.id);
                    t.onTimeout?.(); // ✅ เรียก callback redirect ได้ที่นี่
                }
            }),
        });
    }

    private clearTimer(id: string) {
        this.timers.get(id)?.sub.unsubscribe();
        this.timers.delete(id);
        delete this.progress[id];
    }

    close(id: string) {
        this.clearTimer(id);
        this.toast.dismiss(id);
    }

    action(t: ToastItem) {
        try { t.onAction?.(); } finally { this.close(t.id); }
    }

    barClass(t: ToastItem) {
        switch (t.type) {
            case 'success': return 'bg-green-500/80';
            case 'error': return 'bg-red-500/80';
            case 'warning': return 'bg-yellow-500/80';
            default: return 'bg-blue-500/80';
        }
    }

    getIcon(t: ToastItem) {
        if (t.icon) return t.icon;
        const base = 'class="size-5 opacity-90" fill="currentColor"';
        switch (t.type) {
            case 'success':
                return `<svg ${base} viewBox="0 0 24 24"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
            case 'error':
                return `<svg ${base} viewBox="0 0 24 24"><path d="M12 2 1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V8h2v5z"/></svg>`;
            case 'warning':
                return `<svg ${base} viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2V9h2v5z"/></svg>`;
            default:
                return `<svg ${base} viewBox="0 0 24 24"><path d="M11 7h2v2h-2V7zm0 4h2v6h-2v-6z"/></svg>`;
        }
    }

    /** ✅ ป้องกันการคลิกทะลุ overlay */
    blockClick(e: MouseEvent) {
        e.stopPropagation();
        e.preventDefault();
    }
}
