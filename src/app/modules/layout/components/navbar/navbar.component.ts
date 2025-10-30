// src/app/layout/navbar/navbar.component.ts
import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { startWith, filter } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { MenuService } from '../../services/menu.service';
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
    RouterModule,
    TranslateModule,
    ProfileMenuComponent,
    LanguageMenuComponent
  ],
})
export class NavbarComponent implements OnInit {
  /** ใช้ observable + async pipe ให้เปลี่ยนทันทีที่ auth เปลี่ยน */
  isLoggedIn$!: Observable<boolean>;

  /** สถานะเมนูมือถือ (ซิงก์กับ MenuService เพื่อให้ component อื่นเห็นตรงกัน) */
  isMobileMenuOpen = false;

  constructor(
    private router: Router,
    private menuService: MenuService,
    private auth: AuthService
  ) { }

  ngOnInit(): void {
    // ตรวจสอบ session ครั้งแรก
    this.auth.checkSession();

    // subscribe เพื่ออัปเดต UI
    this.isLoggedIn$ = this.auth.isLoggedIn$.pipe(startWith(false));

    // ถ้ามีค่าเริ่มจาก service ก็เอามา sync (กันกรณีเปิดค้าง)
    this.isMobileMenuOpen = !!this.menuService.showMobileMenu;

    // ปิดเมนูอัตโนมัติเมื่อมีการนำทางหน้าใหม่ (UX ที่ดีบนมือถือ)
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.closeMobileMenu());
  }

  /** Toggle จากปุ่ม hamburger */
  public toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.menuService.showMobileMenu = this.isMobileMenuOpen;
  }

  /** ปิดเมนู (ใช้ตอนเปลี่ยนหน้า/คลิกลิงก์ในเมนูมือถือ) */
  public closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    this.menuService.showMobileMenu = false;
  }

  /** สำหรับ binding ไปยัง [attr.aria-expanded] */
  public get mobileMenuAriaExpanded(): 'true' | 'false' {
    return this.isMobileMenuOpen ? 'true' : 'false';
  }

  /** ปิดเมนูเมื่อหน้าจอกว้างถึง md (768px) เพื่อกันค้าง */
  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth >= 768 && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  public login(): void {
    this.router.navigate(['/en/auth/sign-in']);
  }
}
