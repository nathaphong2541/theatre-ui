import { Component, OnDestroy, OnInit } from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
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

  private currentLocale: 'th' | 'en' = 'th';

  constructor(
    private route: ActivatedRoute,
    private api: InfoSearchService,
    private sanitizer: DomSanitizer,
    private masterService: PubilcService,
    private ls: LocaleSwitcherService,

  ) { }
  ngOnInit(): void {

    try {
      // ถ้า service ของคุณมี currentLocale เป็น string เช่น 'th'|'en'
      this.currentLocale = (this.ls as any).currentLocale ?? 'th';

      // หรือถ้าใช้ method:
      // this.currentLocale = this.ls.getCurrentLocale() ?? 'th';
    } catch {
      this.currentLocale = 'th';
    }

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

        // ✅ โหลดชื่อ master ต่าง ๆ ตาม id ใน profile
        this.loadMasterNames(p);

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

  // ✅ ดึงชื่อ master ตาม id ใน profile + credits
  private loadMasterNames(p: Profile) {
    const uniq = (arr?: number[]) => Array.from(new Set(arr || []));

    // ---- จาก profile ----
    const workLocationIds = uniq((p as any).workLocations);
    const unionIds = uniq((p as any).unions);
    const experienceIds = uniq((p as any).experience);
    const partnerIds = uniq((p as any).partners);
    const genderIds = uniq((p as any).genders);
    const raceIds = uniq((p as any).races);
    const additionalIds = uniq((p as any).additionals); // สมมติ = personal-identities

    // ---- จาก credits ----
    const allDeptIds: number[] = [];
    const allPosIds: number[] = [];
    const allSkillIds: number[] = [];

    (p.credits || []).forEach(c => {
      allDeptIds.push(...(c.deptIds || []));
      allPosIds.push(...(c.posIds || []));
      allSkillIds.push(...(c.skillIds || []));
    });

    const deptIds = uniq(allDeptIds);
    const posIds = uniq(allPosIds);
    const skillIds = uniq(allSkillIds);

    // ยิง getById เป็นรายตัวแบบง่าย ๆ (จำนวน id ไม่เยอะ)
    workLocationIds.forEach(id => {
      this.masterService.getWorkLocationById(id).subscribe(item => {
        this.workLocationMap.set(item.id, item);
      });
    });

    unionIds.forEach(id => {
      this.masterService.getUnionMembershipById(id).subscribe(item => {
        this.unionMap.set(item.id, item);
      });
    });

    experienceIds.forEach(id => {
      this.masterService.getExperienceLevelById(id).subscribe(item => {
        this.experienceMap.set(item.id, item);
      });
    });

    partnerIds.forEach(id => {
      this.masterService.getPartnerIdentityById(id).subscribe(item => {
        this.partnerMap.set(item.id, item);
      });
    });

    genderIds.forEach(id => {
      this.masterService.getGenderIdentityById(id).subscribe(item => {
        this.genderMap.set(item.id, item);
      });
    });

    raceIds.forEach(id => {
      this.masterService.getRacialIdentityById(id).subscribe(item => {
        this.raceMap.set(item.id, item);
      });
    });

    additionalIds.forEach(id => {
      this.masterService.getPersonalIdentityById(id).subscribe(item => {
        this.additionalMap.set(item.id, item);
      });
    });

    deptIds.forEach(id => {
      this.masterService.getDepartmentById(id).subscribe(item => {
        this.deptMap.set(item.id, item);
      });
    });

    posIds.forEach(id => {
      this.masterService.getPositionById(id).subscribe(item => {
        this.posMap.set(item.id, item);
      });
    });

    skillIds.forEach(id => {
      this.masterService.getSkillById(id).subscribe(item => {
        this.skillMap.set(item.id, item);
      });
    });
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

    const isTh = lang === 'th';

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
}