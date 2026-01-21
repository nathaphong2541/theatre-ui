import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LanguageMenuComponent } from 'src/locale/language-menu.component';

@Component({
  selector: 'app-policy-conset',
  standalone: true,
  imports: [CommonModule, LanguageMenuComponent],
  templateUrl: './policy-conset.component.html',
  styleUrls: ['./policy-conset.component.css'],
})
export class PolicyConsentComponent implements OnInit {
  private router = inject(Router);

  // --- Storage key ---
  private readonly STORAGE_KEY = 'pdpaConsent';

  // --- Configs you may tweak ---
  policyVersion = '1.0.0';

  policyUpdatedAt = '';

  private readonly POLICY_UPDATED_AT: Record<string, string> = {
    th: '24 ตุลาคม 2566',
    en: '24 October 2025',
  };


  /**
   * ถ้าตั้งค่าเป็น string จะใช้ path นี้ตรง ๆ (navigateByUrl)
   * ถ้าเป็น null จะใช้ path ตามภาษาจาก URL ปัจจุบัน เช่น:
   * - /en/auth/sign-up
   * - /th/auth/sign-up
   */
  nextRoute: string | null = null;
  backRoute: string | null = null;

  // --- State (signals) ---
  accepted = signal(false);
  atEnd = signal(false);

  ngOnInit(): void {
    // ✅ เคลียร์ consent เก่าทิ้งทุกครั้งที่เข้าหน้านี้
    localStorage.removeItem(this.STORAGE_KEY);

    // ✅ รีเซ็ตสถานะหน้าจอ
    this.accepted.set(false);
    this.atEnd.set(false);

    // ✅ ตั้งวันที่ตามภาษาใน URL
    const lang = this.getLangPrefix();
    this.policyUpdatedAt =
      this.POLICY_UPDATED_AT[lang ?? 'th'] ?? this.POLICY_UPDATED_AT['th'];
  }

  onScroll(evt: Event) {
    const el = evt.target as HTMLElement;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    if (nearBottom) this.atEnd.set(true);
  }

  onAcceptChange(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    this.accepted.set(checked);
  }

  private getLangPrefix(): string | null {
    const path = this.router.url.split('?')[0].split('#')[0];
    const segments = path.split('/').filter(Boolean);
    return segments.length > 0 ? segments[0] : null;
  }

  onNext() {
    if (!this.accepted()) return;

    const receipt = {
      accepted: true,
      version: this.policyVersion,
      timestamp: new Date().toISOString(),
      venue: 'Bangkok, Thailand',
    } as const;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(receipt));

    // ถ้ามี nextRoute กำหนดไว้ ใช้อันนั้นเลย
    if (this.nextRoute) {
      this.router.navigateByUrl(this.nextRoute);
      return;
    }

    // ถ้าไม่กำหนด nextRoute → ใช้ภาษาจาก URL ปัจจุบัน
    const lang = this.getLangPrefix();
    if (lang) {
      this.router.navigate(['/', lang, 'auth', 'sign-up']);
    } else {
      this.router.navigate(['/auth/sign-up']);
    }
  }

  onBack() {
    // ถ้าตั้ง backRoute ไว้ ใช้ตามนั้น (เช่น redirect กลับจาก flow พิเศษ)
    if (this.backRoute) {
      this.router.navigateByUrl(this.backRoute);
      return;
    }

    // ไม่ตั้ง backRoute → ใช้ภาษาจาก URL ปัจจุบัน
    const lang = this.getLangPrefix();
    if (lang) {
      this.router.navigate(['/', lang, 'auth', 'sign-in']);
    } else {
      this.router.navigate(['/auth/sign-in']);
    }
  }
}
