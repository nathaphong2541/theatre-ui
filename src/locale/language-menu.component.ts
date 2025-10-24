import { Component, ElementRef, HostListener, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocaleSwitcherService } from './locale-switcher.service';

@Component({
    selector: 'app-language-menu',
    standalone: true,
    imports: [CommonModule],
    template: `
  <div class="relative inline-block text-left">
    <!-- Trigger -->
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-xl border px-2 py-2 bg-white shadow-sm hover:bg-gray-50"
      (click)="toggle()"
      [attr.aria-expanded]="open()"
      aria-haspopup="listbox"
      aria-controls="lang-menu-listbox">
      <img
        [src]="currentFlagSrc()"
        alt=""
        class="h-5 w-5 rounded-sm object-cover"
        width="20" height="20" />
      <span class="sr-only">{{ currentLabel() }}</span>
      <svg viewBox="0 0 20 20" class="h-4 w-4" aria-hidden="true">
        <path fill="currentColor" d="M5.5 7.5L10 12l4.5-4.5H5.5z"/>
      </svg>
    </button>

    <!-- Menu -->
    <div *ngIf="open()"
         id="lang-menu-listbox"
         role="listbox"
         class="absolute right-0 z-50 mt-2 w-44 origin-top-right rounded-xl border bg-white p-1 shadow-lg"
         (keydown)="onListKeydown($event)">

      <!-- EN -->
      <button #enBtn role="option"
              [attr.aria-selected]="isCurrent('en')"
              [disabled]="isCurrent('en')"
              class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 hover:bg-gray-100 disabled:opacity-60"
              (click)="pick('en')">
        <span class="flex items-center gap-2">
          <img src="assets/flags/flag-en.svg" alt="" class="h-5 w-5 rounded-sm object-cover" width="20" height="20" />
          <span i18n="@@flagEng">{{ enLabel }}</span>
        </span>
        <span *ngIf="isCurrent('en')" aria-hidden="true">✓</span>
      </button>
      <!-- TH -->
      <button #thBtn role="option"
              [attr.aria-selected]="isCurrent('th')"
              [disabled]="isCurrent('th')"
              class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 hover:bg-gray-100 disabled:opacity-60"
              (click)="pick('th')">
        <span class="flex items-center gap-2">
          <img src="assets/flags/flag-th.svg" alt="" class="h-5 w-5 rounded-sm object-cover" width="20" height="20" />
          <span i18n="@@flagTh">{{ thLabel }}</span>
        </span>
        <span *ngIf="isCurrent('th')" aria-hidden="true">✓</span>
      </button>
    </div>
  </div>
  `,
})
export class LanguageMenuComponent {
    open = signal(false);
    thLabel = $localize`:@@langTH:ไทย`;
    enLabel = $localize`:@@langEN:English`;

    @ViewChild('thBtn') thBtn!: ElementRef<HTMLButtonElement>;
    @ViewChild('enBtn') enBtn!: ElementRef<HTMLButtonElement>;

    constructor(private ls: LocaleSwitcherService, private el: ElementRef) { }

    currentLabel() {
        return this.isCurrent('en') ? this.enLabel : this.thLabel;
    }

    currentFlagSrc() {
        return this.isCurrent('en')
            ? 'assets/flags/flag-en.svg'
            : 'assets/flags/flag-th.svg';
    }

    isCurrent(l: 'th' | 'en') {
        return this.ls.currentLocale() === l;
    }

    toggle() {
        const next = !this.open();
        this.open.set(next);
        if (next) {
            queueMicrotask(() => {
                (this.isCurrent('en') ? this.thBtn : this.enBtn)?.nativeElement.focus();
            });
        }
    }

    pick(l: 'th' | 'en') {
        this.open.set(false);
        if (!this.isCurrent(l)) this.ls.switchTo(l);
    }

    @HostListener('document:click', ['$event'])
    onDocClick(ev: MouseEvent) {
        if (!this.el.nativeElement.contains(ev.target)) this.open.set(false);
    }

    onListKeydown(ev: KeyboardEvent) {
        const active = document.activeElement as HTMLElement | null;
        switch (ev.key) {
            case 'Escape':
                this.open.set(false);
                (this.el.nativeElement as HTMLElement).querySelector('button')?.focus();
                break;
            case 'ArrowDown':
                ev.preventDefault();
                if (active === this.thBtn?.nativeElement) this.enBtn?.nativeElement.focus();
                else this.thBtn?.nativeElement.focus();
                break;
            case 'ArrowUp':
                ev.preventDefault();
                if (active === this.enBtn?.nativeElement) this.thBtn?.nativeElement.focus();
                else this.enBtn?.nativeElement.focus();
                break;
            case 'Enter':
            case ' ':
                (active as HTMLButtonElement)?.click();
                break;
        }
    }
}
