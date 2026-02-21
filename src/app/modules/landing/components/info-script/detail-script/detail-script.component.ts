// src/app/pages/detail-script/detail-script.component.ts
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  createdByName?: string;
};

@Component({
  selector: 'app-detail-script',
  standalone: true,
  imports: [CommonModule, RouterLink, HttpClientModule],
  templateUrl: './detail-script.component.html',
})
export class DetailScriptComponent implements OnInit {
  scriptId!: number;
  script?: ScriptPublic;
  loading = false;
  error: string | null = null;

  // base สำหรับ static files (/uploads/**)
  public fileBase = environment.apiUrl.replace(/\/api\/?$/, '');

  // ===== Lightbox State =====
  lightboxOpen = false;
  lightboxIndex = 0;
  lightboxUrls: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      this.scriptId = idParam ? Number(idParam) : 0;

      if (!this.scriptId) {
        this.error = 'ไม่พบบทละครที่ต้องการดู';
        return;
      }

      this.loadScript();
    });
  }

  loadScript(): void {
    this.loading = true;
    this.error = null;

    this.http
      .get<ScriptPublic>(`${environment.apiUrl}/public/scripts/${this.scriptId}`)
      .subscribe({
        next: res => {
          this.script = res;
          this.loading = false;

          // ถ้าเปิด lightbox อยู่แล้ว (unlikely) ให้รีเซ็ต
          this.closeLightbox();
        },
        error: err => {
          console.error(err);
          this.error = 'ไม่สามารถโหลดข้อมูลบทละครได้';
          this.loading = false;
        },
      });
  }

  // ===== Helpers =====

  getCover(script: ScriptPublic | undefined): string | null {
    if (!script?.images || script.images.length === 0) return null;

    const sorted = [...script.images].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );

    const rawPath = sorted[0]?.filePath || '';
    const normalized = rawPath.replace(/\\/g, '/');
    return `${this.fileBase}/${normalized}`;
  }

  getPdfUrl(script: ScriptPublic | undefined): string | null {
    if (!script?.pdfPath) return null;
    const normalized = script.pdfPath.replace(/\\/g, '/');
    return `${this.fileBase}/${normalized}`;
  }

  getTagList(script: ScriptPublic | undefined): string[] {
    return (script?.tags ?? '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
  }

  // ===== Gallery =====

  /** คืน URL รูปทั้งหมด (sorted + normalize + unique) */
  getGalleryUrls(script: ScriptPublic | undefined): string[] {
    if (!script?.images?.length) return [];

    const sorted = [...script.images].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );

    const urls = sorted
      .map(img => {
        const raw = img.filePath || '';
        const normalized = raw.replace(/\\/g, '/');
        return `${this.fileBase}/${normalized}`;
      })
      .filter(Boolean);

    // unique
    return Array.from(new Set(urls));
  }

  /** เรียกจาก template: เปิด lightbox พร้อมตั้ง urls ให้เรียบร้อย */
  openLightboxByIndex(script: ScriptPublic | undefined, index: number) {
    const urls = this.getGalleryUrls(script);
    if (!urls.length) return;

    this.lightboxUrls = urls;
    this.lightboxIndex = Math.min(Math.max(index, 0), urls.length - 1);
    this.lightboxOpen = true;
  }

  closeLightbox() {
    this.lightboxOpen = false;
    this.lightboxIndex = 0;
    this.lightboxUrls = [];
  }

  prevLightbox() {
    if (!this.lightboxUrls.length) return;
    this.lightboxIndex =
      (this.lightboxIndex - 1 + this.lightboxUrls.length) % this.lightboxUrls.length;
  }

  nextLightbox() {
    if (!this.lightboxUrls.length) return;
    this.lightboxIndex =
      (this.lightboxIndex + 1) % this.lightboxUrls.length;
  }

  // ===== Keyboard support (Esc / arrows) =====
  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    if (!this.lightboxOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      this.closeLightbox();
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.prevLightbox();
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.nextLightbox();
      return;
    }
  }
}