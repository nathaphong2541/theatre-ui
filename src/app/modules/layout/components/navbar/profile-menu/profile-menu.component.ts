import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ThemeService } from '../../../../../core/services/theme.service';
import { ClickOutsideDirective } from '../../../../../shared/directives/click-outside.directive';
import { AuthService } from 'src/app/modules/auth/service/auth.service';
import { AsyncPipe } from '@angular/common'; // ✅ เพิ่ม

type ProfileItem = {
  title: string;
  icon: string;
  link?: any[];
  action?: () => void;
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

  // ✅ ดึงข้อมูล user จาก AuthService
  user$ = this.auth.user$;

  constructor(
    public themeService: ThemeService,
    private auth: AuthService,
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
        action: () => this.onLogout(),
      },
    ];
  }

  onLogout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/', this.locale, 'auth', 'sign-in']),
      error: () => this.router.navigate(['/', this.locale, 'auth', 'sign-in'])
    });
  }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }
}
