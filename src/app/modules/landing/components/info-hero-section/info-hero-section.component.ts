import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, startWith, Subscription } from 'rxjs';
import { AuthService } from 'src/app/modules/auth/service/auth.service';

@Component({
  selector: '[info-hero-section]',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './info-hero-section.component.html',
  styleUrl: './info-hero-section.component.css'
})
export class InfoHeroSectionComponent implements OnInit, OnDestroy {
  q: string = '';

  isLoggedIn$!: Observable<boolean>;
  private isLoggedInNow = false;

  private sub?: Subscription;

  constructor(
    private router: Router,
    private auth: AuthService
  ) { }

  ngOnInit(): void {
    // เช็ค session ครั้งแรก
    this.auth.checkSession();

    // สำหรับใช้ใน template ถ้าอยากโชว์ปุ่ม/ข้อความตามสถานะ
    this.isLoggedIn$ = this.auth.isLoggedIn$.pipe(
      startWith(false)
    );

    // ✅ subscribe จริง ๆ เพื่ออัปเดต isLoggedInNow
    this.sub = this.auth.isLoggedIn$
      .pipe(startWith(false))
      .subscribe(flag => {
        this.isLoggedInNow = flag;
        // console.log('isLoggedInNow = ', flag);
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private getLangPrefix(): string | null {
    const pathOnly = this.router.url.split('#')[0].split('?')[0]; // ✅ ตัด fragment
    const segments = pathOnly.split('/').filter(Boolean);
    const supported = ['th', 'en'];
    return supported.includes(segments[0]) ? segments[0] : null;
  }

  goToMember(): void {
    const lang = this.getLangPrefix();
    this.router.navigate([`/${lang}/member`]);
  }

  onClickOpportunity(): void {
    const lang = this.getLangPrefix();

    if (this.isLoggedInNow) {
      // ✅ login แล้ว → ไปหน้า directory/profile
      this.router.navigate([`/${lang}/directory/profile`]);
    } else {
      // ✅ ยังไม่ login → ไปหน้า sign-in
      this.router.navigate([`/${lang}/auth/sign-in`]);
    }
  }
}
