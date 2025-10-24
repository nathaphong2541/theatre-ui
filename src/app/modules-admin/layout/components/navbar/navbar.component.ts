// src/app/layout/navbar/navbar.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';

import { MenuService } from '../../services/menu.service';
import { NavbarMobileComponent } from './navbar-mobile/navbar-mobilecomponent';
import { ProfileMenuComponent } from './profile-menu/profile-menu.component';
import { LanguageMenuComponent } from 'src/locale/language-menu.component';
import { AuthService } from 'src/app/core/services/auth.service';

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
  isLoggedIn = false;

  constructor(
    private router: Router,
    private menuService: MenuService,
    private auth: AuthService
  ) { }

  ngOnInit(): void {
    this.isLoggedIn = this.auth.hasToken();
    this.auth.isLoggedIn$.subscribe(v => this.isLoggedIn = v);
  }

  public toggleMobileMenu(): void {
    this.menuService.showMobileMenu = true;
  }

  public login(): void {
    this.router.navigate(['/en/auth/sign-in']);
  }
}
