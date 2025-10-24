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
  policyUpdatedAt = '24 ตุลาคม 2025';
  nextRoute = '/en/auth/sign-up';
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

    // (ถ้ายังอยากรองรับกรณี “ไม่ลบ” ก็แค่ลบ removeItem ด้านบนออก)
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

  onNext() {
    if (!this.accepted()) return;
    const receipt = {
      accepted: true,
      version: this.policyVersion,
      timestamp: new Date().toISOString(),
      venue: 'Bangkok, Thailand',
    } as const;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(receipt));
    this.router.navigateByUrl(this.nextRoute);
  }

  onBack() {
    if (this.backRoute) {
      this.router.navigateByUrl(this.backRoute);
    } else {
      this.router.navigateByUrl('/en/auth/sign-in');
    }
  }
}
