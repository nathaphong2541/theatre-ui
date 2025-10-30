// src/app/.../info-news/info-news.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

type NewsItem = {
  title: string;
  summary: string;
  tag: 'ทั้งหมด' | 'ประกาศ' | 'กิจกรรม' | 'บทความ' | 'อัปเดตระบบ' | string;
  coverUrl: string;
  isoDate: string;      // YYYY-MM-DD
  displayDate: string;  // แสดงผล เช่น 27 ก.ย. 2568
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
  tags = ['ทั้งหมด', 'ประกาศ', 'กิจกรรม', 'บทความ', 'อัปเดตระบบ'];
  activeTag = 'ทั้งหมด';

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

  // โหลดข่าว (ตอนนี้ mock ไว้ก่อน — เปลี่ยนเป็นเรียก API จริงภายหลังได้)
  async fetchNews() {
    this.loading = true;
    try {
      const mock: NewsItem[] = [
        {
          title: 'เวิร์กช็อปละครเพื่อสังคม รุ่นที่ 3',
          summary: 'ชวนเยาวชนและผู้สนใจร่วมเวิร์กช็อปละครเพื่อสังคมกับทีมวิทยากรมูลนิธิละครไทย…',
          tag: 'กิจกรรม',
          coverUrl: 'assets/images/news-1.jpg',
          isoDate: '2025-09-27',
          displayDate: '27 ก.ย. 2568',
          author: 'ทีมกิจกรรม',
          slug: 'workshop-social-theatre-3',
        },
        {
          title: 'ประกาศทุนสนับสนุนการสร้างสรรค์ละครชุมชน',
          summary: 'เปิดรับข้อเสนอโครงการเพื่อรับทุนสนับสนุนการผลิตละครชุมชนและพัฒนาศิลปิน…',
          tag: 'ประกาศ',
          coverUrl: 'assets/images/news-2.jpg',
          isoDate: '2025-09-15',
          displayDate: '15 ก.ย. 2568',
          author: 'มูลนิธิละครไทย',
          slug: 'community-theatre-grant-2568',
        },
        {
          title: 'โครงการละครเยาวชน “เสียงจากใจเด็ก”',
          summary: 'รวมพลังเยาวชนกับละครสร้างสรรค์ ถ่ายทอดเรื่องราวและแรงบันดาลใจในสังคม…',
          tag: 'กิจกรรม',
          coverUrl: 'assets/images/news-3.jpg',
          isoDate: '2025-08-01',
          displayDate: '1 ส.ค. 2568',
          author: 'ฝ่ายเยาวชน',
          slug: 'youth-theatre-voice',
        },
      ];
      this.allNews = mock;
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
  setTag(tag: string) {
    this.activeTag = tag;
    this.page = 1;
    this.applyFilter();
  }

  // กรอง + คำนวณเพจ + slice
  applyFilter() {
    const q = this.q.trim().toLowerCase();
    let filtered = this.allNews.filter(n =>
      (this.activeTag === 'ทั้งหมด' || n.tag === this.activeTag) &&
      (!q || n.title.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q))
    );

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

  // สีกล่องแท็กบนการ์ด
  badgeClass(tag: string) {
    switch (tag) {
      case 'ประกาศ': return 'bg-indigo-50 text-indigo-700';
      case 'กิจกรรม': return 'bg-green-50 text-green-700';
      case 'บทความ': return 'bg-amber-50 text-amber-700';
      case 'อัปเดตระบบ': return 'bg-sky-50 text-sky-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}
