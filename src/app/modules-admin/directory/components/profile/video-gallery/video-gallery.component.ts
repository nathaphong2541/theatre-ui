// src/app/.../video-gallery/video-gallery.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

type VideoItem = { rawUrl: string; embedUrl: SafeResourceUrl };

@Component({
  selector: 'app-video-gallery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './video-gallery.component.html',
})
export class VideoGalleryComponent implements OnInit, OnChanges {

  /** จำนวนสูงสุดที่จะเก็บ/แสดง */
  @Input() limit = 2;

  /** โหมดดูอย่างเดียว (ซ่อนฟอร์ม add/remove) */
  @Input() viewOnly = false;

  /**
   * แหล่งวิดีโอจากภายนอก (เช่น จาก API โปรไฟล์)
   * - ถ้าให้เป็น [] (ว่าง) => แสดงว่าง ๆ ไม่โหลด demo
   * - ถ้าไม่ส่งมา (null) => อนุญาต fallback (localStorage/demo)
   */
  @Input() sources: string[] | null = null;

  submitted = false;

  form = new FormGroup({
    url: new FormControl<string>('', [Validators.required]),
  });

  videos = signal<VideoItem[]>([]);

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit() {
    this.hydrateFromInputsOrFallback();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['sources']) {
      this.hydrateFromInputsOrFallback();
    }
  }

  /** ตัดสินใจว่าจะใช้ sources หรือ fallback */
  private hydrateFromInputsOrFallback() {
    if (this.sources !== null) {
      // ✅ มีการส่ง sources มา (อาจว่างได้) => ใช้ตามนี้ ไม่แตะ localStorage/demo
      const items = (this.sources ?? [])
        .filter(Boolean)
        .slice(0, this.limit)
        .map((u) => ({ rawUrl: u, embedUrl: this.toSafeUrl(u) }));
      this.videos.set(items);
      return;
    }

    // === กรณีไม่ส่ง sources (null) ค่อยใช้ fallback เดิม ===
    const saved = localStorage.getItem('profileVideos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const safeVideos: VideoItem[] = parsed
          .slice(0, this.limit)
          .map((v: any) => ({
            rawUrl: v.rawUrl,
            embedUrl: this.toSafeUrl(v.rawUrl),
          }));
        this.videos.set(safeVideos);
        return;
      } catch {
        console.warn('Invalid saved video data');
      }
    }

    // ถ้าอยาก “ไม่มีเดโม่เลย” ก็ลบบรรทัดด้านล่างทิ้ง:
    this.setDemo();
  }

  private setDemo() {
    const demoUrls = [
      'https://youtu.be/L051YSpEEYU?si=A_F4VdL2s-Y5Cvxw',
      'https://youtu.be/8zsY7HiM25o?si=-4eDjBzfkDQDWPbS',
    ];
    const demoItems: VideoItem[] = demoUrls.map((u) => ({
      rawUrl: u,
      embedUrl: this.toSafeUrl(u),
    }));
    this.videos.set(demoItems);
    localStorage.setItem('profileVideos', JSON.stringify(demoItems));
  }

  add() {
    this.submitted = true;
    this.form.markAllAsTouched();

    const raw = (this.form.value.url || '').trim();
    if (!raw) return;

    if (this.videos().length >= this.limit) {
      alert(`เพิ่มได้สูงสุด ${this.limit} วิดีโอเท่านั้น`);
      return;
    }

    const id = this.extractVideoId(raw);
    if (!id) {
      alert('ลิงก์/รหัสวิดีโอไม่ถูกต้อง');
      return;
    }

    const safeUrl = this.toSafeUrl(raw);
    const newList = [{ rawUrl: raw, embedUrl: safeUrl }, ...this.videos()].slice(0, this.limit);
    this.videos.set(newList);

    const storeData = newList.map(v => ({ rawUrl: v.rawUrl }));
    localStorage.setItem('profileVideos', JSON.stringify(storeData));

    this.form.reset();
    this.submitted = false;
  }

  remove(i: number) {
    const newList = this.videos().filter((_, idx) => idx !== i);
    this.videos.set(newList);

    const storeData = newList.map((v) => ({ rawUrl: v.rawUrl }));
    localStorage.setItem('profileVideos', JSON.stringify(storeData));
  }

  /** ✅ คืนค่า SafeResourceUrl ปลอดภัย */
  private toSafeUrl(url: string): SafeResourceUrl {
    const id = this.extractVideoId(url);
    const embedUrl = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  /** ✅ แยก Video ID จากลิงก์ YouTube */
  private extractVideoId(input: string): string {
    try {
      if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

      const u = new URL(input);
      const host = u.hostname.replace(/^www\./, '').toLowerCase();

      if (u.searchParams.get('v')) return u.searchParams.get('v')!;
      if (host.includes('youtu.be')) return u.pathname.replace('/', '');
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2];
      return '';
    } catch {
      return '';
    }
  }
}
