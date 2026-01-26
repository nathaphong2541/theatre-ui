import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { InfoHeroSectionComponent } from '../../components/info-hero-section/info-hero-section.component';
import { InfoAboutComponent } from '../../components/info-about/info-about.component';
import { InfoNewsComponent } from '../../components/info-news/info-news.component';
import { InfoSearchComponent } from '../../components/info-search/info-search.component';
import { InfoDonetComponent } from '../../components/info-donet/info-donet.component';
import { InfoScriptComponent } from '../../components/info-script/info-script.component';
import { Observable, startWith } from 'rxjs';
import { AuthService } from 'src/app/modules/auth/service/auth.service';
import { LanguageMenuComponent } from 'src/locale/language-menu.component';

@Component({
  selector: 'app-main-pages',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InfoHeroSectionComponent,
    InfoAboutComponent,
    InfoSearchComponent,
    InfoScriptComponent,
    InfoDonetComponent,
    LanguageMenuComponent
  ],
  templateUrl: './main-pages.component.html',
  styleUrl: './main-pages.component.css'
})
export class MainPagesComponent implements OnInit {

  showScrollTop = false;

  showProfilePopup = false;
  dontShowAgain = false;

  isLoggedIn$!: Observable<boolean>;

  private readonly DISMISS_KEY = 'tht_profile_onboarding_dismissed';

  constructor(private router: Router, private auth: AuthService) { }

  ngOnInit(): void {
    this.isLoggedIn$ = this.auth.isLoggedIn$.pipe(startWith(false));

    this.isLoggedIn$.subscribe(isLogged => {
      if (isLogged) {
        this.showProfilePopup = false;
        return;
      }

      const dismissed = localStorage.getItem(this.DISMISS_KEY) === 'true'; // ✅ อ่านสด
      this.showProfilePopup = !dismissed;
    });
  }

  /** helper: ดึง prefix แรกจาก URL เช่น /en/... -> 'en' */
  private getLangPrefix(): string | null {
    const path = this.router.url.split('?')[0].split('#')[0];
    const segments = path.split('/').filter(Boolean);
    return segments.length > 0 ? segments[0] : null;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const yOffset = window.scrollY || document.documentElement.scrollTop;
    this.showScrollTop = yOffset > 300;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** กดปุ่ม “ลงทะเบียน” */
  onGoRegister(): void {
    this.showProfilePopup = false;

    const lang = this.getLangPrefix();

    if (lang) {
      // URL: /en/auth/sign-in
      this.router.navigate(['/', lang, 'auth', 'sign-in']);
    } else {
      // URL: /auth/sign-in
      this.router.navigate(['/auth', 'sign-in']);
    }
  }

  onCloseProfilePopup(): void {
    // ✅ ถ้าอยู่หน้า sign-in / auth ห้ามเขียน localStorage เด็ดขาด
    const url = this.router.url.split('?')[0].split('#')[0];
    if (url.includes('/auth/sign-in')) {
      this.showProfilePopup = false;
      return;
    }

    if (this.dontShowAgain) {
      localStorage.setItem(this.DISMISS_KEY, 'true');
    }
    this.showProfilePopup = false;
  }
}