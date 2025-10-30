import { CommonModule } from '@angular/common';
import { Component, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Profile, InfoSearchService } from './service/info-search.service';
import { environment } from 'src/environments/environment';

function toAbsolute(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = environment.apiUrl.replace(/\/api\/?$/, '');
  return `${base}${url.startsWith('/') ? url : '/' + url}`;
}

@Component({
  selector: '[info-search]',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './info-search.component.html',
  styleUrls: ['./info-search.component.css'],
})
export class InfoSearchComponent implements OnInit {
  // state ค้นหา
  q = '';
  status = ''; // '', 'active', 'inactive', 'pending'

  // สำหรับ Load more
  page = 1;
  limit = 4; // โหลดครั้งละ 4 ตามที่ต้องการ

  loading = false;

  /** เก็บผลลัพธ์สะสมสำหรับ grid */
  results: Profile[] = [];

  /** total ทั้งหมดจาก API */
  total = 0;

  /** ยังมีหน้าให้โหลดเพิ่มหรือไม่ */
  get hasMore(): boolean {
    // ถ้า API ส่ง total มา ใช้เทียบกับ results.length
    if (this.total) return this.results.length < this.total;
    // fallback: ถ้าหน้าล่าสุดที่โหลดมีจำนวนเต็ม limit แปลว่ามีโอกาสมีต่อ
    return this.lastPageCount === this.limit;
  }

  /** เก็บจำนวน item ที่ได้จาก page ล่าสุด (เพื่อ fallback hasMore) */
  private lastPageCount = 0;

  constructor(private api: InfoSearchService) { }

  ngOnInit(): void {
    this.search(true);
  }

  /** เริ่มค้นหาใหม่ (reset) */
  onSubmit(): void {
    if (this.loading) return;
    this.search(true);
  }

  clearFilters(): void {
    this.q = '';
    this.status = '';
    this.search(true);
  }

  /** โหลดเพิ่มหน้าถัดไป */
  loadMore(): void {
    if (this.loading || !this.hasMore) return;
    this.page += 1;
    this.fetchPage();
  }

  /** ค้นหา: reset หรือใช้ค่าปัจจุบันต่อ */
  private search(reset = false): void {
    if (reset) {
      this.page = 1;
      this.results = [];
      this.total = 0;
      this.lastPageCount = 0;
    }
    this.fetchPage();
  }

  /** ดึงข้อมูล 1 หน้า แล้วต่อท้ายลง results */
  private fetchPage(): void {
    this.loading = true;

    this.api
      .searchProfiles({
        q: this.q?.trim(),
        status: this.status,
        page: this.page,
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          const items = res.items ?? [];
          this.lastPageCount = items.length;

          // ถ้าเป็นหน้าแรกให้แทนค่าใหม่, ถ้าไม่ใช่ให้ต่อท้าย
          if (this.page === 1) {
            this.results = items;
          } else {
            this.results = [...this.results, ...items];
          }

          this.total = res.total ?? (this.page === 1 ? items.length : this.results.length);
          this.loading = false;
        },
        error: () => {
          // error ก็หยุดโหลด แต่คง results เดิมไว้
          this.loading = false;
        },
      });
  }

  // ===== Helpers =====
  fullName(m: Profile): string {
    return [m.firstName, m.lastName].filter(Boolean).join(' ') || '—';
  }

  memberCode(m: Profile): string {
    return `${(m.title ?? 0).toString().padStart(6, '0')}`;
  }

  avatar(m: Profile): string {
    return toAbsolute(m.avatarUrl) || 'https://i.pravatar.cc/160?img=12';
  }

  trackById(_: number, m: Profile): number | undefined {
    return m.id;
  }
}
