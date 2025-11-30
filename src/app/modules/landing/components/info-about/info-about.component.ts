import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: '[info-about]',
  imports: [],
  templateUrl: './info-about.component.html',
  styleUrl: './info-about.component.css'
})
export class InfoAboutComponent {

  aboutImg = 'assets/images/about-placeholder.jpg';
  fallbackImg = 'assets/images/about-placeholder.jpg'; // ใส่ไฟล์ไว้ใน assets ของโปรเจกต์

  constructor(
    private router: Router,
  ) { }

  onImgError(e: Event) {
    const el = e.target as HTMLImageElement;
    // ตั้ง fallback 1) ไฟล์ใน assets 2) รูป placeholder ออนไลน์ (เผื่อไม่มีไฟล์ใน assets)
    el.src = this.fallbackImg;
    el.referrerPolicy = 'no-referrer';
  }

  // helper หา lang จาก URL ปัจจุบัน
  private getLangPrefix(): string | null {
    const segments = this.router.url.split('/').filter(Boolean);
    const supported = ['th', 'en'];
    return supported.includes(segments[0]) ? segments[0] : null;
  }

  howtouser() {
    const lang = this.getLangPrefix();
    const base = lang ? ['/', lang] : ['/'];
    this.router.navigate([...base, 'how-to-user']);
  }

}
