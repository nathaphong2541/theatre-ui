// src/app/layout/navbar/navbar.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { MenuService } from '../../services/menu.service';
import { NavbarMobileComponent } from './navbar-mobile/navbar-mobilecomponent';
import { ProfileMenuComponent } from './profile-menu/profile-menu.component';
import { LanguageMenuComponent } from 'src/locale/language-menu.component';
import { AuthService } from 'src/app/modules/auth/service/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  imports: [
    CommonModule,
    AngularSvgIconModule,
    TranslateModule,
    ProfileMenuComponent,
    NavbarMobileComponent,
    LanguageMenuComponent,
    RouterLink
  ],
})
export class NavbarComponent implements OnInit {
  // ใช้ observable + async pipe ให้เปลี่ยนทันทีที่ auth เปลี่ยน
  isLoggedIn$!: Observable<boolean>;

  constructor(
    private router: Router,
    private menuService: MenuService,
    private auth: AuthService
  ) { }

  ngOnInit(): void {
    // ตรวจสอบ session ครั้งแรก
    this.auth.checkSession();

    // subscribe เพื่ออัปเดต UI
    this.isLoggedIn$ = this.auth.isLoggedIn$.pipe(
      startWith(false)
    );
  }

  public toggleMobileMenu(): void {
    this.menuService.showMobileMenu = true;
  }

  /** ✅ helper ภายใน: ดึง prefix แรกจาก URL เช่น /en/... -> 'en' */
  private getLangPrefix(): string | null {
    const path = this.router.url.split('?')[0].split('#')[0];
    const segments = path.split('/').filter(Boolean);
    return segments.length > 0 ? segments[0] : null;
  }

  /** ถ้าอยากเรียกใน template ก็ใช้ตัวนี้แทนได้ */
  langPrefix(): string | null {
    return this.getLangPrefix();
  }

  // ✅ login ไม่ fix /en แล้ว
  login() {
    const lang = this.getLangPrefix();

    if (lang) {
      this.router.navigate(['/', lang, 'auth', 'sign-in']);
    } else {
      this.router.navigate(['/auth/sign-in']);
    }
  }
}
