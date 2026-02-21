import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from 'src/environments/environment';

type ScriptImage = {
  id: number;
  filePath: string;
  sortOrder: number;
};

type ScriptPublic = {
  id: number;
  title: string;
  description?: string;
  tags?: string;
  images?: ScriptImage[];
  pdfPath?: string;
  createdAt?: string;
  createdByName?: string; // ✅ เพิ่มตรงนี้
};

@Component({
  selector: '[info-script]',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './info-script.component.html',
})
export class InfoScriptComponent implements OnInit {
  scripts: ScriptPublic[] = [];
  loading = false;
  error: string | null = null;

  public fileBase = environment.apiUrl.replace(/\/api\/?$/, '');

  // ✅ load more config
  readonly pageSize = 6;
  visibleCount = 6;

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadLatest();
  }

  // ✅ แสดงเฉพาะจำนวนที่ต้องการ (6, 12, 18, ...)
  get displayedScripts(): ScriptPublic[] {
    return this.scripts.slice(0, this.visibleCount);
  }

  // ✅ ยังมีของให้โหลดเพิ่มไหม
  get hasMore(): boolean {
    return this.visibleCount < this.scripts.length;
  }

  // ✅ ปุ่มย้อนกลับแสดงเมื่อเกิน 6
  get showBackButton(): boolean {
    return this.visibleCount > this.pageSize;
  }

  // โหลดบทละคร public ทั้งหมด แล้ว sort ใหม่ก่อน (ไม่ slice แล้ว)
  loadLatest() {
    this.loading = true;
    this.error = null;

    this.http.get<ScriptPublic[]>(`${environment.apiUrl}/public/scripts`).subscribe({
      next: res => {
        this.scripts = [...res].sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });

        // ✅ เริ่มต้น 6 เสมอ
        this.visibleCount = this.pageSize;

        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.error = 'ไม่สามารถโหลดข้อมูลบทละครได้ในขณะนี้';
        this.loading = false;
      },
    });
  }

  // ✅ Load more เพิ่มทีละ 6
  onLoadMore() {
    this.visibleCount = Math.min(this.visibleCount + this.pageSize, this.scripts.length);
  }

  // ✅ ย้อนกลับไป 6
  onBackToDefault() {
    this.visibleCount = this.pageSize;
  }

  // รูปปกจากภาพแรก
  getCover(script: ScriptPublic): string | null {
    if (!script.images || script.images.length === 0) return null;

    const rawPath = script.images[0].filePath || '';
    const normalized = rawPath.replace(/\\/g, '/');
    return `${this.fileBase}/${normalized}`;
  }

  getPdfUrl(script: ScriptPublic): string | null {
    if (!script.pdfPath) return null;
    const normalized = script.pdfPath.replace(/\\/g, '/');
    return `${this.fileBase}/${normalized}`;
  }

  getTagList(script: ScriptPublic): string[] {
    return (script.tags ?? '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
  }

  private getLangPrefix(): string | null {
    const pathOnly = this.router.url.split('#')[0].split('?')[0];
    const seg0 = pathOnly.split('/').filter(Boolean)[0];
    return seg0 === 'th' || seg0 === 'en' ? seg0 : null;
  }

  onViewAll() {
    const lang = this.getLangPrefix();
    const base = lang ? ['/', lang] : ['/'];
    this.router.navigate([...base, 'theatre-library']);
  }

  onViewDetail(script: ScriptPublic) {
    const lang = this.getLangPrefix();
    const base = lang ? ['/', lang] : ['/'];

    const url = this.router
      .createUrlTree([...base, 'theatre-library-detail', script.id])
      .toString();

    this.router.navigateByUrl(url);
  }
}