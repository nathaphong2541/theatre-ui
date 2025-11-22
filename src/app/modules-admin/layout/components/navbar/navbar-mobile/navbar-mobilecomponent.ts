import { Component, OnInit } from '@angular/core';
import { MenuService } from '../../../services/menu.service';
import { NavbarMobileMenuComponent } from './navbar-mobile-menu/navbar-mobile-menu.component';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar-mobile',
  templateUrl: './navbar-mobile.component.html',
  styleUrls: ['./navbar-mobile.component.css'],
  imports: [NgClass, AngularSvgIconModule, NavbarMobileMenuComponent],
})
export class NavbarMobileComponent implements OnInit {
  constructor(
    public menuService: MenuService,
    private router: Router
  ) { }

  ngOnInit(): void { }

  public toggleMobileMenu(): void {
    this.menuService.showMobileMenu = false;
  }

  /** helper ภายใน: ดึง prefix แรกจาก URL เช่น /en/... -> 'en' */
  private getLangPrefix(): string | null {
    const path = this.router.url.split('?')[0].split('#')[0];
    const segments = path.split('/').filter(Boolean);
    return segments.length > 0 ? segments[0] : null;
  }

  /** ใช้ใน template ได้ถ้าต้องการ: {{ langPrefix() }} หรือ [routerLink] binding */
  public langPrefix(): string | null {
    return this.getLangPrefix();
  }
}
