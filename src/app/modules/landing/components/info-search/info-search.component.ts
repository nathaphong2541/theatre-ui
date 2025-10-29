import { CommonModule } from '@angular/common';
import { Component, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Profile, InfoSearchService } from './service/info-search.service';
import { environment } from 'src/environments/environment';

/** ทำให้ URL ไฟล์เป็น absolute เหมือนใน ProfileMenuComponent */
function toAbsolute(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;                 // already absolute
  const base = environment.apiUrl.replace(/\/api\/?$/, '');  // ตัด /api ท้าย base
  return `${base}${url.startsWith('/') ? url : '/' + url}`;
}

@Component({
  selector: '[info-search]',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './info-search.component.html',
  styleUrls: ['./info-search.component.css']
})
export class InfoSearchComponent implements OnInit {

  // state ค้นหา
  q = '';
  status = ''; // '', 'active', 'inactive', 'pending'
  page = 1;
  limit = 12;

  loading = false;
  members: Profile[] = [];
  total = 0;

  // คำนวณช่วงที่แสดง
  startIdx = computed(() => this.total ? (this.page - 1) * this.limit + 1 : 0);
  endIdx = computed(() => Math.min(this.page * this.limit, this.total));
  pageCount = computed(() => Math.max(1, Math.ceil(this.total / this.limit)));

  constructor(private api: InfoSearchService) { }

  ngOnInit(): void { this.search(); }

  search(): void {
    if (this.loading) return;
    this.loading = true;

    this.api.searchProfiles({
      q: this.q?.trim(),
      status: this.status,
      page: this.page,
      limit: this.limit
    }).subscribe({
      next: res => {
        this.members = res.items ?? [];
        this.total = res.total ?? this.members.length;
        this.loading = false;
      },
      error: _ => {
        this.members = [];
        this.total = 0;
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.loading) return;
    this.page = 1;
    this.search();
  }

  goto(p: number): void {
    if (this.loading) return;
    if (p < 1 || p > this.pageCount()) return;
    this.page = p;
    this.search();
  }

  clearFilters(): void {
    this.q = '';
    this.status = '';
    this.page = 1;
    this.search();
  }

  // ===== Helpers สำหรับ UI =====
  fullName(m: Profile): string {
    return [m.firstName, m.lastName].filter(Boolean).join(' ') || '—';
  }

  memberCode(m: Profile): string {
    return `MEM-${(m.id ?? 0).toString().padStart(6, '0')}`;
  }

  /** ปรับให้รูปเป็น absolute ตามกติกาเดียวกับ ProfileMenuComponent */
  avatar(m: Profile): string {
    return toAbsolute(m.avatarUrl) || 'https://i.pravatar.cc/160?img=12';
  }

  regionTag(m: Profile): string {
    return m.location || '—';
  }

  /** ใช้ใน template แทน (m as any).orders / rating / startedYear */
  getStat(m: Profile, key: 'orders' | 'rating' | 'startedYear'): string | number {
    const v = (m as any)?.[key];
    return (v === null || v === undefined || v === '') ? '—' : v;
  }

  /** trackBy ช่วยลด re-render ของ *ngFor */
  trackById(_: number, m: Profile): number | undefined {
    return m.id;
  }
}
