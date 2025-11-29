import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Drama } from '../../../pages/drama/models/drama.model';
import { DramaService } from '../../../pages/drama/service/drama.service';
import { FormsModule } from '@angular/forms';

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

  filteredDramas = computed(() => {
    const q = this.search().toLowerCase().trim();
    const tag = this.tagFilter();

    return this.dramas().filter(d => {
      const matchText =
        !q ||
        d.title.toLowerCase().includes(q) ||
        (d.description ?? '').toLowerCase().includes(q) ||
        (d.tags ?? '').toLowerCase().includes(q);

      const matchTag =
        !tag || (d.tags ?? '').split(',').map(t => t.trim()).includes(tag);

      return matchText && matchTag;
    });
  });

  constructor(
    private dramaService: DramaService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.error.set(null);

    this.dramaService.getMyDramas().subscribe({
      next: res => {
        this.dramas.set(res);
        this.loading.set(false);
      },
      error: err => {
        console.error(err);
        this.error.set('ไม่สามารถโหลดรายการบทละครได้');
        this.loading.set(false);
      },
    });
  }

  // ───────────────── helper: ดึง lang จาก URL ─────────────────
  private getLangPrefix(): string | null {
    const url = this.router.url; // เช่น "/th/directory/script/list"
    const segments = url.split('/').filter(Boolean);
    const first = segments[0];
    const supportedLangs = ['th', 'en'];

    return supportedLangs.includes(first) ? first : null;
  }

  // ───────────────── navigation ─────────────────
  onCreate() {
    const lang = this.getLangPrefix();
    const base: any[] = [];

    if (lang) {
      base.push('/', lang, 'directory');
    } else {
      base.push('/directory');
    }

    this.router.navigate([...base, 'script', 'new']);
  }

  onEdit(d: Drama) {
    const lang = this.getLangPrefix();
    const base: any[] = [];

    if (lang) {
      base.push('/', lang, 'directory');
    } else {
      base.push('/directory');
    }

    this.router.navigate([...base, 'script', d.id, 'edit']);
  }

  onView(d: Drama) {
    const lang = this.getLangPrefix();
    const base: any[] = [];

    if (lang) {
      base.push('/', lang, 'directory');
    } else {
      base.push('/directory');
    }

    // ✅ แก้จาก 'drama' เป็น 'script'
    this.router.navigate([...base, 'script', d.id]);
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
        this.dramas.set(this.dramas().filter(d => d.id !== id));
        this.deletingId.set(null);
      },
      error: err => {
        console.error(err);
        this.error.set('ลบไม่สำเร็จ');
        this.deletingId.set(null);
      },
    });
  }

  // ───────────────── helpers ─────────────────
  getFirstImage(drama: Drama): string | null {
    return drama.images && drama.images.length > 0
      ? drama.images[0].filePath
      : null;
  }

  getTagList(d: Drama): string[] {
    return (d.tags ?? '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
  }

  getPdfCount(d: Drama): number {
    // สมมติว่า Drama มี field pdfs
    // ถ้ายังไม่มี ให้เพิ่มใน interface ด้วย
    // pdfs?: { id: number; versionNo: number; versionName?: string; filePath: string; createdAt: string }[];
    return (d as any).pdfs ? (d as any).pdfs.length : 0;
  }

  downloadLatestPdf(d: Drama) {
    // เรียก API download ล่าสุด: GET /api/scripts/{id}/pdf
    const url = `/api/scripts/${d.id}/pdf`;
    window.open(url, '_blank');
  }
}
