// src/app/pages/detail-script/detail-script.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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

  public fileBase = environment.apiUrl.replace(/\/api\/?$/, '');

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
  ) { }

  ngOnInit(): void {
    // ✅ ดึง id จาก URL
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

    // ✅ สมมติ endpoint: GET /public/scripts/{id}
    this.http
      .get<ScriptPublic>(
        `${environment.apiUrl}/public/scripts/${this.scriptId}`,
      )
      .subscribe({
        next: res => {
          this.script = res;
          this.loading = false;
        },
        error: err => {
          console.error(err);
          this.error = 'ไม่สามารถโหลดข้อมูลบทละครได้';
          this.loading = false;
        },
      });
  }

  getCover(script: ScriptPublic | undefined): string | null {
    if (!script?.images || script.images.length === 0) return null;
    const rawPath = script.images[0].filePath || '';
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
}
