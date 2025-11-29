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

  // base สำหรับ static files (/uploads/**)
  public fileBase = environment.apiUrl.replace(/\/api\/?$/, '');

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadLatest();
  }

  // โหลดบทละคร public ทั้งหมด แล้ว sort/ตัดให้เหลือ 5 อันล่าสุด
  loadLatest() {
    this.loading = true;
    this.error = null;

    this.http.get<ScriptPublic[]>(`${environment.apiUrl}/public/scripts`).subscribe({
      next: res => {
        this.scripts = [...res]
          .sort((a, b) => {
            const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return db - da; // ใหม่ก่อน
          })
          .slice(0, 5);

        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.error = 'ไม่สามารถโหลดข้อมูลบทละครได้ในขณะนี้';
        this.loading = false;
      },
    });
  }

  // รูปปกจากภาพแรก
  getCover(script: ScriptPublic): string | null {
    if (!script.images || script.images.length === 0) return null;

    const rawPath = script.images[0].filePath || ''; // "uploads\\scripts\\xxx.jpg"
    const normalized = rawPath.replace(/\\/g, '/');  // → uploads/scripts/xxx.jpg
    return `${this.fileBase}/${normalized}`;         // → http://localhost:8080/uploads/scripts/xxx.jpg
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

  // helper หา lang จาก URL ปัจจุบัน
  private getLangPrefix(): string | null {
    const segments = this.router.url.split('/').filter(Boolean);
    const supported = ['th', 'en'];
    return supported.includes(segments[0]) ? segments[0] : null;
  }

  // ไปหน้า "ดูทั้งหมด"
  onViewAll() {
    const lang = this.getLangPrefix();
    const base = lang ? ['/', lang] : ['/'];
    this.router.navigate([...base, 'theatre-library']);
  }

  // ไปหน้า detail ของเรื่องนั้น (ใช้ route script เดิมของระบบคุณ)
  onViewDetail(script: ScriptPublic) {
    const lang = this.getLangPrefix();
    const base = lang ? ['/', lang] : ['/'];
    this.router.navigate([...base, 'theatre-library', script.id]);
  }
}
