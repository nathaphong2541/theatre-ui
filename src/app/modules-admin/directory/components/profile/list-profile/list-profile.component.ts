import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { VideoGalleryComponent } from '../video-gallery/video-gallery.component';
import { Router } from '@angular/router';
import { ProfileService } from '../../../service/profile.service';
import { environment } from 'src/environments/environment';
import { MasterItem, PubilcService } from 'src/app/shared/service/public/pubilc.service';
import { LocaleSwitcherService } from 'src/locale/locale-switcher.service';

type Tag = { label: string; icon?: string };
type Link = { type: 'email' | 'phone' | 'link'; label: string; value: string; href: string; icon: string };

type Credit = {
  company: string;
  title: string;
  startYear: string;
  endYear: string;
  current: boolean;
  venue: string;
  jobLocation: string;
  internship: boolean;
  fellowship: boolean;
  deptIds: number[];
  posIds: number[];
  skillIds: number[];
};

export type ProfileDto = {
  id: number;
  userId: number;
  privateProfile: boolean;
  profileIsCompany: boolean;
  firstName: string;
  lastName: string;
  pronouns: string;
  title: string;
  location: string;
  email: string;
  phone: string;
  website: string;
  linkedin: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  multiLang: boolean;
  travel: boolean;
  tour: boolean;
  about: string;
  education: string;
  video1: string | null;
  video2: string | null;
  workLocations: number[];
  unions: number[];
  experience: number[];
  partners: number[];
  genders: number[];
  races: number[];
  additionals: number[];
  credits: Credit[];
  avatarUrl?: string | null;
  coverUrl?: string | null;
  resumeUrl?: string | null;
  performanceUrls?: string[] | null;
};

@Component({
  selector: '[list-profile]',
  standalone: true,
  imports: [CommonModule, AngularSvgIconModule, VideoGalleryComponent],
  templateUrl: './list-profile.component.html',
  styleUrl: './list-profile.component.css'
})
export class ListProfileComponent implements OnInit {
  // Cover/Avatar
  coverUrl = signal<string>('assets/images/profile-cover.jpg');
  avatarUrl = signal<string | null>(null);
  videoSources = signal<string[]>([]);

  // Texts
  displayName = signal<string>('');
  headline = signal<string>('');
  location = signal<string>('');
  about = signal<string>('');
  education = signal<string>('');
  pronouns = signal<string>('');

  profileIsCompany = signal<boolean>(false);
  isPrivateProfile = signal<boolean>(false);

  // UI badges/links
  tags = signal<Tag[]>([]);
  links = signal<Link[]>([]);

  profile: any | null = null;

  // resume + performance
  resumeUrlAbs = signal<string | null>(null);
  resumeIsImage = signal<boolean>(false);
  resumeIsPdf = signal<boolean>(false);
  performanceUrls = signal<string[]>([]);

  // credits
  credits = signal<Credit[]>([]);

  // stats
  creditsCount = computed(() => this.credits().length);
  mediaCount = computed(
    () => this.videoSources().length + this.performanceUrls().length
  );

  // control
  userId: number | null = null;
  isEditing = signal<boolean>(false);
  isLoading = signal<boolean>(true);
  isError = signal<boolean>(false);

  hasAvatar = computed(() => !!this.avatarUrl());

  private deptMap = new Map<number, MasterItem>();
  private posMap = new Map<number, MasterItem>();
  private skillMap = new Map<number, MasterItem>();

  private workLocationMap = new Map<number, MasterItem>();
  private partnerMap = new Map<number, MasterItem>();
  private experienceMap = new Map<number, MasterItem>();
  private unionMap = new Map<number, MasterItem>();
  private genderMap = new Map<number, MasterItem>();
  private raceMap = new Map<number, MasterItem>();
  private additionalMap = new Map<number, MasterItem>();

