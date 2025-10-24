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
    class="group inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/80 px-2.5 py-2
           shadow-sm backdrop-blur transition-all duration-200 hover:bg-white focus:outline-none
           focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
    (click)="toggle()"
    [attr.aria-expanded]="open()"
    aria-haspopup="listbox"
    aria-controls="lang-menu-listbox">
    <span class="relative">
      <span class="absolute -inset-0.5 rounded-md bg-gradient-to-tr from-fuchsia-500/20 via-purple-500/20 to-sky-500/20 blur-sm opacity-0 transition group-hover:opacity-100"></span>
      <img
        [src]="currentFlagSrc()"
        alt=""
        class="relative h-5 w-5 rounded-[6px] object-cover ring-1 ring-black/5"
        width="20" height="20" />
    </span>

    <span class="sr-only">{{ currentLabel() }}</span>

    <!-- caret -->
    <svg viewBox="0 0 20 20"
         class="h-4 w-4 text-gray-600 transition-transform duration-200 group-hover:text-gray-800"
         [class.rotate-180]="open()"
         aria-hidden="true">
      <path fill="currentColor" d="M5.5 7.5L10 12l4.5-4.5H5.5z"/>
    </svg>
  </button>

  <!-- Menu -->
  <div *ngIf="open()"
       id="lang-menu-listbox"
       role="listbox"
       class="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-2xl border border-gray-200
              bg-white/90 p-1.5 shadow-xl ring-1 ring-black/5 backdrop-blur
              animate-in fade-in zoom-in-95"
       (keydown)="onListKeydown($event)">

    <!-- Header (optional visual) -->
    <div class="mx-1 mb-1 rounded-lg bg-gradient-to-r from-fuchsia-500/10 via-purple-500/10 to-sky-500/10 px-3 py-2 text-xs font-medium text-gray-600">
      Choose language
    </div>

    <!-- EN -->
    <button #enBtn role="option"
            [attr.aria-selected]="isCurrent('en')"
            [disabled]="isCurrent('en')"
            class="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5
                   text-sm text-gray-800 transition hover:bg-gray-50
                   disabled:cursor-default disabled:opacity-60"
            (click)="pick('en')">
      <span class="flex items-center gap-2">
        <img src="assets/flags/flag-en.svg" alt="" class="h-5 w-5 rounded-[6px] object-cover ring-1 ring-black/5" width="20" height="20" />
        <span i18n="@@flagEng">{{ enLabel }}</span>
      </span>
      <svg *ngIf="isCurrent('en')" class="h-4 w-4 text-emerald-600" viewBox="0 0 20 20" aria-hidden="true">
        <path fill="currentColor" d="M8.143 13.314l-3.39-3.39 1.2-1.2 2.19 2.19 5.302-5.303 1.2 1.2z"/>
      </svg>
    </button>

    <!-- TH -->
    <button #thBtn role="option"
            [attr.aria-selected]="isCurrent('th')"
            [disabled]="isCurrent('th')"
            class="mt-1 flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5
                   text-sm text-gray-800 transition hover:bg-gray-50
                   disabled:cursor-default disabled:opacity-60"
            (click)="pick('th')">
      <span class="flex items-center gap-2">
        <img src="assets/flags/flag-th.svg" alt="" class="h-5 w-5 rounded-[6px] object-cover ring-1 ring-black/5" width="20" height="20" />
        <span i18n="@@flagTh">{{ thLabel }}</span>
      </span>
      <svg *ngIf="isCurrent('th')" class="h-4 w-4 text-emerald-600" viewBox="0 0 20 20" aria-hidden="true">
        <path fill="currentColor" d="M8.143 13.314l-3.39-3.39 1.2-1.2 2.19 2.19 5.302-5.303 1.2 1.2z"/>
      </svg>
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
