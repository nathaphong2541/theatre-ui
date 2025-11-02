import { Component } from '@angular/core';

@Component({
  selector: '[info-about]',
  imports: [],
  templateUrl: './info-about.component.html',
  styleUrl: './info-about.component.css'
})
export class InfoAboutComponent {

  aboutImg = 'assets/images/about-placeholder.jpg';
  fallbackImg = 'assets/images/about-placeholder.jpg'; // ใส่ไฟล์ไว้ใน assets ของโปรเจกต์

  onImgError(e: Event) {
    const el = e.target as HTMLImageElement;
    // ตั้ง fallback 1) ไฟล์ใน assets 2) รูป placeholder ออนไลน์ (เผื่อไม่มีไฟล์ใน assets)
    el.src = this.fallbackImg;
    el.referrerPolicy = 'no-referrer';
  }


}