  workLocationLabels = signal<string[]>([]);
  partnerLabels = signal<string[]>([]);
  experienceLabels = signal<string[]>([]);
  unionLabels = signal<string[]>([]);
  genderLabels = signal<string[]>([]);
  raceLabels = signal<string[]>([]);
  additionalLabels = signal<string[]>([]);


  constructor(
    private router: Router,
    private profileService: ProfileService,
    private publicService: PubilcService,        // ✅ เพิ่ม
    private ls: LocaleSwitcherService,          // ✅ เพิ่ม
  ) { }


  private getLangPrefix(): string | null {
    const path = this.router.url.split('?')[0].split('#')[0];
    const segments = path.split('/').filter(Boolean); // ตัด '' ออก
    return segments.length > 0 ? segments[0] : null;
  }

  // เลือกชื่อ th/en ตาม locale ปัจจุบัน
  private pickLabel(item?: MasterItem | null, fallback: string = ''): string {
    if (!item) return fallback;

    let lang = 'th';
    try {
      lang = this.ls.currentLocale();           // เหมือนที่ใช้ใน HandleProfileComponent
    } catch {
      lang = 'th';
    }

    const isTh = lang === 'th';

    return isTh
      ? (item.nameTh || item.nameEn || fallback || `${item.id}`)
      : (item.nameEn || item.nameTh || fallback || `${item.id}`);
  }

  // helper แปลง Credit → ชื่อจริง
  deptNames(c: Credit): string[] {
    return (c.deptIds || [])
      .map(id => this.deptMap.get(id))
      .filter((x): x is MasterItem => !!x)
      .map(x => this.pickLabel(x));
  }

  posNames(c: Credit): string[] {
    return (c.posIds || [])
      .map(id => this.posMap.get(id))
      .filter((x): x is MasterItem => !!x)
      .map(x => this.pickLabel(x));
  }

  skillNames(c: Credit): string[] {
    return (c.skillIds || [])
      .map(id => this.skillMap.get(id))
      .filter((x): x is MasterItem => !!x)
      .map(x => this.pickLabel(x));
  }

