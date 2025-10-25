import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ThemeService } from '../../../../../core/services/theme.service';
import { ClickOutsideDirective } from '../../../../../shared/directives/click-outside.directive';
import { AuthService } from 'src/app/modules/auth/service/auth.service';

type ProfileItem = {
  title: string;
  icon: string;
  link?: any[];
  action?: () => void; // ✅ เพิ่มเพื่อรองรับการทำงานของ logout
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
  @Input() locale: 'en' | 'th' = 'en';

  public isOpen = false;

  constructor(
    public themeService: ThemeService,
    private auth: AuthService,           // ✅ Inject service
    private router: Router
  ) { }

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
        action: () => this.onLogout(), // ✅ ใช้ action แทน routerLink
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

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

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

  /** ✅ ฟังก์ชัน logout */
  onLogout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/', this.locale, 'auth', 'sign-in']);
      },
      error: () => {
        // แม้ error ก็ redirect กลับ login เพื่อความปลอดภัย
        this.router.navigate(['/', this.locale, 'auth', 'sign-in']);
      }
    });
  }
}
