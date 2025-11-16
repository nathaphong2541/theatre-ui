import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Profile, InfoSearchService } from './service/info-search.service';
import { environment } from 'src/environments/environment';
import { PubilcService } from 'src/app/shared/service/public/pubilc.service';

function toAbsolute(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = environment.apiUrl.replace(/\/api\/?$/, '');
  return `${base}${url.startsWith('/') ? url : '/' + url}`;
}

type SelectedMap = {
  departments: Set<number>; // ✅ ใช้ ID
  jobs: Set<number>;        // ✅ ใช้ ID (position)
  skills: Set<number>;      // ✅ ใช้ ID
  locations: Set<string>;
  experiences: Set<string>;
  unions: Set<string>;
};
type SelectedGroup = keyof SelectedMap;

// API models (ตาม payload ที่ให้มา)
type Department = { id: number; nameTh: string; nameEn: string; description?: string };
type Position = {
  id: number; nameTh: string; nameEn: string; description?: string;
  departmentId: number; departmentNameTh: string; departmentNameEn: string;
};
type Skill = {
  id: number; nameTh: string; nameEn: string; description?: string;
  positionId: number; positionNameTh: string; positionNameEn: string;
};

@Component({
  selector: '[info-search]',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './info-search.component.html',
  styleUrls: ['./info-search.component.css'],
})
export class InfoSearchComponent implements OnInit {
  // พื้นฐาน
  q = '';
  status = '';
  dateFrom: string | null = null;
  dateTo: string | null = null;

  // ===== Data from API =====
  departmentsApi: Department[] = [];
  positionsApi: Position[] = [];
  skillsApi: Skill[] = [];

  // index แบบเร็ว (id -> obj)
  deptById = new Map<number, Department>();
  posById = new Map<number, Position>();
  skillById = new Map<number, Skill>();

  // ฟิลเตอร์คงเดิม
  locations = ['กรุงเทพฯ', 'เชียงใหม่', 'ขอนแก่น', 'ภูเก็ต'];
  experiences = ['Junior', 'Mid', 'Senior', 'Lead'];
  unions = ['สมาคม A', 'สมาคม B', 'สมาคม C'];

  // Combobox งาน
  jobQuery = '';
  jobOpen = false;
  jobActive = 0;

  jobFlat: Array<
    | { type: 'header'; deptName: string }
    | { type: 'item'; deptId: number; posId: number; posName: string }
  > = [];

  readonly selectedKeys: SelectedGroup[] = [
    'departments', 'jobs', 'skills', 'locations', 'experiences', 'unions'
  ];

  selected: SelectedMap = {
    departments: new Set(),
    jobs: new Set(),
    skills: new Set(),
    locations: new Set(),
    experiences: new Set(),
    unions: new Set(),
  };