  ngOnInit() {

    this.isLoading.set(true);

    this.profileService.getProfile().subscribe({
      next: (p: ProfileDto | any) => {
        this.profile = p;   // ✅ สำคัญมาก เพื่อให้ *ngIf="profile?.facebook" ใช้ได้
        this.loadProfileMasters(this.profile);
        this.setProfileLabelGroups(this.profile);

        const first = (p?.firstName ?? '').trim();
        const last = (p?.lastName ?? '').trim();

        const credits = Array.isArray(p?.credits) ? p.credits : [];
        this.credits.set(credits);

        // ✅ โหลด master data สำหรับ credits (dept/pos/skill)
        this.loadCreditMasters(credits);

        // basic text
        this.displayName.set([first, last].filter(Boolean).join(' '));
        this.headline.set(p?.title || '');
        this.location.set(p?.location || '');
        this.about.set(p?.about || '');
        this.education.set(p?.education || '');
        this.pronouns.set(p?.pronouns || '');
        this.profileIsCompany.set(!!p?.profileIsCompany);
        this.isPrivateProfile.set(!!p?.privateProfile);
        this.userId = p?.userId ?? null;

        // avatar / cover
        this.avatarUrl.set(this.toAbsolute(p?.avatarUrl) || null);
        if (p?.coverUrl) {
          this.coverUrl.set(this.toAbsolute(p.coverUrl)!);
        }

        // resume
        const rAbs = this.toAbsolute(p?.resumeUrl) || null;
        this.resumeUrlAbs.set(rAbs);
        if (rAbs) {
          this.resumeIsImage.set(this.isImage(rAbs));
          this.resumeIsPdf.set(this.isPdf(rAbs));
        } else {
          this.resumeIsImage.set(false);
          this.resumeIsPdf.set(false);
        }

        // performance images
        const perf = Array.isArray(p?.performanceUrls) ? p.performanceUrls : [];
        this.performanceUrls.set(
          perf
            .map((u: string) => this.toAbsolute(u))
            .filter((u: string | null): u is string => !!u)
        );

        // tags
        const tags: Tag[] = [];
        if (p?.multiLang) {
          tags.push({
            label: 'Multi-Language',
            icon: 'assets/icons/heroicons/outline/globe-alt.svg',
          });
        }
        if (p?.travel) {
          tags.push({
            label: 'Will Travel',
            icon: 'assets/icons/heroicons/outline/map-pin.svg',
          });
        }
        if (p?.tour) {
          tags.push({
            label: 'Will Tour',
            icon: 'assets/icons/heroicons/outline/video-camera.svg',
          });
        }
        if (p?.privateProfile) {
          tags.push({
            label: 'Private',
            icon: 'assets/icons/heroicons/outline/lock-closed.svg',
          });
        }
        if (p?.profileIsCompany) {
          tags.push({
            label: 'Company Profile',
            icon: 'assets/icons/heroicons/outline/building-office.svg',
          });
        }
        this.tags.set(tags);

        // contact links
        const links: Link[] = [];

        if (p?.email) {
          links.push({
            type: 'email',
            label: 'Email',
            value: p.email,
            href: `mailto:${p.email}`,
            icon: 'assets/icons/heroicons/outline/envelope.svg',
          });
        }

        if (p?.phone) {
          const tel = String(p.phone).replace(/\s|-/g, '');
          links.push({
            type: 'phone',
            label: 'Phone',
            value: p.phone,
            href: `tel:${tel}`,
            icon: 'assets/icons/heroicons/outline/phone.svg',
          });
        }

        if (p?.website) {
          links.push({
            type: 'link',
            label: 'Website',
            value: this.normalizeUrl(p.website),  // หรือจะแสดงเต็มก็ได้
            href: this.normalizeUrl(p.website),
            icon: 'assets/icons/heroicons/outline/link.svg',
          });
        }

        // ⭐⭐ ตรงนี้คือส่วนที่ปรับ ⭐⭐
        if (p?.linkedin) {
          links.push({
            type: 'link',
            label: 'LinkedIn',
            value: this.socialHandle('linkedin', p.linkedin),   // << แสดงเฉพาะ slug
            href: this.socialUrl('linkedin', p.linkedin),       // << ยังลิงก์ถูกเหมือนเดิม
            icon: 'assets/icons/social/linkedin.svg',
          });
        }

        if (p?.facebook) {
          links.push({
            type: 'link',
            label: 'Facebook',
            value: this.socialHandle('facebook', p.facebook),
            href: this.socialUrl('facebook', p.facebook),
            icon: 'assets/icons/social/facebook.svg',
          });
        }

        if (p?.instagram) {
          links.push({
            type: 'link',
            label: 'Instagram',
            value: this.socialHandle('instagram', p.instagram),
            href: this.socialUrl('instagram', p.instagram),
            icon: 'assets/icons/social/instagram.svg',
          });
        }

        if (p?.twitter) {
          links.push({
            type: 'link',
            label: 'Twitter / X',
            value: this.socialHandle('twitter', p.twitter),
            href: this.socialUrl('twitter', p.twitter),
            icon: 'assets/icons/social/twitter.svg',
          });
        }

        this.links.set(links);

        // videos
        this.videoSources.set(
          [p?.video1, p?.video2].filter(
            (x): x is string => !!x && x.toString().trim().length > 0
          )
        );

        // credits
        this.credits.set(Array.isArray(p?.credits) ? p.credits : []);

        this.isLoading.set(false);
        this.isError.set(false);
      },
      error: (err) => {
        console.error('getProfile failed', err);
        this.displayName.set('—');
        this.headline.set('');
        this.location.set('');
        this.about.set('');
        this.education.set('');
        this.tags.set([]);
        this.links.set([]);
        this.resumeUrlAbs.set(null);
        this.performanceUrls.set([]);
        this.credits.set([]);
        this.isLoading.set(false);
        this.isError.set(true);
      },
    });
  }

