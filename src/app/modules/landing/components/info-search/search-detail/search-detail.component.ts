import { Component, OnDestroy, OnInit } from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Profile, InfoSearchService } from '../service/info-search.service';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { MasterItem, PubilcService } from 'src/app/shared/service/public/pubilc.service';
import { LocaleSwitcherService } from 'src/locale/locale-switcher.service';

/** ทำให้ URL ไฟล์เป็น absolute (ตัด /api ท้าย environment.apiUrl) */
function toAbsolute(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = environment.apiUrl.replace(/\/api\/?$/, '');
  return `${base}${url.startsWith('/') ? url : '/' + url}`;
}

/** แปลงลิงก์ YouTube/Vimeo ให้เป็น embed URL */
function toEmbedUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const url = raw.trim();

  // YouTube
  const ytWatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`;

  // Vimeo
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  return null;
}

type StatKey = 'orders' | 'rating' | 'startedYear';

@Component({
  selector: 'app-search-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './search-detail.component.html',
  styleUrl: './search-detail.component.css'
})
export class SearchDetailComponent implements OnInit, OnDestroy {

  loading = false;
  error = '';
  profile: Profile | null = null;

  // วิดีโอ embed (safe)
  video1?: SafeResourceUrl | null;
  video2?: SafeResourceUrl | null;

  // Resume / Performance
  resumePreviewUrl: string | null = null;
  resumeIsPdf = false;
  resumeSafeUrl?: SafeResourceUrl | null;
  performanceImages: string[] = [];

  private sub?: Subscription;

  // ✅ เก็บชื่อของแต่ละ master ตาม id
  workLocationMap = new Map<number, MasterItem>();
  unionMap = new Map<number, MasterItem>();
  experienceMap = new Map<number, MasterItem>();
  partnerMap = new Map<number, MasterItem>();
  genderMap = new Map<number, MasterItem>();
  raceMap = new Map<number, MasterItem>();
  additionalMap = new Map<number, MasterItem>(); // ใช้ personal-identity

  deptMap = new Map<number, MasterItem>();
  posMap = new Map<number, MasterItem>();
  skillMap = new Map<number, MasterItem>();

  backSrc: 'member' | 'skills' | '' = '';
  private backQueryParams: any = {};

  private currentLocale: 'th' | 'en' = 'th';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: InfoSearchService,
    private sanitizer: DomSanitizer,
    private masterService: PubilcService,
    private ls: LocaleSwitcherService,

  ) { }
  ngOnInit(): void {

    try { this.currentLocale = this.getLocale(); } catch { this.currentLocale = 'th'; }

    // ✅ เก็บ queryParams ทั้งชุด (ไว้ส่งกลับ)
    this.backQueryParams = { ...(this.route.snapshot.queryParams || {}) };
    this.backSrc = (this.backQueryParams?.src as any) || '';

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.error = 'ไม่พบรหัสโปรไฟล์'; return; }
    this.fetch(id);

  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  private fetch(id: number) {
    this.loading = true;
    this.sub = this.api.getProfileById(id).subscribe({
      next: (p) => {
        this.profile = p;
        this.prepareVideos(p);
        this.prepareAssets(p);

        // ✅ ใช้ตัวนี้แทน
        this.loadProfileMasters(p);

        this.loading = false;
      },
      error: () => {
        this.error = 'โหลดข้อมูลไม่สำเร็จ';
        this.loading = false;
      }
    });
  }

  private prepareVideos(p: Profile) {
    const e1 = toEmbedUrl(p.video1);
    const e2 = toEmbedUrl(p.video2);
    this.video1 = e1 ? this.sanitizer.bypassSecurityTrustResourceUrl(e1) : null;
    this.video2 = e2 ? this.sanitizer.bypassSecurityTrustResourceUrl(e2) : null;
  }

  private prepareAssets(p: Profile) {
    const r = toAbsolute((p as any).resumeUrl);
    if (r) {
      this.resumePreviewUrl = r;
      this.resumeIsPdf = r.toLowerCase().endsWith('.pdf');
      this.resumeSafeUrl = this.resumeIsPdf
        ? this.sanitizer.bypassSecurityTrustResourceUrl(r)
        : null;
    } else {
      this.resumePreviewUrl = null;
      this.resumeIsPdf = false;
      this.resumeSafeUrl = null;
    }

    this.performanceImages = ((p as any).performanceUrls || [])
      .map((x: string) => toAbsolute(x))
      .filter(Boolean) as string[];
  }

  private resolveName(item?: MasterItem | null, fallback: string = ''): string {
    if (!item) return fallback;

    // ✅ ใช้ pattern เดียวกับ HandleProfileComponent
    let lang = 'th';
    try {
      lang = this.ls.currentLocale();   // <-- แบบเดียวกับที่คุณใช้ใน HandleProfile
    } catch {
      lang = 'th';
    }

    const isTh = this.getLocale() === 'th';

    return isTh
      ? (item.nameTh || item.nameEn || fallback || `${item.id}`)
      : (item.nameEn || item.nameTh || fallback || `${item.id}`);
  }

  // ===== View helpers เดิม (avatar, cover, fullName, locationText, gallery, getStat) คงไว้ =====

  avatar(): string {
    return toAbsolute((this.profile as any)?.avatarUrl) || 'https://i.pravatar.cc/160?img=12';
  }

  cover(): string | null {
    return toAbsolute((this.profile as any)?.coverUrl);
  }

  fullName(): string {
    const p = this.profile as any;
    return [p?.firstName, p?.lastName].filter(Boolean).join(' ') || '—';
  }

  locationText(): string {
    return (this.profile as any)?.location || '—';
  }

  gallery(): string[] {
    return this.performanceImages;
  }

  // ✅ helper แปลง id -> ชื่อ (ตอนนี้ใช้ nameTh ถ้าอยากสลับ EN ก็เปลี่ยนตรงนี้ได้เลย)
  workLocationName(id: number): string {
    const item = this.workLocationMap.get(id);
    return this.resolveName(item, `#${id}`);
  }

  unionName(id: number): string {
    const item = this.unionMap.get(id);
    return this.resolveName(item, `#${id}`);
  }

  experienceName(id: number): string {
    const item = this.experienceMap.get(id);
    return this.resolveName(item, `#${id}`);
  }

  partnerName(id: number): string {
    const item = this.partnerMap.get(id);
    return this.resolveName(item, `#${id}`);
  }

  genderName(id: number): string {
    const item = this.genderMap.get(id);
    return this.resolveName(item, `#${id}`);
  }

  raceName(id: number): string {
    const item = this.raceMap.get(id);
    return this.resolveName(item, `#${id}`);
  }

  additionalName(id: number): string {
    const item = this.additionalMap.get(id);
    return this.resolveName(item, `#${id}`);
  }

  deptName(id: number): string {
    const item = this.deptMap.get(id);
    return this.resolveName(item, `#${id}`);
  }

  posName(id: number): string {
    const item = this.posMap.get(id);
    return this.resolveName(item, `#${id}`);
  }

  skillName(id: number): string {
    const item = this.skillMap.get(id);
    return this.resolveName(item, `#${id}`);
  }

  // ===== getStat เดิมคงไว้ =====
  getStat(key: 'orders'): number;
  getStat(key: 'rating'): number;
  getStat(key: 'startedYear'): number;
  getStat(key: StatKey): number {
    const p: any = this.profile;

    function toNumber(v: unknown, fallback = 0): number {
      const n =
        typeof v === 'number' ? v :
          typeof v === 'string' ? Number(v) :
            NaN;
      return Number.isFinite(n) ? n : fallback;
    }

    switch (key) {
      case 'orders':
        return toNumber(p?.orders ?? p?.stats?.orders);

      case 'rating':
        return toNumber(p?.rating ?? p?.stats?.rating);

      case 'startedYear': {
        const y1 = toNumber(p?.startedYear ?? p?.stats?.startedYear, NaN);
        if (Number.isFinite(y1)) return y1;

        const y2 =
          typeof p?.createdAt === 'string'
            ? parseInt(p.createdAt.slice(0, 4), 10)
            : NaN;
        return Number.isFinite(y2) ? y2 : 0;
      }
    }
  }

  private asItems(res: any): MasterItem[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    return Array.isArray(res.items) ? res.items : [];
  }

  private touchProfile() {
    // ช่วยกระตุ้นให้ UI re-render ในบางเคส
    this.profile = this.profile ? ({ ...this.profile } as any) : this.profile;
  }

  private loadProfileMasters(p: Profile) {
    const uniq = (arr?: number[]) => Array.from(new Set((arr ?? []).filter(x => typeof x === 'number')));

    // ===== profile groups =====
    const wlIds = new Set(uniq((p as any).workLocations));
    const unionIds = new Set(uniq((p as any).unions));
    const expIds = new Set(uniq((p as any).experience));
    const partnerIds = new Set(uniq((p as any).partners));
    const genderIds = new Set(uniq((p as any).genders));
    const raceIds = new Set(uniq((p as any).races));
    const addIds = new Set(uniq((p as any).additionals)); // personal-identity

    // ===== credits groups =====
    const deptIds = new Set<number>();
    const posIds = new Set<number>();
    const skillIds = new Set<number>();

    (p.credits ?? []).forEach(c => {
      (c.deptIds ?? []).forEach(id => deptIds.add(id));
      (c.posIds ?? []).forEach(id => posIds.add(id));
      (c.skillIds ?? []).forEach(id => skillIds.add(id));
    });

    // ----- WorkLocation -----
    this.masterService.getWorkLocaltion?.().subscribe({
      next: res => {
        this.asItems(res).forEach(it => { if (wlIds.has(it.id)) this.workLocationMap.set(it.id, it); });
        this.touchProfile();
      }
    });

    // ----- Partner -----
    this.masterService.getPartnerIdentity?.().subscribe({
      next: res => {
        this.asItems(res).forEach(it => { if (partnerIds.has(it.id)) this.partnerMap.set(it.id, it); });
        this.touchProfile();
      }
    });

    // ----- Experience -----
    this.masterService.getExperienceLevel?.().subscribe({
      next: res => {
        this.asItems(res).forEach(it => { if (expIds.has(it.id)) this.experienceMap.set(it.id, it); });
        this.touchProfile();
      }
    });

    // ----- Union -----
    this.masterService.getUnionMembership?.().subscribe({
      next: res => {
        this.asItems(res).forEach(it => { if (unionIds.has(it.id)) this.unionMap.set(it.id, it); });
        this.touchProfile();
      }
    });

    // ----- Gender -----
    this.masterService.getGenderIdentity?.().subscribe({
      next: res => {
        this.asItems(res).forEach(it => { if (genderIds.has(it.id)) this.genderMap.set(it.id, it); });
        this.touchProfile();
      }
    });

    // ----- Race -----
    this.masterService.getRacialIdentity?.().subscribe({
      next: res => {
        this.asItems(res).forEach(it => { if (raceIds.has(it.id)) this.raceMap.set(it.id, it); });
        this.touchProfile();
      }
    });

    // ----- Additional / PersonalIdentity -----
    this.masterService.getPersonalIdentity?.().subscribe({
      next: res => {
        this.asItems(res).forEach(it => { if (addIds.has(it.id)) this.additionalMap.set(it.id, it); });
        this.touchProfile();
      }
    });

    // ===== credits masters =====
    this.masterService.getDepartment?.().subscribe({
      next: res => {
        this.asItems(res).forEach(it => { if (deptIds.has(it.id)) this.deptMap.set(it.id, it); });
        this.touchProfile();
      }
    });

    this.masterService.getPosition?.().subscribe({
      next: res => {
        this.asItems(res).forEach(it => { if (posIds.has(it.id)) this.posMap.set(it.id, it); });
        this.touchProfile();
      }
    });

    this.masterService.getSkills?.().subscribe({
      next: res => {
        this.asItems(res).forEach(it => { if (skillIds.has(it.id)) this.skillMap.set(it.id, it); });
        this.touchProfile();
      }
    });
  }

  // สมมติ id พิเศษ
  private readonly OTHER_ID = 999;
  private readonly STUDENT_ACADEMIC_ID = 998; // เฉพาะ unions ตาม payload ตัวอย่าง

  private otherText(val?: string | null): string | null {
    const t = (val ?? '').trim();
    return t ? t : null;
  }

  // ====== Labels ที่รองรับ Other ======

  unionLabel(id: number): string {
    // 999 = Other -> ใช้ unionOtherText
    if (id === this.OTHER_ID) {
      return this.otherText((this.profile as any)?.unionOtherText)
        ? `Other: ${(this.profile as any).unionOtherText}`
        : 'Other';
    }

    // 998 = Student/Academic (จาก payload ของคุณ) -> ใช้ unionStudentAcademicText
    if (id === this.STUDENT_ACADEMIC_ID) {
      return this.otherText((this.profile as any)?.unionStudentAcademicText)
        ? `Student/Academic: ${(this.profile as any).unionStudentAcademicText}`
        : 'Student/Academic';
    }

    return this.unionName(id);
  }

  experienceLabel(id: number): string {
    if (id === this.OTHER_ID) {
      return this.otherText((this.profile as any)?.experienceOtherText)
        ? `Other: ${(this.profile as any).experienceOtherText}`
        : 'Other';
    }
    return this.experienceName(id);
  }

  partnerLabel(id: number): string {
    if (id === this.OTHER_ID) {
      return this.otherText((this.profile as any)?.partnerOtherText)
        ? `Other: ${(this.profile as any).partnerOtherText}`
        : 'Other';
    }
    return this.partnerName(id);
  }

  genderLabel(id: number): string {
    // ถ้า 999 = Prefer to self-describe -> ใช้ genderSelfDescribeText
    if (id === this.OTHER_ID) {
      return this.otherText((this.profile as any)?.genderSelfDescribeText)
        ? `Self-describe: ${(this.profile as any).genderSelfDescribeText}`
        : 'Prefer to self-describe';
    }
    return this.genderName(id);
  }

  raceLabel(id: number): string {
    if (id === this.OTHER_ID) {
      return this.otherText((this.profile as any)?.racialIdentityOtherText)
        ? `Other: ${(this.profile as any).racialIdentityOtherText}`
        : 'Other';
    }
    return this.raceName(id);
  }

  private getLocale(): 'th' | 'en' {
    try {
      const v: any = (this.ls as any);
      const lang = typeof v.currentLocale === 'function'
        ? v.currentLocale()
        : v.currentLocale;
      return (lang === 'en') ? 'en' : 'th';
    } catch {
      return 'th';
    }
  }

  private getLangPrefix(): string | null {
    const segments = this.router.url.split('/').filter(Boolean);
    const supported = ['th', 'en'];
    return supported.includes(segments[0]) ? segments[0] : null;
  }

  goBack() {
    const lang = this.getLangPrefix();
    const base = lang ? ['/', lang] : ['/'];

    this.router.navigate([...base, 'member', 'skills'], {
      queryParams: { ...(this.backQueryParams || {}) },
    });
  }
}