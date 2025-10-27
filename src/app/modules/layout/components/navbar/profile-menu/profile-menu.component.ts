import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ThemeService } from '../../../../../core/services/theme.service';
import { ClickOutsideDirective } from '../../../../../shared/directives/click-outside.directive';
import { AuthService } from 'src/app/modules/auth/service/auth.service';
import { AsyncPipe } from '@angular/common';
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
  const base = environment.apiUrl.replace(/\/api\/?$/, ''); // ตัด /api ออก
  return `${base}${url.startsWith('/') ? url : '/' + url}`;
}

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  templateUrl: './profile-menu.component.html',
  styleUrls: ['./profile-menu.component.css'],
  imports: [RouterLink, CommonModule, ClickOutsideDirective, AngularSvgIconModule, AsyncPipe],
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

  // จาก AuthService (fallback)
  user$ = this.auth.user$;

  // โปรไฟล์จาก API (อาจ null ถ้า error/ยังไม่มี)
  private profile$ = this.profile.getProfile().pipe(
    catchError(() => of(null)),
    startWith(null),
    shareReplay(1)
  );

  /**
   * View-model สำหรับเมนู: รวมโปรไฟล์กับ user$
   * - ถ้ามี profile → ใช้ชื่อ/อีเมล/รูปจาก profile ก่อน
   * - ถ้าไม่มี → fallback เป็น auth.user$
   */
  menuUser$ = combineLatest([this.profile$, this.user$]).pipe(
    map(([p, u]: any[]) => {
      const firstName = (p?.firstName ?? u?.firstName ?? '').trim();
      const lastName = (p?.lastName ?? u?.lastName ?? '').trim();
      const email = (p?.email ?? u?.email ?? '') || '';

      const displayName = [firstName, lastName].filter(Boolean).join(' ');
      const avatarSrc = toAbsolute(p?.avatarUrl) || u?.avatarUrl || null;

      return {
        displayName,
        email,
        avatarSrc,
      };
    }),
    shareReplay(1)
  );

  constructor(
    public themeService: ThemeService,
    private auth: AuthService,
    private router: Router,
    private profile: ProfileService
  ) { }

  get profileMenu(): ProfileItem[] {
    const L = (path: string) => ['/', this.locale, ...path.split('/').filter(Boolean)];
    return [
      { title: 'Your Profile', icon: './assets/icons/heroicons/outline/user-circle.svg', link: L('/directory/profile') },
      { title: 'Settings', icon: './assets/icons/heroicons/outline/cog-6-tooth.svg', link: L('/directory/setting') },
      { title: 'Log out', icon: './assets/icons/heroicons/outline/logout.svg', action: () => this.onLogout() },
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