  private buildLabels(
    ids: number[] | null | undefined,
    map: Map<number, MasterItem>,
    opts?: {
      otherId?: number;          // default 999
      otherText?: string;        // ข้อความ other
      otherPrefix?: string;      // เช่น 'Other'
      attachToId?: number;       // เช่น 998
      attachText?: string;       // ข้อความของ 998
      attachFormat?: (base: string, text: string) => string; // รูปแบบการแนบ
    }
  ): string[] {
    const list = (ids ?? []).filter((x) => typeof x === 'number');

    const otherId = opts?.otherId ?? 999;
    const otherText = (opts?.otherText ?? '').trim();
    const otherPrefix = (opts?.otherPrefix ?? 'Other').trim();

    const attachToId = opts?.attachToId;
    const attachText = (opts?.attachText ?? '').trim();

    const labels: string[] = [];

    for (const id of list) {
      const item = map.get(id);
      const base = this.pickLabel(item, `${id}`);

      // 1) Other: โชว์ "Other: <text>"
      if (id === otherId) {
        if (otherText) labels.push(`${otherPrefix}: ${otherText}`);
        else labels.push(otherPrefix);
        continue;
      }

      // 2) เคสต้องแนบ text ให้ id เฉพาะ (เช่น Student/Academic)
      if (attachToId != null && id === attachToId && attachText) {
        const fmt = opts?.attachFormat ?? ((b, t) => `${b}: ${t}`);
        labels.push(fmt(base, attachText));
        continue;
      }

      // 3) ปกติ
      labels.push(base);
    }

    // กันซ้ำ
    return Array.from(new Set(labels)).filter(Boolean);
  }

  private loadProfileMasters(p: ProfileDto | any): void {
    const wlIds = new Set<number>(p?.workLocations ?? []);
    const partnerIds = new Set<number>(p?.partners ?? []);
    const expIds = new Set<number>(p?.experience ?? []);
    const unionIds = new Set<number>(p?.unions ?? []);
    const genderIds = new Set<number>(p?.genders ?? []);
    const raceIds = new Set<number>(p?.races ?? []);
    const addIds = new Set<number>(p?.additionals ?? []);

    // ⚠️ ด้านล่างนี้ “ชื่อเมธอด” ขึ้นกับ service ของคุณ
    // ถ้าของคุณชื่อไม่ตรง ให้เปลี่ยนเป็น endpoint ที่มีจริง

    this.publicService.getWorkLocaltion?.().subscribe({
      next: (res: any) => {
        const items: MasterItem[] = res?.items ?? res ?? [];
        items.forEach(i => { if (wlIds.has(i.id)) this.workLocationMap.set(i.id, i); });
        this.setProfileLabelGroups(p); // โหลดเสร็จแล้วค่อย refresh labels
      },
    });

    this.publicService.getPartnerIdentity?.().subscribe({
      next: (res: any) => {
        const items: MasterItem[] = res?.items ?? res ?? [];
        items.forEach(i => { if (partnerIds.has(i.id)) this.partnerMap.set(i.id, i); });
        this.setProfileLabelGroups(p);
      },
    });

    this.publicService.getExperienceLevel?.().subscribe({
      next: (res: any) => {
        const items: MasterItem[] = res?.items ?? res ?? [];
        items.forEach(i => { if (expIds.has(i.id)) this.experienceMap.set(i.id, i); });
        this.setProfileLabelGroups(p);
      },
    });

    this.publicService.getUnionMembership?.().subscribe({
      next: (res: any) => {
        const items: MasterItem[] = res?.items ?? res ?? [];
        items.forEach(i => { if (unionIds.has(i.id)) this.unionMap.set(i.id, i); });
        this.setProfileLabelGroups(p);
      },
    });

    this.publicService.getGenderIdentity?.().subscribe({
      next: (res: any) => {
        const items: MasterItem[] = res?.items ?? res ?? [];
        items.forEach(i => { if (genderIds.has(i.id)) this.genderMap.set(i.id, i); });
        this.setProfileLabelGroups(p);
      },
    });

    this.publicService.getRacialIdentity?.().subscribe({
      next: (res: any) => {
        const items: MasterItem[] = res?.items ?? res ?? [];
        items.forEach(i => { if (raceIds.has(i.id)) this.raceMap.set(i.id, i); });
        this.setProfileLabelGroups(p);
      },
    });

    // this.publicService.getAdditionals?.().subscribe({
    //   next: (res: any) => {
    //     const items: MasterItem[] = res?.items ?? res ?? [];
    //     items.forEach(i => { if (addIds.has(i.id)) this.additionalMap.set(i.id, i); });
    //     this.setProfileLabelGroups(p);
    //   },
    // });
  }

