import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ThemeService } from '../../../../../core/services/theme.service';
import { ClickOutsideDirective } from '../../../../../shared/directives/click-outside.directive';

type ProfileItem = {
  title: string;
  icon: string;
  link: any[]; // ใช้ routerLink แบบ array เพื่อเปลี่ยน prefix ตาม locale ได้ง่าย
};

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  templateUrl: './profile-menu.component.html',
  styleUrls: ['./profile-menu.component.css'],
  imports: [RouterLink, CommonModule, ClickOutsideDirective, AngularSvgIconModule],
  animations: [
    trigger('openClose', [
      state('open', style({ opacity: 1, transform: 'translateY(0)', visibility: 'visible' })),
      state('closed', style({ opacity: 0, transform: 'translateY(-12px)', visibility: 'hidden' })),
      transition('open <=> closed', [animate('0.2s ease-out')]),
    ]),
  ],
})
export class ProfileMenuComponent {
  @Input() locale: 'en' | 'th' = 'en'; // ใช้ค่าจากภายนอก (หรือฉีด LocaleSwitcherService แทนก็ได้)

  public isOpen = false;

  get profileMenu(): ProfileItem[] {
    const L = (path: string) => ['/', this.locale, ...path.split('/').filter(Boolean)];
    return [
      {
        title: 'Your Profile',
        icon: './assets/icons/heroicons/outline/user-circle.svg',
        link: L('/directory/profile'),
      },
      {
        title: 'Settings',
        icon: './assets/icons/heroicons/outline/cog-6-tooth.svg',
        link: L('/directory/setting'),
      },
      {
        title: 'Log out',
        icon: './assets/icons/heroicons/outline/logout.svg',
        link: ['/auth'],
      },
    ];
  }

  public themeColors = [
    { name: 'base', code: '#e11d48' },
    { name: 'yellow', code: '#f59e0b' },
    { name: 'green', code: '#22c55e' },
    { name: 'blue', code: '#3b82f6' },
    { name: 'orange', code: '#ea580c' },
    { name: 'red', code: '#cc0022' },
    { name: 'violet', code: '#6d28d9' },
  ];

  public themeMode: Array<'light' | 'dark'> = ['light', 'dark'];
  public themeDirection: Array<'ltr' | 'rtl'> = ['ltr', 'rtl'];

  constructor(public themeService: ThemeService) { }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

  // ✅ แก้บั๊ก: สลับโหมดให้ถูกต้อง
  toggleThemeMode(): void {
    this.themeService.theme.update((theme) => {
      const mode = this.themeService.isDark ? 'light' : 'dark';
      return { ...theme, mode };
    });
  }

  toggleThemeColor(color: string): void {
    this.themeService.theme.update((theme) => ({ ...theme, color }));
  }

  setDirection(value: 'ltr' | 'rtl'): void {
    this.themeService.theme.update((theme) => ({ ...theme, direction: value }));
  }
}
