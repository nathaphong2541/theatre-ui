import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ThemeService } from '../../../../../core/services/theme.service';
import { ClickOutsideDirective } from '../../../../../shared/directives/click-outside.directive';
import { AuthService } from 'src/app/modules/auth/service/auth.service';
import { ProfileService } from 'src/app/modules-admin/directory/service/profile.service';
import { environment } from 'src/environments/environment';
import { combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, startWith } from 'rxjs/operators';

type ProfileItem = {
  title: string;
  icon: string;
  link?: any[];
  action?: () => void;
};

function toAbsolute(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  // สมมติ backend base เป็น https://domain (apiUrl อาจเป็น https://domain/api)
  const base = environment.apiUrl.replace(/\/api\/?$/, '');
  return `${base}${url.startsWith('/') ? url : '/' + url}`;
}

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
    private auth: AuthService,
    private router: Router,
    private profileApi: ProfileService
  ) { }

  // 1) โปรไฟล์จาก API (อาจไม่มี/ล้มเหลว → null)
  private profile$ = this.profileApi.getProfile().pipe(
    catchError(() => of(null)),
    startWith(null),
    shareReplay(1)
  );

  // 2) รวม profile + auth.user$ → view model สำหรับเมนู
  menuUser$ = combineLatest([this.profile$, this.auth.user$]).pipe(
    map(([p, u]: any[]) => {
      const first = (p?.firstName ?? u?.firstName ?? '').trim();
      const last = (p?.lastName ?? u?.lastName ?? '').trim();
      const email = (p?.email ?? u?.email ?? '') || '';
      const avatarSrc = toAbsolute(p?.avatarUrl) || u?.avatarUrl || null;
      return {
        displayName: [first, last].filter(Boolean).join(' '),
        email,
        avatarSrc,
      };
    }),
    shareReplay(1)
  );

  get profileMenu(): ProfileItem[] {
    const L = (path: string) => ['/', this.locale, ...path.split('/').filter(Boolean)];
    return [
      { title: 'Your Profile', icon: './assets/icons/heroicons/outline/user-circle.svg', link: L('/directory/profile') },
      { title: 'Settings', icon: './assets/icons/heroicons/outline/cog-6-tooth.svg', link: L('/directory/setting') },
      { title: 'Log out', icon: './assets/icons/heroicons/outline/logout.svg', action: () => this.onLogout() },
    ];
  }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

  onLogout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/', this.locale, 'auth', 'sign-in']),
      error: () => this.router.navigate(['/', this.locale, 'auth', 'sign-in']),
    });
  }
}