  private setProfileLabelGroups(p: ProfileDto | any): void {
    this.workLocationLabels.set(
      this.buildLabels(p?.workLocations, this.workLocationMap)
    );

    this.partnerLabels.set(
      this.buildLabels(p?.partners, this.partnerMap, {
        otherId: 999,
        otherPrefix: 'Other',
        otherText: p?.partnerOtherText,
      })
    );

    this.experienceLabels.set(
      this.buildLabels(p?.experience, this.experienceMap, {
        otherId: 999,
        otherPrefix: 'Other',
        otherText: p?.experienceOtherText,
      })
    );

    this.unionLabels.set(
      this.buildLabels(p?.unions, this.unionMap, {
        otherId: 999,
        otherPrefix: 'Other',
        otherText: p?.unionOtherText,
        attachToId: 998, // Student/Academic
        attachText: p?.unionStudentAcademicText,
        attachFormat: (base, text) => `${base}: ${text}`,
      })
    );

    this.genderLabels.set(
      this.buildLabels(p?.genders, this.genderMap, {
        otherId: 999, // Prefer to self-describe
        otherPrefix: 'Self-described',
        otherText: p?.genderSelfDescribeText,
      })
    );

    this.raceLabels.set(
      this.buildLabels(p?.races, this.raceMap, {
        otherId: 999,
        otherPrefix: 'Other',
        otherText: p?.racialIdentityOtherText,
      })
    );

    this.additionalLabels.set(
      this.buildLabels(p?.additionals, this.additionalMap)
    );
  }

  private loadCreditMasters(credits: Credit[]): void {
    if (!credits || !credits.length) return;

    const deptIds = new Set<number>();
    const posIds = new Set<number>();
    const skillIds = new Set<number>();

    credits.forEach(c => {
      (c.deptIds || []).forEach(id => deptIds.add(id));
      (c.posIds || []).forEach(id => posIds.add(id));
      (c.skillIds || []).forEach(id => skillIds.add(id));
    });

    // ถ้าไม่มี id อะไรเลยก็ไม่ต้องโหลด
    if (!deptIds.size && !posIds.size && !skillIds.size) return;

    // 🟢 โหลด department ทั้งหมดแล้วเก็บเฉพาะที่ใช้
    this.publicService.getDepartment().subscribe({
      next: res => {
        const items: MasterItem[] = res?.items ?? [];
        items.forEach(item => {
          if (deptIds.has(item.id)) this.deptMap.set(item.id, item);
        });
      },
      error: err => console.error('load departments failed', err),
    });

    // 🟢 โหลด position ทั้งหมดแล้วเก็บเฉพาะที่ใช้
    this.publicService.getPosition().subscribe({
      next: res => {
        const items: MasterItem[] = res?.items ?? [];
        items.forEach(item => {
          if (posIds.has(item.id)) this.posMap.set(item.id, item);
        });
      },
      error: err => console.error('load positions failed', err),
    });

    // 🟢 โหลด skills (อาจเป็น array ตรงๆ หรือมี items)
    this.publicService.getSkills().subscribe({
      next: res => {
        const items: MasterItem[] = Array.isArray(res) ? res : (res?.items ?? []);
        items.forEach(item => {
          if (skillIds.has(item.id)) this.skillMap.set(item.id, item);
        });
      },
      error: err => console.error('load skills failed', err),
    });
  }

