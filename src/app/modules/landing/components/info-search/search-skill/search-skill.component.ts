import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { PubilcService } from 'src/app/shared/service/public/pubilc.service';
import { LocaleSwitcherService } from 'src/locale/locale-switcher.service';
import { environment } from 'src/environments/environment';
import { InfoSearchService, Profile, ProfileSearchOptions } from '../service/info-search.service';

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
  locations: Set<number>;
  experiences: Set<number>;
  unions: Set<number>;
  genders: Set<number>;
};
type SelectedGroup = keyof SelectedMap;

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
  selector: 'app-search-skill',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './search-skill.component.html',
  styleUrl: './search-skill.component.css'
})
export class SearchSkillComponent implements OnInit {

  @Input() mode: 'directory' | 'skills' = 'skills';

  // query / date
  q = '';
  dateFrom: string | null = null;
  dateTo: string | null = null;

  // master
  departmentsApi: Department[] = [];
  positionsApi: Position[] = [];
  skillsApi: Skill[] = [];
  workLocationsApi: WorkLocation[] = [];
  unionsApi: UnionMembership[] = [];
  experiencesApi: ExperienceLevel[] = [];
  gendersApi: GenderIdentity[] = [];

  deptById = new Map<number, Department>();
  posById = new Map<number, Position>();
  skillById = new Map<number, Skill>();
  workLocationById = new Map<number, WorkLocation>();
  unionById = new Map<number, UnionMembership>();
  experienceById = new Map<number, ExperienceLevel>();
  genderById = new Map<number, GenderIdentity>();

  // state
  selected: SelectedMap = {
    departments: new Set(),
    jobs: new Set(),
    skills: new Set(),
    locations: new Set(),
    experiences: new Set(),
    unions: new Set(),
    genders: new Set(),
  };

  // paging
  page = 1;
  limit = 12;
  loading = false;
  results: Profile[] = [];
  total = 0;
  private lastPageCount = 0;

