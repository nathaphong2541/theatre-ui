import { CommonModule } from '@angular/common';
import { Component, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Profile, InfoSearchService } from './service/info-search.service';
import { environment } from 'src/environments/environment';

function toAbsolute(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = environment.apiUrl.replace(/\/api\/?$/, '');
  return `${base}${url.startsWith('/') ? url : '/' + url}`;
}

@Component({
  selector: '[info-search]',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './info-search.component.html',
  styleUrls: ['./info-search.component.css'],
})
export class InfoSearchComponent implements OnInit {
  q = '';
  status = ''; // '', 'active', 'inactive', 'pending'
  page = 1;
  limit = 4;
  loading = false;

  results: Profile[] = [];
  total = 0;
  private lastPageCount = 0;

  constructor(
    private router: Router,
    private api: InfoSearchService
  ) { }

  ngOnInit(): void {
    this.search(true);
  }

  onSubmit(): void {
    if (this.loading) return;
    this.search(true);
  }

  clearFilters(): void {
    this.q = '';
    this.status = '';
    this.search(true);
  }

  loadMore(): void {
    if (this.loading || !this.hasMore) return;
    this.page += 1;
    this.fetchPage();
  }

  private search(reset = false): void {
    if (reset) {
      this.page = 1;
      this.results = [];
      this.total = 0;
      this.lastPageCount = 0;
    }
    this.fetchPage();
  }

  private fetchPage(): void {
    this.loading = true;
    this.api
      .searchProfiles({
        q: this.q?.trim(),
        status: this.status,
        page: this.page,
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          const items = res.items ?? [];
          this.lastPageCount = items.length;
          this.results = this.page === 1 ? items : [...this.results, ...items];
          this.total = res.total ?? (this.page === 1 ? items.length : this.results.length);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  get hasMore(): boolean {
    if (this.total) return this.results.length < this.total;
    return this.lastPageCount === this.limit;
  }

  // ===== Helpers =====
  fullName(m: Profile): string {
    return [m.firstName, m.lastName].filter(Boolean).join(' ') || '—';
  }

  memberCode(m: Profile): string {
    return `${(m.title ?? 0).toString().padStart(6, '0')}`;
  }

  avatar(m: Profile): string {
    return toAbsolute(m.avatarUrl) || 'assets/images/avatar-placeholder.png';
  }

  trackById(_: number, m: Profile): number | undefined {
    return m.id;
  }
}