  socialUrl(
    platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin',
    raw: string
  ): string {
    const trimmed = (raw || '').trim();
    if (!trimmed) return '#';

    // ถ้าเป็น url อยู่แล้ว
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    switch (platform) {
      case 'facebook':
        if (/^facebook\.com/i.test(trimmed)) {
          return 'https://' + trimmed;
        }
        return `https://www.facebook.com/${trimmed}`;
      case 'instagram':
        if (/^instagram\.com/i.test(trimmed)) {
          return 'https://' + trimmed;
        }
        return `https://www.instagram.com/${trimmed}`;
      case 'twitter':
        if (/^(x\.com|twitter\.com)/i.test(trimmed)) {
          return 'https://' + trimmed;
        }
        return `https://x.com/${trimmed}`;
      case 'linkedin':
        if (/^linkedin\.com/i.test(trimmed)) {
          return 'https://' + trimmed;
        }
        return `https://www.linkedin.com/in/${trimmed}`;
      default:
        return this.normalizeUrl(trimmed);
    }
  }

  /** ตัดเอาเฉพาะ handle/slug ไว้แสดง */
  socialHandle(
    platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin',
    raw: string
  ): string {
    const trimmed = (raw || '').trim();
    if (!trimmed) return '';

    // ถ้า user ใส่แค่ username เช่น "nathaphong.i" ก็คืนเลย
    if (!/^https?:\/\//i.test(trimmed) && !trimmed.includes('.com/')) {
      return trimmed;
    }

    // ตัด protocol + query/hash ออก
    let s = trimmed.replace(/^https?:\/\//i, '');
    s = s.split(/[?#]/)[0];

    // split เป็น segment
    const parts = s.split('/').filter(Boolean);
    if (!parts.length) return trimmed;

    switch (platform) {
      case 'linkedin': {
        // รูปแบบปกติ: linkedin.com/in/<slug>
        const inIdx = parts.indexOf('in');
        if (inIdx !== -1 && inIdx < parts.length - 1) {
          return parts[inIdx + 1];
        }
        return parts[parts.length - 1];
      }
      case 'facebook':
      case 'instagram':
      case 'twitter':
      default:
        // ส่วนใหญ่ handle จะเป็น segment สุดท้าย
        return parts[parts.length - 1];
    }
  }

  toAbsolute(url?: string | null): string | null {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    const apiBase = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${apiBase}${url.startsWith('/') ? url : '/' + url}`;
  }

  normalizeUrl(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return '#';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return 'https://' + trimmed;
  }

  private getExt(url: string): string {
    const path = url.split('?')[0].split('#')[0];
    const idx = path.lastIndexOf('.');
    if (idx === -1) return '';
    return path.substring(idx + 1).toLowerCase();
  }

  isImage(url: string): boolean {
    const ext = this.getExt(url);
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
  }

  isPdf(url: string): boolean {
    return this.getExt(url) === 'pdf';
  }

  getFileName(url: string): string {
    const clean = url.split('?')[0].split('#')[0];
    const parts = clean.split('/');
    return parts[parts.length - 1] || clean;
  }

  onUploadAvatar(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => this.avatarUrl.set(reader.result as string);
    reader.readAsDataURL(f);
  }

  editProfile() {
    const lang = this.getLangPrefix(); // เช่น 'en' หรือ 'th'
    const base: any[] = [];

    if (lang) {
      base.push('/', lang, 'directory');
    } else {
      // fallback กรณีไม่มี lang ใน url
      base.push('/directory');
    }

    if (!this.userId) {
      this.router.navigate([...base, 'profile-new']);
    } else {
      this.router.navigate([...base, 'profile', this.userId]);
    }
  }
}
