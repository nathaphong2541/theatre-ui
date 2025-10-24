import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

type VideoItem = { rawUrl: string; embedUrl: SafeResourceUrl };

@Component({
  selector: 'app-video-gallery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './video-gallery.component.html',
})
export class VideoGalleryComponent implements OnInit {

  @Input() limit = 2;
  @Input() viewOnly = false;

  submitted = false;

  form = new FormGroup({
    url: new FormControl<string>('', [Validators.required]),
  });

  videos = signal<VideoItem[]>([]);

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit() {
    const saved = localStorage.getItem('profileVideos');

    if (saved) {
      try {
        // โหลดข้อมูลเก่าจาก localStorage
        const parsed = JSON.parse(saved);
        const safeVideos: VideoItem[] = parsed
          .slice(0, this.limit)
          .map((v: any) => ({
            rawUrl: v.rawUrl,
            embedUrl: this.toSafeUrl(v.rawUrl),
          }));

        this.videos.set(safeVideos);
      } catch {
        console.warn('Invalid saved video data');
      }
    } else {
      // วิดีโอตัวอย่าง 2 อันแรก
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
  }

  add() {
    this.submitted = true;                      // <— เพิ่ม
    this.form.markAllAsTouched();               // <— เพิ่ม

    const raw = (this.form.value.url || '').trim();
    if (!raw) return;

    if (this.videos().length >= this.limit) {
      alert(`เพิ่มได้สูงสุด ${this.limit} วิดีโอเท่านั้น`);
      return;
    }

    const id = this.extractVideoId(raw);        // <— ตรวจให้ชัดว่ามี id ไหม
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
    this.submitted = false;                     // <— ล้างสถานะส่งสำเร็จ
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
