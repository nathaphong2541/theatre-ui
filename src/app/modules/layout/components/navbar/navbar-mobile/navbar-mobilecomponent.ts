import { Component, OnInit } from '@angular/core';
import { MenuService } from '../../../services/menu.service';
import { NavbarMobileMenuComponent } from './navbar-mobile-menu/navbar-mobile-menu.component';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgClass } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar-mobile',
  templateUrl: './navbar-mobile.component.html',
  styleUrls: ['./navbar-mobile.component.css'],
  imports: [NgClass, AngularSvgIconModule, NavbarMobileMenuComponent, RouterModule],
})
export class NavbarMobileComponent implements OnInit {
  constructor(public menuService: MenuService, private router: Router) {}

  ngOnInit(): void {}

  public toggleMobileMenu(): void {
    this.menuService.showMobileMenu = false;
  }

  /** helper ภายใน: ดึง prefix แรกจาก URL เช่น /en/... -> 'en' */
  private getLangPrefix(): string | null {
    const path = this.router.url.split('?')[0].split('#')[0];
    const segments = path.split('/').filter(Boolean);
    return segments.length > 0 ? segments[0] : null;
  }

  /** ถ้าอยากใช้ใน template ภายหลังก็เรียกตัวนี้ได้ */
  public langPrefix(): string | null {
    return this.getLangPrefix();
  }

  /** login: ไม่ fix /en แล้ว วิ่งตามภาษาปัจจุบัน */
  public login(): void {
    const lang = this.getLangPrefix();

    if (lang) {
      this.router.navigate(['/', lang, 'auth', 'sign-in']);
    } else {
      this.router.navigate(['/auth/sign-in']);
    }
  }
}
