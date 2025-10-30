import { Component, OnDestroy, OnInit } from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Profile, InfoSearchService } from '../service/info-search.service';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';

/** ทำให้ URL ไฟล์เป็น absolute (ตัด /api ท้าย environment.apiUrl) */
function toAbsolute(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = environment.apiUrl.replace(/\/api\/?$/, '');
  return `${base}${url.startsWith('/') ? url : '/' + url}`;
}

/** แปลงลิงก์ YouTube/Vimeo ให้เป็น embed URL */
function toEmbedUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const url = raw.trim();

  // YouTube
  const ytWatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`;

  // Vimeo
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  return null;
}

type StatKey = 'orders' | 'rating' | 'startedYear';


@Component({
  selector: 'app-search-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './search-detail.component.html',
  styleUrl: './search-detail.component.css'
})
export class SearchDetailComponent implements OnInit, OnDestroy {

  loading = false;
  error = '';
  profile: Profile | null = null;

  // วิดีโอ embed (safe)
  video1?: SafeResourceUrl | null;
  video2?: SafeResourceUrl | null;

  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private api: InfoSearchService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.error = 'ไม่พบรหัสโปรไฟล์'; return; }
    this.fetch(id);
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  private fetch(id: number) {
    this.loading = true;
    this.sub = this.api.getProfileById(id).subscribe({
      next: (p) => {
        this.profile = p;
        this.prepareVideos(p);
        this.loading = false;
      },
      error: () => {
        this.error = 'โหลดข้อมูลไม่สำเร็จ';
        this.loading = false;
      }
    });
  }

  private prepareVideos(p: Profile) {
    const e1 = toEmbedUrl(p.video1);
    const e2 = toEmbedUrl(p.video2);
    this.video1 = e1 ? this.sanitizer.bypassSecurityTrustResourceUrl(e1) : null;
    this.video2 = e2 ? this.sanitizer.bypassSecurityTrustResourceUrl(e2) : null;
  }

  // ===== View helpers =====
  avatar(): string {
    return toAbsolute(this.profile?.avatarUrl) || 'https://i.pravatar.cc/160?img=12';
  }
  cover(): string | null {
    return toAbsolute(this.profile?.coverUrl);
  }
  fullName(): string {
    const p = this.profile;
    return [p?.firstName, p?.lastName].filter(Boolean).join(' ') || '—';
  }
  location(): string {
    return this.profile?.location || '—';
  }
  statusText(): string {
    return this.profile?.recordStatus === 'A' ? 'ใช้งาน' : 'ระงับ';
  }
  isActive(): boolean {
    return this.profile?.recordStatus === 'A';
  }
  gallery(): string[] {
    return (this.profile?.galleryUrls || []).map(toAbsolute).filter(Boolean) as string[];
  }

  getStat(key: 'orders'): number;
  getStat(key: 'rating'): number;
  getStat(key: 'startedYear'): number;

  getStat(key: StatKey): number {
    // ใช้ any เฉพาะตรงนี้เพื่ออ่านฟิลด์ที่อาจอยู่ต่างที่ เช่น profile.stats.orders หรือ profile.orders
    const p: any = this.profile;

    function toNumber(v: unknown, fallback = 0): number {
      const n =
        typeof v === 'number' ? v :
          typeof v === 'string' ? Number(v) :
            NaN;
      return Number.isFinite(n) ? n : fallback;
    }

    switch (key) {
      case 'orders':
        // รองรับทั้ง profile.orders และ profile.stats.orders
        return toNumber(p?.orders ?? p?.stats?.orders);

      case 'rating':
        // รองรับทั้ง profile.rating และ profile.stats.rating
        return toNumber(p?.rating ?? p?.stats?.rating);

      case 'startedYear': {
        // 1) ใช้ค่า startedYear ถ้ามี
        const y1 = toNumber(p?.startedYear ?? p?.stats?.startedYear, NaN);
        if (Number.isFinite(y1)) return y1;

        // 2) fallback จาก createdAt: "YYYY-..." -> YYYY
        const y2 =
          typeof p?.createdAt === 'string'
            ? parseInt(p.createdAt.slice(0, 4), 10)
            : NaN;
        return Number.isFinite(y2) ? y2 : 0;
      }
    }
  }
}