  // หน้า/โหลด
  page = 1;
  limit = 12;
  loading = false;
  results: Profile[] = [];
  total = 0;
  private lastPageCount = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: InfoSearchService,
    private publicService: PubilcService
  ) { }

  ngOnInit(): void {
    // โหลด master แล้วค่อยค้น (เพื่อให้เมนูพร้อม)
    this.loadMaster().then(() => this.search(true));
  }

  // ===== Load master data =====
  private async loadMaster(): Promise<void> {
    await Promise.all([
      new Promise<void>(resolve => {
        this.publicService.getDepartment().subscribe(res => {
          this.departmentsApi = res?.items ?? [];
          this.deptById.clear();
          this.departmentsApi.forEach(d => this.deptById.set(d.id, d));
          resolve();
        }, _ => resolve());
      }),
      new Promise<void>(resolve => {
        this.publicService.getPosition().subscribe(res => {
          this.positionsApi = res?.items ?? [];
          this.posById.clear();
          this.positionsApi.forEach(p => this.posById.set(p.id, p));
          resolve();
        }, _ => resolve());
      }),
      new Promise<void>(resolve => {
        this.publicService.getSkills().subscribe(res => {
          this.skillsApi = Array.isArray(res) ? res : (res?.items ?? []);
          this.skillById.clear();
          this.skillsApi.forEach(s => this.skillById.set(s.id, s));
          resolve();
        }, _ => resolve());
      }),
    ]);
  }

  goProfile(m: Profile) {
    const anyM = m as any;
    const id = anyM.userId ?? anyM.id;

    console.log('goProfile -> m =', m, 'id =', id);

    if (!id) {
      console.warn('❗ ไม่มี id สำหรับ profile นี้');
      return;
    }

    this.router.navigate(['profiles', id], { relativeTo: this.route });
  }

  // ===== State =====
  get hasDepartment(): boolean { return this.selected.departments.size > 0; }
  get hasJob(): boolean { return this.selected.jobs.size > 0; }

  // Jobs/Skills filtered by selection
  get jobsFiltered(): Position[] {
    const deptId = [...this.selected.departments][0];
    return deptId ? this.positionsApi.filter(p => p.departmentId === deptId) : [];
  }
  get skillsFiltered(): Skill[] {
    const posId = [...this.selected.jobs][0];
    return posId ? this.skillsApi.filter(s => s.positionId === posId) : [];
  }

  // ===== Actions =====
  onSubmit(): void {
    if (this.loading) return;
    this.search(true);
  }

  private resetDownstream(from: SelectedGroup) {
    if (from === 'departments') {
      this.selected.jobs.clear();
      this.selected.skills.clear();
    } else if (from === 'jobs') {
      this.selected.skills.clear();
    }
  }

  clearFilters(): void {
    this.q = '';
    this.status = '';
    this.dateFrom = null;
    this.dateTo = null;
    this.selectedKeys.forEach(k => this.selected[k].clear());

    // combobox
    this.jobQuery = '';
    this.jobOpen = false;
    this.jobFlat = [];
    this.jobActive = 0;

    this.search(true);
  }
  clearAllFilters(): void { this.clearFilters(); }

  loadMore(): void {
    if (this.loading || !this.hasMore) return;
    this.page += 1;
    this.fetchPage();
  }

  // ===== Search core =====
  private search(reset = false): void {
    if (reset) {
      this.page = 1;
      this.results = [];
      this.total = 0;
      this.lastPageCount = 0;
    }
    this.fetchPage();
  }

  // ===== Search core =====
  private fetchPage(): void {
    if (!this.hasDepartment || !this.hasJob) {
      this.results = [];
      this.total = 0;
      this.lastPageCount = 0;
      return;
    }

    this.loading = true;

    // ✅ แยก helper ชัดเจนตามชนิด
    const pickIds = (k: 'departments' | 'jobs' | 'skills') =>
      Array.from(this.selected[k] as Set<number>);

    const pickStrs = (k: 'locations' | 'experiences' | 'unions') =>
      Array.from(this.selected[k] as Set<string>);

    this.api.searchProfiles({
      q: this.q?.trim(),
      status: this.status,
      page: this.page,
      limit: this.limit,
      dateFrom: this.dateFrom || undefined,
      dateTo: this.dateTo || undefined,

      // ✅ ส่งเป็น id lists
      departmentIds: pickIds('departments'),
      positionIds: pickIds('jobs'),
      skillIds: pickIds('skills'),

      // ✅ กลุ่ม string
      locations: pickStrs('locations'),
      experiences: pickStrs('experiences'),
      unions: pickStrs('unions'),
    } as any).subscribe({
      next: (res) => {
        const items = res.items ?? [];
        this.lastPageCount = items.length;
        this.results = this.page === 1 ? items : [...this.results, ...items];
        this.total = res.total ?? (this.page === 1 ? items.length : this.results.length);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  private coalesce<T>(...vals: Array<T | undefined | null>): T | undefined {
    for (const v of vals) if (v !== undefined && v !== null) return v as T;
    return undefined;
  }

  statusOf(m: Profile): 'active' | 'pending' | 'inactive' | '' {
    const anyM = m as any;
    const raw = (this.coalesce<string>(anyM?.status, anyM?.memberStatus, anyM?.state) || '').toLowerCase();
    if (raw === 'active') return 'active';
    if (raw === 'pending' || raw === 'awaiting' || raw === 'review') return 'pending';
    if (raw === 'inactive' || raw === 'disabled' || raw === 'suspended') return 'inactive';
    return '';
  }
  statusLabel(s: string): string {
    switch (s) {
      case 'active': return 'ใช้งาน';
      case 'pending': return 'รอตรวจสอบ';
      case 'inactive': return 'ระงับ';
      default: return '—';
    }
  }
  statusClass(m: Profile) {
    const s = this.statusOf(m);
    return {
      'bg-emerald-500/20 text-emerald-300': s === 'active',
      'bg-yellow-500/20 text-yellow-300': s === 'pending',
      'bg-red-500/20 text-red-300': s === 'inactive',
    };
  }

  provinceOf(m: Profile): string {
    const anyM = m as any;
    return this.coalesce<string>(anyM?.province, anyM?.location, anyM?.addrProvince) || '—';
  }

  skillsLabel(m: Profile): string {
    const anyM = m as any;
    if (Array.isArray(anyM?.skills)) return anyM.skills.join(', ');
    if (Array.isArray(anyM?.tags)) return anyM.tags.join(', ');
    if (Array.isArray(anyM?.abilities)) return anyM.abilities.join(', ');
    if (typeof anyM?.skills === 'string') return anyM.skills;
    if (typeof anyM?.tags === 'string') return anyM.tags;
    if (typeof anyM?.abilities === 'string') return anyM.abilities;
    return '—';
  }

  get hasMore(): boolean {
    if (this.total) return this.results.length < this.total;
    return this.lastPageCount === this.limit;
  }

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

  // ===== Chip helpers =====
  chipClass(active: boolean): string {
    return [
      'rounded-full px-3 py-1.5 text-xs border transition',
      active
        ? 'bg-[#8aab06]/20 border-[#8aab06]/40 text-[#d9ff6b]'
        : 'bg-white/5 border-white/15 text-white/80 hover:bg-white/10'
    ].join(' ');
  }
  // ===== Chip helpers (ไม่ใช้ overload เพื่อให้ template เรียกแบบไดนามิกได้) =====
  isSelected(group: SelectedGroup, value: number | string): boolean {
    const set = this.selected[group] as Set<number | string>;
    return set?.has(value) ?? false;
  }

  toggleTag(group: SelectedGroup, value: number | string): void {
    const set = this.selected[group] as Set<number | string>;
    if (!set) return;

    if (group === 'departments' || group === 'jobs') {
      // single-select
      set.clear();
      set.add(value);
      this.resetDownstream(group);
    } else {
      set.has(value) ? set.delete(value) : set.add(value);
    }

    if (this.hasDepartment && this.hasJob) {
      this.onSubmit();
    } else {
      // ยังไม่ครบเงื่อนไข -> ไม่ยิงค้นหา
      this.results = [];
      this.total = 0;
      this.lastPageCount = 0;
    }
  }

  removeChip(group: SelectedGroup, value: number | string): void {
    const set = this.selected[group] as Set<number | string>;
    if (!set) return;

    if (set.has(value)) set.delete(value);

    // ถ้าถอด department/job ออก ให้ล้าง downstream
    if (group === 'departments') {
      this.selected.jobs.clear();
      this.selected.skills.clear();
    } else if (group === 'jobs') {
      this.selected.skills.clear();
    }

    if (this.hasDepartment && this.hasJob) {
      this.onSubmit();
    } else {
      this.results = [];
      this.total = 0;
      this.lastPageCount = 0;
    }
  }

  selectedChips(): Array<{ group: SelectedGroup; value: number | string; label: string }> {
    const out: Array<{ group: SelectedGroup; value: number | string; label: string }> = [];

    // departments
    for (const id of this.selected.departments) {
      out.push({ group: 'departments', value: id, label: this.deptById.get(id)?.nameTh ?? `Dept #${id}` });
    }
    // jobs
    for (const id of this.selected.jobs) {
      const p = this.posById.get(id);
      out.push({ group: 'jobs', value: id, label: p?.nameTh ?? `Position #${id}` });
    }
    // skills
    for (const id of this.selected.skills) {
      const s = this.skillById.get(id);
      out.push({ group: 'skills', value: id, label: s?.nameTh ?? `Skill #${id}` });
    }
    // others
    for (const v of this.selected.locations) out.push({ group: 'locations', value: v, label: v });
    for (const v of this.selected.experiences) out.push({ group: 'experiences', value: v, label: v });
    for (const v of this.selected.unions) out.push({ group: 'unions', value: v, label: v });

    return out;
  }
  activeChipCount(): number { return this.selectedChips().length; }

  // ===== Combobox =====
  @ViewChild('jobBox', { static: false }) jobBox?: ElementRef;

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const el = this.jobBox?.nativeElement as HTMLElement | undefined;
    if (!el) return;
    if (!el.contains(ev.target as Node)) this.jobOpen = false;
  }

  private rebuildJobMenu() {
    const q = this.jobQuery.trim().toLowerCase();
    const out: typeof this.jobFlat = [];

    // group positions by department
    const group = new Map<number, Position[]>();
    for (const p of this.positionsApi) {
      if (q && !(`${p.nameTh} ${p.nameEn}`.toLowerCase().includes(q))) continue;
      const arr = group.get(p.departmentId) ?? [];
      arr.push(p);
      group.set(p.departmentId, arr);
    }

    for (const [deptId, items] of group) {
      const deptName = this.deptById.get(deptId)?.nameTh ?? `Dept #${deptId}`;
      out.push({ type: 'header', deptName });
      for (const j of items) {
        out.push({ type: 'item', deptId, posId: j.id, posName: j.nameTh || j.nameEn });
      }
    }

    this.jobFlat = out;
    const firstItemIdx = this.jobFlat.findIndex(r => r.type === 'item');
    this.jobActive = firstItemIdx >= 0 ? firstItemIdx : 0;
  }

  openJobMenu() {
    this.jobOpen = true;
    this.rebuildJobMenu();
  }
  closeJobMenuSoon() { setTimeout(() => (this.jobOpen = false), 80); }
  onJobQueryChange() { this.openJobMenu(); }

  onJobKeydown(ev: KeyboardEvent) {
    if (!this.jobOpen && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) {
      this.openJobMenu();
      ev.preventDefault();
      return;
    }
    if (!this.jobOpen) return;

    const max = this.jobFlat.length - 1;

    if (ev.key === 'ArrowDown') {
      do { this.jobActive = Math.min(max, this.jobActive + 1); }
      while (this.jobFlat[this.jobActive]?.type === 'header' && this.jobActive < max);
      ev.preventDefault();
    } else if (ev.key === 'ArrowUp') {
      do { this.jobActive = Math.max(0, this.jobActive - 1); }
      while (this.jobFlat[this.jobActive]?.type === 'header' && this.jobActive > 0);
      ev.preventDefault();
    } else if (ev.key === 'Enter') {
      const row = this.jobFlat[this.jobActive] as any;
      if (row && row.type === 'item') this.pickJob(row.deptId, row.posId, row.posName);
      ev.preventDefault();
    } else if (ev.key === 'Escape') {
      this.jobOpen = false;
      ev.preventDefault();
    }
  }

  // เลือกจากเมนู: set department + job ด้วย ID
  pickJob(deptId: number, posId: number, posName: string) {
    this.selected.departments.clear();
    this.selected.departments.add(deptId);
    this.resetDownstream('departments');

    this.selected.jobs.clear();
    this.selected.jobs.add(posId);
    this.resetDownstream('jobs');

    // อัปเดต query + ปิดเมนู + ยิงค้นหา
    this.jobQuery = posName || this.posById.get(posId)?.nameTh || '';
    this.jobOpen = false;

    if (this.hasDepartment && this.hasJob) this.onSubmit();
  }
}
