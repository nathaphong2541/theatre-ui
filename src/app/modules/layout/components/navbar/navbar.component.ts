// src/app/layout/navbar/navbar.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
    LanguageMenuComponent
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

  public login(): void {
    this.router.navigate(['/en/auth/sign-in']);
  }
}
