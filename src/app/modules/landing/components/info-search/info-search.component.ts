import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Profile, InfoSearchService, ProfileSearchOptions } from './service/info-search.service';
import { environment } from 'src/environments/environment';
import { PubilcService } from 'src/app/shared/service/public/pubilc.service';
import { LocaleSwitcherService } from 'src/locale/locale-switcher.service';

function toAbsolute(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = environment.apiUrl.replace(/\/api\/?$/, '');
  return `${base}${url.startsWith('/') ? url : '/' + url}`;
}

type SelectedMap = {
  departments: Set<number>;
  jobs: Set<number>;
  skills: Set<number>;
  locations: Set<number>;     // ✅ เปลี่ยนเป็น number (id)
  experiences: Set<number>;   // ✅
  unions: Set<number>;        // ✅
  genders: Set<number>;       // ✅ ใหม่
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

type WorkLocation = { id: number; nameTh: string; nameEn: string; description?: string };
type UnionMembership = { id: number; nameTh: string; nameEn: string; description?: string };
type ExperienceLevel = { id: number; nameTh: string; nameEn: string; description?: string };
type GenderIdentity = { id: number; nameTh: string; nameEn: string; description?: string };

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

  @Input() showAllSearch: boolean = true; // default = เปิด auto width
  // ===== Data from API =====
  departmentsApi: Department[] = [];
  positionsApi: Position[] = [];
  skillsApi: Skill[] = [];
  workLocationsApi: WorkLocation[] = [];
  unionsApi: UnionMembership[] = [];
  experiencesApi: ExperienceLevel[] = [];
  gendersApi: GenderIdentity[] = [];

  workLocationById = new Map<number, WorkLocation>();
  unionById = new Map<number, UnionMembership>();
  experienceById = new Map<number, ExperienceLevel>();
  genderById = new Map<number, GenderIdentity>();
  deptById = new Map<number, Department>();
  posById = new Map<number, Position>();
  skillById = new Map<number, Skill>();

  // ฟิลเตอร์คงเดิม
  locations = ['กรุงเทพฯ', 'เชียงใหม่', 'ขอนแก่น', 'ภูเก็ต'];
  experiences = ['Junior', 'Mid', 'Senior', 'Lead'];
  unions = ['สมาคม A', 'สมาคม B', 'สมาคม C'];

  // ✅ position pagination สำหรับ master ของ dept
  posPage = 0;
  posSize = 500; // เอาเยอะๆ เพื่อใช้เป็น master filter
  posTotalPages = 0;

  loadingPositions = false;

  // Combobox งาน
  jobQuery = '';
  jobOpen = false;
  jobActive = 0;

  jobFlat: Array<
    | { type: 'header'; deptName: string }
    | { type: 'item'; deptId: number; posId: number; posName: string }
  > = [];

  readonly selectedKeys: SelectedGroup[] = [
    'departments', 'jobs', 'skills', 'locations', 'experiences', 'unions', 'genders'
  ];

  selected: SelectedMap = {
    departments: new Set(),
    jobs: new Set(),
    skills: new Set(),
    locations: new Set(),
    experiences: new Set(),
    unions: new Set(),
    genders: new Set(),
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
    private publicService: PubilcService,
    private ls: LocaleSwitcherService,
  ) { }

  ngOnInit(): void {
    // โหลด master แล้วค่อยค้น (เพื่อให้เมนูพร้อม)
    this.loadMaster().then(() => this.search(true));
  }

  get isThai(): boolean {
    // ให้เหมือน HandleProfileComponent
    return this.ls.currentLocale() === 'th';
  }

  private loadPositionsByDepartment(deptId: number): Promise<void> {
    this.loadingPositions = true;

    // reset positions ก่อนโหลดใหม่ (กัน UI เก่าค้าง)
    this.positionsApi = [];
    this.posById.clear();

    return new Promise<void>((resolve) => {
      this.publicService.listByDepartment(deptId, 0, this.posSize).subscribe({
        next: (res) => {

          const items = res?.items ?? [];

          this.positionsApi = items
            .filter((p: any): p is { id: number } => typeof p?.id === 'number') // ✅ กัน id undefined
            .map((p: any) => ({
              id: p.id, // ตอนนี้เป็น number แน่นอน
              nameTh: p.nameTh ?? '',
              nameEn: p.nameEn ?? '',
              description: p.description,
              departmentId: Number(p.departmentId ?? deptId),
              departmentNameTh: this.deptById.get(Number(p.departmentId ?? deptId))?.nameTh ?? '',
              departmentNameEn: this.deptById.get(Number(p.departmentId ?? deptId))?.nameEn ?? '',
            }));

          this.posById.clear();
          this.positionsApi.forEach(x => this.posById.set(x.id, x));

          this.loadingPositions = false;
          resolve();
        },
        error: () => {
          this.loadingPositions = false;
          resolve();
        }
      });
    });
  }

  private pickLabel(th?: string, en?: string): string {
    const lang = this.ls.currentLocale();   // อ่านจาก URL / service
    const isTh = lang === 'th';

    if (isTh) {
      return (th && th.trim()) || (en && en.trim()) || '';
    } else {
      return (en && en.trim()) || (th && th.trim()) || '';
    }
  }


  // ===== Load master data =====
  private async loadMaster(): Promise<void> {
    await Promise.all([
      // Department
      new Promise<void>(resolve => {
        this.publicService.getDepartment().subscribe(res => {
          this.departmentsApi = res?.items ?? [];
          this.deptById.clear();
          this.departmentsApi.forEach(d => this.deptById.set(d.id, d));
          resolve();
        }, _ => resolve());
      }),
      // Skills
      new Promise<void>(resolve => {
        this.publicService.getSkills().subscribe(res => {
          this.skillsApi = Array.isArray(res) ? res : (res?.items ?? []);
          this.skillById.clear();
          this.skillsApi.forEach(s => this.skillById.set(s.id, s));
          resolve();
        }, _ => resolve());
      }),

      // ✅ Work location
      new Promise<void>(resolve => {
        this.publicService.getWorkLocaltion().subscribe(res => {
          const items = Array.isArray(res) ? res : (res?.items ?? []);
          this.workLocationsApi = items;
          this.workLocationById.clear();
          this.workLocationsApi.forEach(w => this.workLocationById.set(w.id, w));
          resolve();
        }, _ => resolve());
      }),

      // ✅ Union membership
      new Promise<void>(resolve => {
        this.publicService.getUnionMembership().subscribe(res => {
          const items = Array.isArray(res) ? res : (res?.items ?? []);
          this.unionsApi = items;
          this.unionById.clear();
          this.unionsApi.forEach(u => this.unionById.set(u.id, u));
          resolve();
        }, _ => resolve());
      }),

      // ✅ Experience level
      new Promise<void>(resolve => {
        this.publicService.getExperienceLevel().subscribe(res => {
          const items = Array.isArray(res) ? res : (res?.items ?? []);
          this.experiencesApi = items;
          this.experienceById.clear();
          this.experiencesApi.forEach(e => this.experienceById.set(e.id, e));
          resolve();
        }, _ => resolve());
      }),

      // ✅ Gender identity
      new Promise<void>(resolve => {
        this.publicService.getGenderIdentity().subscribe(res => {
          const items = Array.isArray(res) ? res : (res?.items ?? []);
          this.gendersApi = items;
          this.genderById.clear();
          this.gendersApi.forEach(g => this.genderById.set(g.id, g));
          resolve();
        }, _ => resolve());
      }),
    ]);
  }


  goProfile(m: Profile) {
    const anyM = m as any;
    const id = anyM.userId ?? anyM.id;

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
    // เอา id ของ jobs ที่เลือกทั้งหมดออกมา
    const posIds = Array.from(this.selected.jobs) as number[];

    if (!posIds.length) return [];

    const posSet = new Set(posIds);
    return this.skillsApi.filter(s => posSet.has(s.positionId));
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

    const pickIds = (k: 'departments' | 'jobs' | 'skills') =>
      Array.from(this.selected[k] as Set<number>);

    const payload: ProfileSearchOptions = {
      q: this.q?.trim(),
      page: this.page,
      limit: this.limit,
      dateFrom: this.dateFrom || undefined,
      dateTo: this.dateTo || undefined,
      creditDeptIds: pickIds('departments'),
      creditPosIds: pickIds('jobs'),
      creditSkillIds: pickIds('skills'),
      // ถ้า backend ยังไม่รองรับ locations/experiences/unions จะยังไม่ต้องส่งก็ได้
    };

    this.api.searchProfiles(payload).subscribe({
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

  async toggleTag(group: SelectedGroup, value: number | string): Promise<void> {
    const set = this.selected[group] as Set<number | string>;
    if (!set) return;

    if (group === 'departments') {
      // ✅ single-select department
      set.clear();
      set.add(value);

      // ✅ เคลียร์ downstream
      this.resetDownstream('departments');
      this.jobQuery = ''; // (optional) เคลียร์ช่องค้นหางาน

      // ✅ โหลด position ตาม department ที่เลือก
      const deptId = Number(value);
      if (!Number.isNaN(deptId)) {
        await this.loadPositionsByDepartment(deptId);

        // ✅ กัน user เลือก job ค้างจาก dept เก่า
        this.selected.jobs.clear();
        this.selected.skills.clear();
      }

    } else {
      // multi-select groups (jobs/skills/...)
      if (set.has(value)) set.delete(value);
      else set.add(value);

      if (group === 'jobs') {
        this.resetDownstream('jobs'); // ล้าง skills ทุกครั้งที่ jobs เปลี่ยน
      }
    }

    // trigger search เฉพาะเมื่อครบคู่ dept + job
    if (this.hasDepartment && this.hasJob) {
      this.onSubmit();
    } else {
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
      const d = this.deptById.get(id);
      out.push({
        group: 'departments',
        value: id,
        label: this.pickLabel(d?.nameTh, d?.nameEn) || `Dept #${id}`,
      });
    }

    // jobs
    for (const id of this.selected.jobs) {
      const p = this.posById.get(id);
      out.push({
        group: 'jobs',
        value: id,
        label: this.pickLabel(p?.nameTh, p?.nameEn) || `Position #${id}`,
      });
    }

    // skills
    for (const id of this.selected.skills) {
      const s = this.skillById.get(id);
      out.push({
        group: 'skills',
        value: id,
        label: this.pickLabel(s?.nameTh, s?.nameEn) || `Skill #${id}`,
      });
    }

    // ✅ locations
    for (const id of this.selected.locations) {
      const w = this.workLocationById.get(id);
      out.push({
        group: 'locations',
        value: id,
        label: w ? this.labelWorkLocation(w) : `Location #${id}`,
      });
    }

    // ✅ experiences
    for (const id of this.selected.experiences) {
      const e = this.experienceById.get(id);
      out.push({
        group: 'experiences',
        value: id,
        label: e ? this.labelExperience(e) : `Experience #${id}`,
      });
    }

    // ✅ unions
    for (const id of this.selected.unions) {
      const u = this.unionById.get(id);
      out.push({
        group: 'unions',
        value: id,
        label: u ? this.labelUnion(u) : `Union #${id}`,
      });
    }

    // ✅ genders
    for (const id of this.selected.genders) {
      const g = this.genderById.get(id);
      out.push({
        group: 'genders',
        value: id,
        label: g ? this.labelGender(g) : `Gender #${id}`,
      });
    }

    return out;
  }

  labelDept(d: Department): string {
    return this.pickLabel(d.nameTh, d.nameEn);
  }
  labelPos(p: Position): string {
    return this.pickLabel(p.nameTh, p.nameEn);
  }
  labelSkill(s: Skill): string {
    return this.pickLabel(s.nameTh, s.nameEn);
  }
  labelWorkLocation(w: WorkLocation): string {
    return this.pickLabel(w.nameTh, w.nameEn);
  }
  labelUnion(u: UnionMembership): string {
    return this.pickLabel(u.nameTh, u.nameEn);
  }
  labelExperience(e: ExperienceLevel): string {
    return this.pickLabel(e.nameTh, e.nameEn);
  }
  labelGender(g: GenderIdentity): string {
    return this.pickLabel(g.nameTh, g.nameEn);
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

    const group = new Map<number, Position[]>();

    for (const p of this.positionsApi) {
      const searchBlob = `${p.nameTh} ${p.nameEn}`.toLowerCase();
      if (q && !searchBlob.includes(q)) continue;

      const arr = group.get(p.departmentId) ?? [];
      arr.push(p);
      group.set(p.departmentId, arr);
    }

    for (const [deptId, items] of group) {
      const dept = this.deptById.get(deptId);
      const deptName = this.pickLabel(dept?.nameTh, dept?.nameEn) || `Dept #${deptId}`;

      out.push({ type: 'header', deptName });

      for (const j of items) {
        const posName = this.pickLabel(j.nameTh, j.nameEn) || `Position #${j.id}`;
        out.push({ type: 'item', deptId, posId: j.id, posName });
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
  pickJob(deptId: number, posId: number, posNameFromMenu: string) {
    this.selected.departments.clear();
    this.selected.departments.add(deptId);
    this.resetDownstream('departments');

    this.selected.jobs.clear();
    this.selected.jobs.add(posId);
    this.resetDownstream('jobs');

    const pos = this.posById.get(posId);
    this.jobQuery = posNameFromMenu || this.pickLabel(pos?.nameTh, pos?.nameEn);

    this.jobOpen = false;

    if (this.hasDepartment && this.hasJob) this.onSubmit();
  }
  // helper หา lang จาก URL ปัจจุบัน
  private getLangPrefix(): string | null {
    const segments = this.router.url.split('/').filter(Boolean);
    const supported = ['th', 'en'];
    return supported.includes(segments[0]) ? segments[0] : null;
  }

  goFullSearch() {
    const lang = this.getLangPrefix();
    const base = lang ? ['/', lang] : ['/'];
    this.router.navigate([...base, 'member']);
  }

}