  // UI
  skillQuery = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: InfoSearchService,
    private publicService: PubilcService,
    private ls: LocaleSwitcherService,
  ) { }

  ngOnInit(): void {
    this.loadMaster().then(() => {
      this.route.queryParamMap.subscribe(async (pm) => {
        if (pm.keys.length) {
          this.restoreSelectedFromQuery(pm);

          const deptId = [...this.selected.departments][0];
          if (deptId) await this.loadPositionsByDepartment(deptId);
        }
        this.search(true);
      });
    });
  }

  get isThai(): boolean {
    return this.ls.currentLocale() === 'th';
  }

  // ===== master =====
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
        this.publicService.getSkills().subscribe(res => {
          this.skillsApi = Array.isArray(res) ? res : (res?.items ?? []);
          this.skillById.clear();
          this.skillsApi.forEach(s => this.skillById.set(s.id, s));
          resolve();
        }, _ => resolve());
      }),

      new Promise<void>(resolve => {
        this.publicService.getWorkLocaltion().subscribe(res => {
          const items = Array.isArray(res) ? res : (res?.items ?? []);
          this.workLocationsApi = items;
          this.workLocationById.clear();
          this.workLocationsApi.forEach(w => this.workLocationById.set(w.id, w));
          resolve();
        }, _ => resolve());
      }),

      new Promise<void>(resolve => {
        this.publicService.getUnionMembership().subscribe(res => {
          const items = Array.isArray(res) ? res : (res?.items ?? []);
          this.unionsApi = items;
          this.unionById.clear();
          this.unionsApi.forEach(u => this.unionById.set(u.id, u));
          resolve();
        }, _ => resolve());
      }),

      new Promise<void>(resolve => {
        this.publicService.getExperienceLevel().subscribe(res => {
          const items = Array.isArray(res) ? res : (res?.items ?? []);
          this.experiencesApi = items;
          this.experienceById.clear();
          this.experiencesApi.forEach(e => this.experienceById.set(e.id, e));
          resolve();
        }, _ => resolve());
      }),

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

  private loadPositionsByDepartment(deptId: number): Promise<void> {
    this.positionsApi = [];
    this.posById.clear();

    return new Promise<void>((resolve) => {
      this.publicService.listByDepartment(deptId, 0, 500).subscribe({
        next: (res) => {
          const items = res?.items ?? [];
          this.positionsApi = items
            .filter((p: any) => typeof p?.id === 'number')
            .map((p: any) => ({
              id: p.id,
              nameTh: p.nameTh ?? '',
              nameEn: p.nameEn ?? '',
              description: p.description,
              departmentId: Number(p.departmentId ?? deptId),
              departmentNameTh: this.deptById.get(Number(p.departmentId ?? deptId))?.nameTh ?? '',
              departmentNameEn: this.deptById.get(Number(p.departmentId ?? deptId))?.nameEn ?? '',
            }));

          this.positionsApi.forEach(x => this.posById.set(x.id, x));
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  private pickLabel(th?: string, en?: string): string {
    const isTh = this.isThai;
    if (isTh) return (th && th.trim()) || (en && en.trim()) || '';
    return (en && en.trim()) || (th && th.trim()) || '';
  }

  labelDept(d: Department): string { return this.pickLabel(d.nameTh, d.nameEn); }
  labelPos(p: Position): string { return this.pickLabel(p.nameTh, p.nameEn); }
  labelSkill(s: Skill): string { return this.pickLabel(s.nameTh, s.nameEn); }

  // ===== context display =====
  deptLabelSelected(): string {
    const id = [...this.selected.departments][0];
    if (!id) return '—';
    const d = this.deptById.get(id);
    return d ? this.labelDept(d) : `Dept #${id}`;
  }

  jobLabelSelected(): string {
    const ids = [...this.selected.jobs];
    if (!ids.length) return '—';

    // ถ้าจะให้โชว์หลาย job
    const labels = ids.map(id => {
      const p = this.posById.get(id);
      return p ? this.labelPos(p) : `Job #${id}`;
    });

    return labels.join(', ');
  }

  skillsSelectedCount(): number {
    return this.selected.skills.size;
  }

  // ===== derived =====
  get hasDepartment(): boolean { return this.selected.departments.size > 0; }
  get hasJob(): boolean { return this.selected.jobs.size > 0; }

  get skillsFiltered(): Skill[] {
    const posIds = Array.from(this.selected.jobs);
    if (!posIds.length) return [];

    const posSet = new Set(posIds);
    const q = this.skillQuery.trim().toLowerCase();

    const list = this.skillsApi
      .filter(s => posSet.has(s.positionId))
      .filter(s => {
        if (!q) return true;
        const blob = `${s.nameTh} ${s.nameEn}`.toLowerCase();
        return blob.includes(q);
      });

    // ✅ selected first, then sort by label
    const labelOf = (s: Skill) => this.labelSkill(s).toLowerCase();
    return [...list].sort((a, b) => {
      const aSel = this.selected.skills.has(a.id) ? 0 : 1;
      const bSel = this.selected.skills.has(b.id) ? 0 : 1;
      if (aSel !== bSel) return aSel - bSel;
      return labelOf(a).localeCompare(labelOf(b));
    });
  }

  selectAllVisibleSkills() {
    for (const s of this.skillsFiltered) {
      this.selected.skills.add(s.id);
    }
    this.search(true);
    this.syncUrl();
  }

  // ===== search =====
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
    if (!this.hasDepartment) {
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

  get hasMore(): boolean {
    if (this.total) return this.results.length < this.total;
    return this.lastPageCount === this.limit;
  }

  loadMore(): void {
    if (this.loading || !this.hasMore) return;
    this.page += 1;
    this.fetchPage();
  }

  // ===== actions =====
  toggleSkill(skillId: number) {
    const set = this.selected.skills;
    if (set.has(skillId)) set.delete(skillId);
    else set.add(skillId);
    this.search(true);
    this.syncUrl();
  }

  clearSkills() {
    this.selected.skills.clear();
    this.search(true);
    this.syncUrl();
  }

  backToDirectory() {
    const lang = this.getLangPrefix();
    const commands = lang ? ['/', lang] : ['/'];

    const tree = this.router.createUrlTree(commands, {
      queryParams: this.serializeSelected(),
    });

    this.router.navigateByUrl(tree, { replaceUrl: true });
  }

  goProfile(m: Profile) {
    const anyM = m as any;
    const id = anyM.userId ?? anyM.id;
    if (!id) return;

    const lang = this.getLangPrefix();
    const base = lang ? ['/', lang] : ['/'];
    this.router.navigate([...base, 'profiles', id], { queryParamsHandling: 'merge' });
  }

  // ===== url state =====
  private syncUrl() {
    const tree = this.router.parseUrl(this.router.url); // ✅ ล็อก path เดิม 100%
    tree.queryParams = this.serializeSelected();        // ✅ set query ทั้งชุด
    this.router.navigateByUrl(tree, { replaceUrl: true });
  }

  private serializeSelected(): any {
    const toCsv = (s: Set<any>) => Array.from(s).join(',');

    const qp: any = {
      q: this.q?.trim() || null,
      dept: toCsv(this.selected.departments) || null,
      jobs: toCsv(this.selected.jobs) || null,
      skills: toCsv(this.selected.skills) || null,
      locations: toCsv(this.selected.locations) || null,
      unions: toCsv(this.selected.unions) || null,
      experiences: toCsv(this.selected.experiences) || null,
      genders: toCsv(this.selected.genders) || null,
    };

    Object.keys(qp).forEach(k => (qp[k] == null || qp[k] === '') && delete qp[k]);
    return qp;
  }

  private restoreSelectedFromQuery(pm: any) {
    const fromCsv = (v: string | null) =>
      new Set((v ? v.split(',').filter(Boolean).map(x => Number(x)) : []));

    this.q = pm.get('q') ?? '';
    this.selected.departments = fromCsv(pm.get('dept'));
    this.selected.jobs = fromCsv(pm.get('jobs'));
    this.selected.skills = fromCsv(pm.get('skills'));
    this.selected.locations = fromCsv(pm.get('locations'));
    this.selected.unions = fromCsv(pm.get('unions'));
    this.selected.experiences = fromCsv(pm.get('experiences'));
    this.selected.genders = fromCsv(pm.get('genders'));
  }

  private getLangPrefix(): string | null {
    const pathOnly = this.router.url.split('?')[0].split('#')[0];
    const segments = pathOnly.split('/').filter(Boolean);
    const supported = new Set(['th', 'en']);
    return segments.length && supported.has(segments[0]) ? segments[0] : null;
  }

  // ===== card helpers =====
  fullName(m: Profile): string {
    return [m.firstName, m.lastName].filter(Boolean).join(' ') || '—';
  }
  memberCode(m: Profile): string {
    return `${(m.title ?? 0).toString().padStart(6, '0')}`;
  }
  avatar(m: Profile): string {
    return toAbsolute((m as any).avatarUrl) || 'assets/images/avatar-placeholder.png';
  }
  provinceOf(m: Profile): string {
    const anyM = m as any;
    return anyM?.province ?? anyM?.location ?? anyM?.addrProvince ?? '—';
  }

  // ✅ แสดงรายการ position ของ dept ที่เลือก (เอาไว้ทำชิปแบบรูปสุดท้าย)
  get positionsForDepartment(): Position[] {
    const deptId = [...this.selected.departments][0];
    if (!deptId) return [];
    return this.positionsApi.filter(p => p.departmentId === deptId);
  }

  // ✅ label Job ที่เลือก (รองรับหลายอัน)
  jobsLabelSelected(): string {
    if (this.selected.jobs.size === 0) return '—';
    const labels = [...this.selected.jobs]
      .map(id => this.posById.get(id))
      .filter(Boolean)
      .map(p => this.labelPos(p!));
    return labels.length ? labels.join(', ') : '—';
  }

  // ✅ toggle job แบบ multi-select (ชิป)
  toggleJob(posId: number) {
    if (!posId) return;

    const set = this.selected.jobs;
    if (set.has(posId)) set.delete(posId);
    else set.add(posId);

    // ✅ prune skills: ถ้า skills ที่เลือก ไม่อยู่ใน jobs ที่เลือกแล้ว -> เอาออก
    this.pruneSkillsBySelectedJobs();

    this.search(true);
    this.syncUrl();
  }

  clearJobs() {
    if (this.selected.jobs.size === 0) return;
    this.selected.jobs.clear();
    this.selected.skills.clear(); // downstream
    this.search(true);
    this.syncUrl();
  }

  // ✅ ลบ skills ที่ไม่ตรงกับ job ที่เลือก
  private pruneSkillsBySelectedJobs() {
    const jobSet = new Set(this.selected.jobs);
    if (jobSet.size === 0) {
      this.selected.skills.clear();
      return;
    }

    // skill id -> หา positionId แล้วเช็ค
    for (const sid of [...this.selected.skills]) {
      const s = this.skillById.get(sid);
      if (!s) {
        this.selected.skills.delete(sid);
        continue;
      }
      if (!jobSet.has(s.positionId)) {
        this.selected.skills.delete(sid);
      }
    }
  }

  // (ออปชัน) ให้พิมพ์ค้นหาแล้ว sort/refresh รายการทันที
  onSkillQueryChanged() {
    // ไม่จำเป็นต้องยิง search API แค่ rerender list ก็พอ
  }

}
