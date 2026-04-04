import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Drama } from '../../../pages/drama/models/drama.model';
import { DramaService } from '../../../pages/drama/service/drama.service';
import { FormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { toFullUrl } from 'src/app/core/utils/file-url';

@Component({
  selector: 'app-list-drama',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './list-drama.component.html',
})
export class ListDramaComponent implements OnInit {
  dramas = signal<Drama[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  search = signal('');
  tagFilter = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  // ✅ รวม tag ทั้งหมดไว้ทำ filter dropdown
  uniqueTags = computed(() => {
    const set = new Set<string>();
    this.dramas().forEach((d) => this.getTagList(d).forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  filteredDramas = computed(() => {
    const q = this.search().toLowerCase().trim();
    const tag = this.tagFilter();

    return this.dramas().filter((d) => {
      const title = (d.title ?? '').toLowerCase();
      const desc = (d.description ?? '').toLowerCase();
      const tags = (d.tags ?? '').toLowerCase();

      const matchText = !q || title.includes(q) || desc.includes(q) || tags.includes(q);

      const matchTag = !tag || this.getTagList(d).includes(tag);

      return matchText && matchTag;
    });
  });

  constructor(private dramaService: DramaService, private router: Router) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.error.set(null);

    // ✅ สำคัญ: ต้องเป็น endpoint ของฉันเท่านั้น (/scripts/me)
    this.dramaService.getMyDramasMe().subscribe({
      next: (res) => {
        this.dramas.set(res ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('ไม่สามารถโหลดรายการบทละครได้');
        this.loading.set(false);
      },
    });
  }

  // ───────────────── helper: ดึง lang จาก URL ─────────────────
  private getLangPrefix(): string | null {
    const segments = this.router.url.split('/').filter(Boolean);
    const first = segments[0];
    return first === 'th' || first === 'en' ? first : null;
  }

  // ───────────────── navigation ─────────────────
  onCreate() {
    const lang = this.getLangPrefix();
    const base: any[] = lang ? ['/', lang, 'directory'] : ['/directory'];
    this.router.navigate([...base, 'script', 'new']);
  }

  onEdit(d: Drama) {
    const lang = this.getLangPrefix();
    const base: any[] = lang ? ['/', lang, 'directory'] : ['/directory'];
    this.router.navigate([...base, 'script', d.id]); // หน้า edit ของคุณ
  }

  onView(d: Drama) {
    const lang = this.getLangPrefix();
    const base: any[] = lang ? ['/', lang, 'directory'] : ['/directory'];
    this.router.navigate([...base, 'script', 'view', d.id]);
  }

  // ───────────────── delete ─────────────────
  confirmDelete(id: number) {
    this.deletingId.set(id);
  }

  cancelDelete() {
    this.deletingId.set(null);
  }

  deleteConfirmed() {
    const id = this.deletingId();
    if (!id) return;

    this.dramaService.deleteDrama(id).subscribe({
      next: () => {
        this.dramas.set(this.dramas().filter((d) => d.id !== id));
        this.deletingId.set(null);
      },
      error: (err) => {
        console.error(err);
        this.error.set('ลบไม่สำเร็จ');
        this.deletingId.set(null);
      },
    });
  }

  // ───────────────── helpers ─────────────────
  private fileBase = environment.apiUrl.replace(/\/api\/?$/, '');

  trackByDramaId = (_: number, d: Drama) => d.id;

  getFirstImage(drama: Drama): string | null {
    if (!drama.images?.length) return null;

    return toFullUrl(drama.images[0]?.filePath);
  }

  getTagList(d: Drama): string[] {
    return (d.tags ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  getPdfCount(d: Drama): number {
    return Array.isArray((d as any).pdfs) ? (d as any).pdfs.length : 0;
  }

  downloadLatestPdf(d: Drama) {
    // ✅ แนะนำให้ backend ทำ endpoint owner-only: GET /api/scripts/me/{id}/pdf
    // เพื่อกันคนอื่นดาวน์โหลด
    const apiBase = environment.apiUrl; // http://localhost:8080/api
    const url = `${apiBase}/scripts/me/${d.id}/pdf`;

    // หมายเหตุ: ถ้า cookie เป็น cross-site ต้องมี sameSite/secure ถูกต้อง
    window.open(url, '_blank');
  }
}
