// src/app/.../all-script/all-script.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { toFullUrl } from 'src/app/core/utils/file-url';

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
  selector: 'app-all-script',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './all-script.component.html',
  styleUrl: './all-script.component.css',
})
export class AllScriptComponent implements OnInit {
  scripts: ScriptPublic[] = [];
  loading = false;
  error: string | null = null;

  search = '';
  selectedTag: string | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadScripts();
  }

  loadScripts() {
    this.loading = true;
    this.error = null;

    this.http.get<ScriptPublic[]>(`${environment.apiUrl}/public/scripts`).subscribe({
      next: (res) => {
        // sort จากใหม่ -> เก่า
        this.scripts = [...res].sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'ไม่สามารถโหลดรายการบทละครได้ในขณะนี้';
        this.loading = false;
      },
    });
  }

  get filteredScripts(): ScriptPublic[] {
    const q = this.search.toLowerCase().trim();
    const tag = this.selectedTag;

    return this.scripts.filter((s) => {
      const matchText =
        !q ||
        s.title.toLowerCase().includes(q) ||
        (s.description ?? '').toLowerCase().includes(q) ||
        (s.tags ?? '').toLowerCase().includes(q);

      const tagList = this.getTagList(s);
      const matchTag = !tag || tagList.includes(tag);

      return matchText && matchTag;
    });
  }

  // รวมทุกแท็กไว้ทำ filter chips
  get allTags(): string[] {
    const tags = new Set<string>();
    this.scripts.forEach((s) => {
      this.getTagList(s).forEach((t) => tags.add(t));
    });
    return Array.from(tags);
  }

  // รูปปกจากภาพแรก
  getCover(script: ScriptPublic): string | null {
    if (!script.images?.length) return null;

    return toFullUrl(script.images[0].filePath);
  }

  getTagList(script: ScriptPublic): string[] {
    return (script.tags ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  // --- helper หา lang ปัจจุบัน ---
  private getLangPrefix(): string | null {
    const segments = this.router.url.split('/').filter(Boolean);
    const supported = ['th', 'en'];
    return supported.includes(segments[0]) ? segments[0] : null;
  }

  onViewDetail(script: ScriptPublic) {
    const lang = this.getLangPrefix();
    const base = lang ? ['/', lang] : ['/'];

    const url = this.router.createUrlTree([...base, 'theatre-library-detail', script.id]).toString();

    this.router.navigateByUrl(url);
  }

  openPdf(script: ScriptPublic, event?: MouseEvent) {
    if (event) event.stopPropagation();
    if (!script.pdfPath) return;

    const url = toFullUrl(script.pdfPath);
    if (url) window.open(url, '_blank');
  }

  clearTag() {
    this.selectedTag = null;
  }
}
