// src/app/.../info-news/info-news.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

type NewsItem = {
  title: string;
  summary: string;
  tag: 'ทั้งหมด' | 'หางาน' | 'หาคนทำงาน' | string; // จำกัดตามคอนเซ็ปต์
  coverUrl: string;
  isoDate: string;      // YYYY-MM-DD
  displayDate: string;  // เช่น 27 ก.ย. 2568
  author?: string;
  slug: string;
};

@Component({
  selector: '[info-news]',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './info-news.component.html',
  styleUrls: ['./info-news.component.css'],
})
export class InfoNewsComponent implements OnInit {
  // ค้นหา + แท็ก
  q = '';
  tags: Array<'ทั้งหมด' | 'หางาน' | 'หาคนทำงาน'> = ['ทั้งหมด', 'หางาน', 'หาคนทำงาน'];
  activeTag: 'ทั้งหมด' | 'หางาน' | 'หาคนทำงาน' = 'ทั้งหมด';

  // สถานะโหลด
  loading = true;

  // ข้อมูลข่าว
  allNews: NewsItem[] = [];
  newsList: NewsItem[] = [];

  // เพจจิเนชัน
  page = 1;
  pageSize = 6;
  totalPages = 0;
  pages: number[] = [];

  async ngOnInit() {
    await this.fetchNews();
  }

  // โหลดข่าว (mock ตัวอย่างตาม 2 ประเภท)
  async fetchNews() {
    this.loading = true;
    try {
      const mock: NewsItem[] = [
        {
          title: 'เปิดรับนักแสดงหญิง อายุ 20–25 ปี สำหรับละครเวทีฤดูกาลใหม่',
          summary: 'ต้องการผู้มีประสบการณ์พื้นฐานการแสดง เข้าซ้อมช่วงเย็น วันจันทร์–ศุกร์ ค่าตอบแทนตามรอบการแสดง',
          tag: 'หางาน',
          coverUrl: 'assets/images/images.png',
          isoDate: '2025-10-15',
          displayDate: '15 ต.ค. 2568',
          author: 'ฝ่ายคัดเลือกนักแสดง',
          slug: 'casting-female-20-25-season',
        },
        {
          title: 'ประกาศหาทีมช่างไฟและเสียง สำหรับโปรดักชันเดือนพฤศจิกายน',
          summary: 'ต้องการทีมช่างไฟ/เสียง 2–3 คน มีประสบการณ์งานเวทีจริง อุปกรณ์พร้อมทำงานนอกสถานที่',
          tag: 'หาคนทำงาน',
          coverUrl: 'assets/images/images.png',
          isoDate: '2025-10-10',
          displayDate: '10 ต.ค. 2568',
          author: 'โปรดิวเซอร์',
          slug: 'hiring-light-sound-nov',
        },
        {
          title: 'รับสมัครผู้ช่วยผู้กำกับ (PA) งานละครชุมชน',
          summary: 'ร่วมวางแผนตารางซ้อม ประสานงานสถานที่ และสื่อสารกับทีมงาน/ชุมชน ใจรักงานภาคสนาม',
          tag: 'หางาน',
          coverUrl: 'assets/images/images.png',
          isoDate: '2025-09-28',
          displayDate: '28 ก.ย. 2568',
          author: 'โครงการละครชุมชน',
          slug: 'community-pa-opening',
        },
      ];

      // ถ้าเดิมมี tag อื่น ๆ ให้ map เข้ากรุ๊ป 2 ประเภท (กันข้อมูลเก่า)
      this.allNews = mock.map(n => ({
        ...n,
        tag:
          n.tag === 'หางาน' || n.tag === 'หาคนทำงาน'
            ? n.tag
            : (n.title.match(/รับสมัคร|เปิดรับ|รับสมัครงาน|ประกาศรับ/i) ? 'หางาน' : 'หาคนทำงาน'),
      }));

      this.applyFilter();
    } finally {
      this.loading = false;
    }
  }

  // event ค้นหา
  onSearchChange() {
    this.page = 1;
    this.applyFilter();
  }

  // event เปลี่ยนแท็ก
  setTag(tag: 'ทั้งหมด' | 'หางาน' | 'หาคนทำงาน') {
    this.activeTag = tag;
    this.page = 1;
    this.applyFilter();
  }

  // กรอง + คำนวณเพจ + slice
  applyFilter() {
    const q = this.q.trim().toLowerCase();

    let filtered = this.allNews.filter(n => {
      const matchTag = this.activeTag === 'ทั้งหมด' || n.tag === this.activeTag;
      const matchQ =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        (n.author || '').toLowerCase().includes(q);
      return matchTag && matchQ;
    });

    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    const start = (this.page - 1) * this.pageSize;
    this.newsList = filtered.slice(start, start + this.pageSize);
  }

  // เพจจิเนชัน
  goPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.applyFilter();
  }
  goPrev() { this.goPage(this.page - 1); }
  goNext() { this.goPage(this.page + 1); }

  // สีกล่องแท็กบนการ์ด (ธีมทึบ + accent #8aab06)
  badgeClass(tag: string) {
    switch (tag) {
      case 'หางาน':
        // ป้ายหลัก: เขียวทึบ ตัวอักษรดำ
        return 'bg-[#8aab06] text-black';
      case 'หาคนทำงาน':
        // ป้ายรอง: โปร่ง + เส้นเขียว
        return 'bg-[#8aab06]/15 text-[#8aab06] ring-1 ring-[#8aab06]/40';
      default:
        return 'bg-white/10 text-white/70';
    }
  }
}