import { Component } from '@angular/core';

@Component({
  selector: '[info-about]',
  imports: [],
  templateUrl: './info-about.component.html',
  styleUrl: './info-about.component.css'
})
export class InfoAboutComponent {

  aboutImg = 'https://images.unsplash.com/photo-1581092919545-0b7c662b088a?auto=format&fit=crop&w=1200&q=80';
  fallbackImg = 'assets/images/about-placeholder.jpg'; // ใส่ไฟล์ไว้ใน assets ของโปรเจกต์

  onImgError(e: Event) {
    const el = e.target as HTMLImageElement;
    // ตั้ง fallback 1) ไฟล์ใน assets 2) รูป placeholder ออนไลน์ (เผื่อไม่มีไฟล์ใน assets)
    el.src = this.fallbackImg || 'https://picsum.photos/1200/800';
    el.referrerPolicy = 'no-referrer';
  }


}
