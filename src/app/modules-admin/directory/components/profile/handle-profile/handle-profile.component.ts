import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, HostListener, OnInit, signal, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { ProfileService } from '../../../service/profile.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { PubilcService } from 'src/app/shared/service/public/pubilc.service';
import { finalize, forkJoin, of, switchMap, tap } from 'rxjs';
import { LocaleSwitcherService } from 'src/locale/locale-switcher.service';
import { TranslateModule } from '@ngx-translate/core';

type Labeled = { label: string; value: number };

export type ProfileCredit = {
  company: string;
  title: string;
  startYear: string;
  endYear?: string | null;
  current: boolean;
  venue: string;
  jobLocation: string;
  internship: boolean;
  fellowship: boolean;

  deptIds: number[];
  deptText?: string | null;   // ✅ เพิ่ม
  posIds: number[];
  posText?: string | null;    // ✅ เพิ่ม
  skillIds: number[];
};

export type ProfilePerformanceItem = {
  id: number;
  url: string;
  sortOrder?: number | null;
};

export type ProfileDto = {
  id: number;
  userId: number;
  privateProfile: boolean;
  profileIsCompany: boolean;
  firstName: string;
  lastName: string;
  pronouns: string;
  title: number[];
  location: string;
  email: string;
  phone: string;
  website: string;
  linkedin: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  multiLang: boolean;
  additionalLanguages?: string[];
  travel: boolean;
  tour: boolean;
  about: string;
  education: string;
  video1: string;
  video2: string;
  workLocations: number[];
  unions: number[];
  experience: number[];
  partners: number[];
  genders: number[];
  races: number[];
  additionals: number[];
  credits: ProfileCredit[];
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
  resumeUrl?: string;
  performanceUrls?: string[];
  performanceItems?: ProfilePerformanceItem[]; // ✅ เพิ่ม
};

export type ProfilePayload = {
  id?: number;
  userId?: number;

  privateProfile: boolean;
  profileIsCompany: boolean;
  firstName: string;
  lastName: string;
  pronouns?: string;
  title: number[];
  titleOtherText?: string;
  wtitleOtherText?: string;
  location?: string;
  email?: string;
  phone?: string;
  website?: string;

  linkedin?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;

  multiLang: boolean;
  additionalLanguages?: string[];
  travel: boolean;
  tour: boolean;

  about?: string;
  education?: string;

  video1?: string;
  video2?: string;

  workLocations: number[];
  workLocationsOtherText?: string;
  partners: number[];
  partnerDetailById: Record<number, string>;
  partnerOtherText?: string;

  experience: number[];
  experienceOtherText?: string;

  unions: number[];
  unionOtherText?: string;
  unionStudentAcademicText?: string;

  genders: number[];
  genderSelfDescribeText?: string;

  races: number[];
  racialIdentityOtherText?: string;

  additionals: number[];
  credits: ProfileCredit[];
};


type DdKey = 'work' | 'unions' | 'exp' | 'partners' | 'genders' | 'races' | 'professions' | 'additional';

@Component({
  selector: 'app-handle-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule],
  templateUrl: './handle-profile.component.html',
  styleUrl: './handle-profile.component.css'
})
export class HandleProfileComponent implements OnInit {

  // ==== Avatar ====
  avatarFile: File | null = null;
  avatarPreviewUrl: string | null = null;
  private serverAvatarUrl: string | null = null;

  // ==== Resume ====
  resumeFile: File | null = null;
  resumePreviewUrl: string | null = null;
  resumeSafeUrl: SafeResourceUrl | null = null;
  resumeIsPdf = false;

  // ==== Performance images ====
  images: (File | null)[] = Array(6).fill(null);
  imagePreviewUrls: (string | null)[] = Array(6).fill(null);
  performanceKinds: ('image' | 'pdf' | 'other' | null)[] = Array(6).fill(null);

  get avatarSrc(): string | null {
    return this.avatarPreviewUrl ?? this.serverAvatarUrl ?? null;
  }

  // master data
  workLocations: Labeled[] = [];
  unions: Labeled[] = [];
  experienceLevels: Labeled[] = [];
  partnerDirectories: Labeled[] = [];
  genders: Labeled[] = [];
  professions: Labeled[] = [];
  races: Labeled[] = [];
  additionals: Labeled[] = [
    { label: $localize`:@@profile_additional_disabled:Disabled`, value: 1 },
    { label: $localize`:@@profile_additional_lgbtqia:LGBTQIA+`, value: 2 },
    { label: $localize`:@@profile_additional_neurodiverse:Neurodiverse`, value: 3 },
  ];

  // master ทั้งหมด
  departmentsApi: any[] = [];
  positionsApi: any[] = [];
  skillsApi: any[] = [];

  // ตัวกรองตามที่เลือก
  filteredPositions: any[] = [];
  filteredSkills: any[] = [];

  // map เผื่อใช้หา label ทีหลัง
  deptById = new Map<number, any>();
  posById = new Map<number, any>();
  skillById = new Map<number, any>();

  constructor(
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private profileService: ProfileService,
    private toast: ToastService,
    private router: Router,
    private publicService: PubilcService,
    private ls: LocaleSwitcherService,
  ) {

    // เมื่อเปลี่ยน Department → filter Positions
    // ✅ ใหม่: เลือก Department แล้วไปดึง Position จาก backend
    this.creditForm.get('deptId')!.valueChanges.subscribe(deptId => {
      if (!deptId) {
        this.filteredPositions = [];
        this.filteredSkills = [];
        this.creditForm.patchValue({ posId: null, skillIds: [] }, { emitEvent: false });
        return;
      }

      // ✅ ไปโหลดตำแหน่งตาม departmentId
      this.loadPositionsByDepartment(deptId);
    });


    // เมื่อเปลี่ยน Position → filter Skills
    this.creditForm.get('posId')!.valueChanges.subscribe(posId => {
      if (!posId) {
        this.filteredSkills = [];
        this.creditForm.patchValue({ skillIds: [] }, { emitEvent: false });
        return;
      }

      // ใช้ positionId จาก API
      this.filteredSkills = this.skillsApi.filter((s: any) => s.positionId === posId);

      this.creditForm.patchValue({ skillIds: [] }, { emitEvent: false });
    });
  }

  public pickLabel(x: { nameTh?: string; nameEn?: string }): string {
    const lang = this.ls.currentLocale();
    const isTh = lang === 'th';
    return isTh
      ? (x.nameTh || x.nameEn || '')
      : (x.nameEn || x.nameTh || '');
  }

  public async refreshCreditPositions() {
    await this.reloadPositionsForSelectedDepts();
  }

  private async loadMaster(): Promise<void> {
    await Promise.all([
      new Promise<void>(resolve => {
        this.publicService.getDepartment().subscribe(res => {
          this.departmentsApi = res?.items ?? [];

          this.deptById.clear();
          this.departmentsApi.forEach((d: any) => this.deptById.set(d.id, d));

          resolve();
        }, _ => resolve());
      }),
      new Promise<void>(resolve => {
        this.publicService.getPosition().subscribe(res => {
          this.positionsApi = res?.items ?? [];

          this.posById.clear();
          this.positionsApi.forEach((p: any) => this.posById.set(p.id, p));

          resolve();
        }, _ => resolve());
      }),
      new Promise<void>(resolve => {
        this.publicService.getSkills().subscribe(res => {
          this.skillsApi = Array.isArray(res) ? res : (res?.items ?? []);

          this.skillById.clear();
          this.skillsApi.forEach((s: any) => this.skillById.set(s.id, s));

          resolve();
        }, _ => resolve());
      }),
    ]);

    this.filteredPositions = [];
    this.filteredSkills = [];
  }

  /** โหลด master data ทั้งหมดจาก PublicService */
  private loadMasterData(): void {
    forkJoin({
      workLocations: this.publicService.getWorkLocaltion(),
      unions: this.publicService.getUnionMembership(),
      experienceLevels: this.publicService.getExperienceLevel(),
      partnerDirectories: this.publicService.getPartnerIdentity(),
      races: this.publicService.getRacialIdentity(),
      genders: this.publicService.getGenderIdentity(),
      professions: this.publicService.getProfessions(),
    }).subscribe({
      next: (res) => {
        this.workLocations = res.workLocations.items.map(
          (x: { id: number; nameTh: string; nameEn: string }) => ({
            label: this.pickLabel(x),
            value: x.id,
          })
        );

        this.unions = res.unions.items.map(
          (x: { id: number; nameTh: string; nameEn: string }) => ({
            label: this.pickLabel(x),
            value: x.id,
          })
        );

        this.experienceLevels = res.experienceLevels.items.map(
          (x: { id: number; nameTh: string; nameEn: string }) => ({
            label: this.pickLabel(x),
            value: x.id,
          })
        );

        this.partnerDirectories = res.partnerDirectories.items.map(
          (x: { id: number; nameTh: string; nameEn: string }) => ({
            label: this.pickLabel(x),
            value: x.id,
          })
        );

        this.buildPartnerLabelMap(); // ✅ ย้ายมาไว้ตรงนี้

        this.races = res.races.items.map(
          (x: { id: number; nameTh: string; nameEn: string }) => ({
            label: this.pickLabel(x),
            value: x.id,
          })
        );

        this.genders = res.genders.items.map(
          (x: { id: number; nameTh: string; nameEn: string }) => ({
            label: this.pickLabel(x),
            value: x.id,
          })
        );

        this.professions = res.professions.items.map(
          (x: { id: number; nameTh: string; nameEn: string }) => ({
            label: this.pickLabel(x),
            value: x.id,
          })
        );
      },
      error: () =>
        this.toast.error(
          $localize`:@@profile_toast_profile_load_error:ไม่สามารถดึงข้อมูลโปรไฟล์ได้`,
          {
            title: $localize`:@@profile_toast_profile_load_error_title:โหลดข้อมูลล้มเหลว`,
          }
        ),
    });
  }

  /** โปรไฟล์ใหม่? */
  private isNewProfile = false;

  /** โปรไฟล์ปัจจุบัน */
  private currentProfile: ProfileDto | null = null;

  // ใช้แสดงใน list ใต้หัวข้อ Credits
  // creditEntries: string[] = [];

  // เก็บ object จริง ๆ ไว้ส่งเข้า API
  credits: ProfileCredit[] = [];

  editingCreditIndex: number | null = null;

  // สถานะ popup
  creditModalOpen = false;

  creditForm = this.fb.group({
    company: [''],
    title: [''],
    startYear: [''],
    endYear: [''],
    current: [false],
    venue: [''],
    jobLocation: [''],
    internship: [false],
    fellowship: [false],
    deptId: new FormControl<number | null>(null),
    posId: new FormControl<number | null>(null),
    skillIds: new FormControl<number[]>([], { nonNullable: true }),
    deptText: new FormControl<string>(''), // ✅
    posText: new FormControl<string>(''),  // ✅
  });

  /** ฟอร์มหลัก */
  form = this.fb.group({
    privateProfile: new FormControl(false),
    profileIsCompany: new FormControl(false),
    firstName: new FormControl<string>('', { nonNullable: true }),
    lastName: new FormControl<string>('', { nonNullable: true }),
    pronouns: new FormControl<string>(''),
    location: new FormControl<string>('', { nonNullable: true }),
    email: new FormControl<string>('', { nonNullable: true }),
    phone: new FormControl<string>(''),
    website: new FormControl<string>(''),
    multiLang: new FormControl(false),
    additionalLanguages: this.fb.array<FormControl<string>>([]),
    travel: new FormControl<boolean | null>(null),
    tour: new FormControl<boolean | null>(null),
    about: new FormControl<string>(''),
    education: new FormControl<string>(''),
    video1: new FormControl<string>(''),
    video2: new FormControl<string>(''),
    facebook: new FormControl<string>(''),
    instagram: new FormControl<string>(''),
    twitter: new FormControl<string>(''),
    tiktok: new FormControl<string>(''),
    linkedin: new FormControl<string>(''),
    title: new FormControl<number[]>([], { nonNullable: true }),
    workLocations: new FormControl<number[]>([], { nonNullable: true }),
    unions: new FormControl<number[]>([], { nonNullable: true }),
    experience: new FormControl<number[]>([], { nonNullable: true }),
    partners: new FormControl<number[]>([], { nonNullable: true }),
    genders: new FormControl<number[]>([], { nonNullable: true }),
    races: new FormControl<number[]>([], { nonNullable: true }),
    titleOtherText: new FormControl<string>(''),
    workLocationsOtherText: new FormControl<string>(''),
    racialIdentityOtherText: new FormControl<string>(''),
    genderSelfDescribeText: new FormControl<string>(''),
    partnerOtherText: new FormControl<string>(''),
    experienceOtherText: new FormControl<string>(''),
    unionOtherText: new FormControl<string>(''),
    unionStudentAcademicText: new FormControl<string>(''),
    partnerDetailById: new FormControl<Record<number, string>>({}, { nonNullable: true }),
  });

  // selections เป็น number ให้ตรงกับ API
  selectedProfession = new Set<number>();
  selectedWorkLocations = new Set<number>();
  selectedUnions = new Set<number>();
  selectedExp = new Set<number>();
  selectedPartners = new Set<number>();
  selectedGenders = new Set<number>();
  selectedRaces = new Set<number>();
  selectedAdds = new Set<number>();

  // Embeds
  private _embed1 = signal<SafeResourceUrl | null>(null);
  private _embed2 = signal<SafeResourceUrl | null>(null);
  embed1 = computed(() => this._embed1());
  embed2 = computed(() => this._embed2());

  ngOnInit(): void {
    this.isNewProfile = this.router.url.includes('/profile-new');
    if (!this.isNewProfile) {
      this.loadProfile();
    } else {
      this.currentProfile = null;
    }

    this.loadMasterData();
    this.loadMaster();

    // ✅ multiLang toggle -> เคลียร์ languages ถ้าปิด
    this.form.controls.multiLang.valueChanges.subscribe((on) => {
      if (!on) {
        this.additionalLanguagesFA.clear();
      } else {
        // ถ้าเปิดแล้วไม่มี input เลย ให้ใส่ 1 ช่องเริ่มต้น
        if (this.additionalLanguagesFA.length === 0) {
          this.addLanguage();
        }
      }
    });
  }

  private readonly OTHER_ID = 999;

  get isCreditDeptOtherSelected(): boolean {
    return this.selectedCreditDepts.has(this.OTHER_ID);
  }

  get isCreditPosOtherSelected(): boolean {
    return this.selectedCreditPositions.has(this.OTHER_ID);
  }

  // ✅ เพิ่ม input 1 ช่อง
  addLanguage(value = '') {
    this.additionalLanguagesFA.push(
      new FormControl<string>(value, {
        nonNullable: true,
        validators: [Validators.maxLength(50)],
      })
    );
  }

  // ✅ ลบ input ตาม index
  removeLanguage(i: number) {
    this.additionalLanguagesFA.removeAt(i);
    // กันเหลือ 0 ช่องขณะ multiLang=true
    if (this.form.controls.multiLang.value && this.additionalLanguagesFA.length === 0) {
      this.addLanguage();
    }
  }

  private buildPartnerLabelMap() {
    this.partnerLabelMap.clear();
    for (const it of this.partnerDirectories ?? []) {
      this.partnerLabelMap.set(it.value, it.label);
    }
  }

  get additionalLanguagesFA(): FormArray<FormControl<string>> {
    return this.form.get('additionalLanguages') as FormArray<FormControl<string>>;
  }

  get partnerDetailMap(): Record<number, string> {
    return this.form.controls.partnerDetailById.value ?? {};
  }

  partnerDetail(pid: number): string {
    return this.partnerDetailMap[pid] ?? '';
  }

  setPartnerDetail(pid: number, val: string) {
    const next = { ...this.partnerDetailMap, [pid]: val };
    this.form.controls.partnerDetailById.setValue(next);
  }


  private buildCreditLabel(c: ProfileCredit): string {
    const presentLabel = $localize`:@@profile_credit_present:Present`;

    const period = c.current
      ? `${c.startYear} – ${presentLabel}`
      : c.endYear
        ? `${c.startYear} – ${c.endYear}`
        : `${c.startYear}`;

    return `${c.company} — ${c.title} (${period})`;
  }

  performanceItems: ProfilePerformanceItem[] = [];

  /** ---------- Load & map from API ---------- */
  private loadProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (p: ProfileDto) => {
        this.currentProfile = p;
        this.populateFromProfile(p);

        const apiBase = environment.apiUrl.replace(/\/api\/?$/, '');

        // Avatar
        if (p.avatarUrl) {
          this.serverAvatarUrl = p.avatarUrl.startsWith('http')
            ? p.avatarUrl
            : `${apiBase}${p.avatarUrl}`;
        } else {
          this.serverAvatarUrl = null;
        }

        // Resume
        if (p.resumeUrl) {
          const full = p.resumeUrl.startsWith('http')
            ? p.resumeUrl
            : `${apiBase}${p.resumeUrl}`;
          this.resumePreviewUrl = full;
          this.resumeIsPdf = full.toLowerCase().endsWith('.pdf');
          this.resumeSafeUrl = this.resumeIsPdf
            ? this.sanitizer.bypassSecurityTrustResourceUrl(full)
            : null;
        }

        // Performance images
        if (p.performanceItems?.length) {
          this.performanceItems = [...p.performanceItems];

          const fullUrls = p.performanceItems.map(it => {
            const u = it.url;
            if (!u.startsWith('http')) {
              const path = u.startsWith('/') ? u : '/' + u;
              return `${apiBase}${path}`;
            }
            return u;
          });

          fullUrls.slice(0, 6).forEach((url, idx) => {
            this.imagePreviewUrls[idx] = url;
            this.images[idx] = null;
            this.performanceKinds[idx] = 'image';
          });
        }
      },
      error: () =>
        this.toast.error(
          $localize`:@@profile_toast_profile_load_error:ไม่สามารถดึงข้อมูลโปรไฟล์ได้`,
          {
            title: $localize`:@@profile_toast_profile_load_error_title:โหลดข้อมูลล้มเหลว`,
          }
        ),
    });
  }

  private populateFromProfile(p: ProfileDto): void {
    this.form.patchValue({
      privateProfile: p.privateProfile,
      profileIsCompany: p.profileIsCompany,
      firstName: p.firstName,
      lastName: p.lastName,
      pronouns: p.pronouns ?? '',
      title: p.title ?? [],
      location: p.location,
      email: p.email,
      phone: p.phone,
      website: p.website,
      linkedin: p.linkedin ?? '',
      facebook: p.facebook ?? '',
      instagram: p.instagram ?? '',
      twitter: p.twitter ?? '',
      multiLang: p.multiLang,
      travel: p.travel,
      tour: p.tour,
      about: p.about,
      education: p.education,
      video1: p.video1,
      video2: p.video2,
      workLocations: p.workLocations ?? [],
      unions: p.unions ?? [],
      experience: p.experience ?? [],
      partners: p.partners ?? [],
      genders: p.genders ?? [],
      races: p.races ?? [],
      titleOtherText: (p as any).titleOtherText ?? '',
      workLocationsOtherText: (p as any).workLocationsOtherText ?? '',
      racialIdentityOtherText: (p as any).racialIdentityOtherText ?? '',
      genderSelfDescribeText: (p as any).genderSelfDescribeText ?? '',
      partnerOtherText: (p as any).partnerOtherText ?? '',
      experienceOtherText: (p as any).experienceOtherText ?? '',
      unionOtherText: (p as any).unionOtherText ?? '',
      unionStudentAcademicText: (p as any).unionStudentAcademicText ?? '',
      partnerDetailById: (p as any).partnerDetailById ?? {},
    }, { emitEvent: false });

    // ✅ เติม languages
    this.additionalLanguagesFA.clear();
    const langs = (p.additionalLanguages ?? []).filter(x => (x ?? '').trim().length > 0);

    if (p.multiLang) {
      if (langs.length) langs.forEach(x => this.addLanguage(x));
      else this.addLanguage(); // เปิด multiLang แต่ไม่มีข้อมูล -> มี 1 ช่อง
    }

    this.selectedProfession = new Set(p.title ?? []);
    this.selectedWorkLocations = new Set(p.workLocations ?? []);
    this.selectedUnions = new Set(p.unions ?? []);
    this.selectedExp = new Set(p.experience ?? []);
    this.selectedPartners = new Set(p.partners ?? []);
    this.selectedGenders = new Set(p.genders ?? []);
    this.selectedRaces = new Set(p.races ?? []);
    this.selectedAdds = new Set(p.additionals ?? []);

    // 🔹 เก็บ object credits ทั้งก้อน
    this.credits = [...(p.credits ?? [])];
  }

  getDeptNames(c: ProfileCredit): string[] {
    return (c.deptIds || [])
      .map(id => this.deptById.get(id))
      .filter(Boolean)
      .map((d: any) => this.pickLabel(d));
  }

  getPosNames(c: ProfileCredit): string[] {
    return (c.posIds || [])
      .map(id => this.posById.get(id))
      .filter(Boolean)
      .map((p: any) => this.pickLabel(p));
  }

  getSkillNames(c: ProfileCredit): string[] {
    return (c.skillIds || [])
      .map(id => this.skillById.get(id))
      .filter(Boolean)
      .map((s: any) => this.pickLabel(s));
  }

  private loadPositionsByDepartment(deptId: number): Promise<void> {
    this.filteredPositions = [];
    this.filteredSkills = [];
    this.creditForm.patchValue({ posId: null, skillIds: [] }, { emitEvent: false });

    return new Promise<void>((resolve) => {
      this.publicService.listByDepartment(deptId, 0, 500).subscribe({
        next: (res) => {
          const items = res?.items ?? [];

          // ✅ เก็บเป็น positionsApi เฉพาะ dept นี้ (หรือจะเก็บแค่ filteredPositions ก็ได้)
          this.positionsApi = items;

          // ✅ map ไว้ใช้ getPosNames ทีหลัง
          this.posById.clear();
          for (const p of items) {
            if (typeof p?.id === 'number') this.posById.set(p.id, p);
          }

          // ✅ ตัวที่โชว์ใน UI
          this.filteredPositions = items;
          resolve();
        },
        error: () => resolve(),
      });
    });
  }

  selectDept(departmentId: number) {
    const ctrl = this.creditForm.controls.deptId;
    const current = ctrl.value;

    if (current === departmentId) {
      ctrl.setValue(null);      // ✅ valueChanges จะเคลียร์ให้เอง
    } else {
      ctrl.setValue(departmentId); // ✅ valueChanges จะไปโหลด positions
    }
  }

  selectPos(positionId: number) {
    const ctrl = this.creditForm.controls.posId;
    const current = ctrl.value;

    if (current === positionId) {
      // กดซ้ำ → เคลียร์ position + skills
      ctrl.setValue(null);
      this.filteredSkills = [];
      this.creditForm.patchValue(
        { skillIds: [] },
        { emitEvent: false }
      );
    } else {
      ctrl.setValue(positionId);
      // valueChanges(posId) ที่ constructor จะ filter skills ให้อยู่แล้ว
    }
  }

  toggleCreditSkill(skillId: number) {
    const ctrl = this.creditForm.controls.skillIds;
    const current = ctrl.value ?? [];
    if (current.includes(skillId)) {
      ctrl.setValue(current.filter(id => id !== skillId));
    } else {
      ctrl.setValue([...current, skillId]);
    }
  }

  // ---------- Credit popup handlers ----------
  addCredit() {
    this.editingCreditIndex = null;

    this.creditForm.reset({
      company: '',
      title: '',
      startYear: '',
      endYear: '',
      current: false,
      venue: '',
      jobLocation: '',
      internship: false,
      fellowship: false,
      deptId: null,
      posId: null,
      skillIds: [],
    });

    this.selectedCreditDepts.clear();
    this.selectedCreditPositions.clear();
    this.filteredPositions = [];
    this.filteredSkills = [];

    this.creditDdSearch = { dept: '', pos: '' };
    this.creditDdOpen = { dept: false, pos: false };

    this.creditModalOpen = true;
  }

  async editCredit(index: number) {
    const c = this.credits[index];
    if (!c) return;

    this.editingCreditIndex = index;

    // set selections
    this.selectedCreditDepts = new Set<number>(c.deptIds ?? []);
    this.selectedCreditPositions = new Set<number>(c.posIds ?? []);

    // reset form fields อื่น ๆ
    this.creditForm.patchValue({
      company: c.company,
      title: c.title,
      startYear: c.startYear,
      endYear: c.endYear ?? '',
      current: c.current,
      venue: c.venue,
      jobLocation: c.jobLocation,
      internship: c.internship,
      fellowship: c.fellowship,
      deptId: null,
      posId: null,
      skillIds: [...(c.skillIds ?? [])],
    }, { emitEvent: false });

    // โหลด positions ตาม dept ที่เลือก (รองรับหลาย dept)
    await this.reloadPositionsForSelectedDepts();

    this.creditModalOpen = true;
  }

  private async reloadPositionsForSelectedDepts(): Promise<void> {
    this.filteredPositions = [];
    this.filteredSkills = [];
    this.creditForm.patchValue({ skillIds: [] }, { emitEvent: false });

    const deptIds = Array.from(this.selectedCreditDepts);
    if (!deptIds.length) return;

    // เรียกทีละ dept แล้วรวม (กัน duplicate ด้วย id)
    const all: any[] = [];
    for (const deptId of deptIds) {
      const res = await new Promise<any>(resolve => {
        this.publicService.listByDepartment(deptId, 0, 500).subscribe({
          next: (r) => resolve(r),
          error: () => resolve(null)
        });
      });
      const items = res?.items ?? [];
      all.push(...items);
    }

    // unique by id
    const map = new Map<number, any>();
    for (const p of all) if (typeof p?.id === 'number') map.set(p.id, p);
    const unique = Array.from(map.values());

    // map สำหรับ label
    this.posById.clear();
    unique.forEach(p => this.posById.set(p.id, p));

    this.filteredPositions = unique;

    // ถ้ามี pos ที่เลือกไว้แต่ไม่อยู่ใน list แล้ว → ตัดทิ้ง
    const keep = new Set(unique.map(p => p.id));
    for (const id of Array.from(this.selectedCreditPositions)) {
      if (!keep.has(id)) this.selectedCreditPositions.delete(id);
    }
  }

  closeCreditModal() {
    this.creditModalOpen = false;
  }

  saveCreditFromModal() {
    // ✅ บังคับ validate form controls
    this.creditForm.markAllAsTouched();
    this.creditForm.updateValueAndValidity({ emitEvent: false });

    // ✅ ถ้าเลือก 999 แล้ว deptText/posText ต้อง valid
    this.syncCreditOtherValidators();
    if (this.creditForm.invalid) {
      this.toast.warning('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const v = this.creditForm.getRawValue();

    const credit: ProfileCredit = {
      company: v.company || '',
      title: v.title || '',
      startYear: v.startYear || '',
      endYear: v.endYear || null,
      current: !!v.current,
      venue: v.venue || '',
      jobLocation: v.jobLocation || '',
      internship: !!v.internship,
      fellowship: !!v.fellowship,

      deptIds: Array.from(this.selectedCreditDepts),
      deptText: this.isCreditDeptOtherSelected ? (v.deptText || '').trim() : null, // ✅
      posIds: Array.from(this.selectedCreditPositions),
      posText: this.isCreditPosOtherSelected ? (v.posText || '').trim() : null,   // ✅
      skillIds: v.skillIds ?? [],
    };

    if (this.editingCreditIndex !== null) this.credits[this.editingCreditIndex] = credit;
    else this.credits.push(credit);

    this.editingCreditIndex = null;
    this.closeCreditModal();
  }

  public async toggleCreditDept(id: number) {
    this.toggleNumSet(this.selectedCreditDepts, id);

    // ✅ sync validators
    this.syncCreditOtherValidators();

    await this.reloadPositionsForSelectedDepts();
  }

  public toggleCreditPos(id: number) {
    this.toggleNumSet(this.selectedCreditPositions, id);

    // ✅ sync validators
    this.syncCreditOtherValidators();
  }
  removeCredit(i: number) {
    this.credits.splice(i, 1);
  }

  // ---------- UI helpers ----------
  onPickAvatar(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const ok = ['image/jpeg', 'image/png', 'image/webp'];
    // avatar
    if (!ok.includes(file.type)) {
      this.toast.warning(
        $localize`:@@profile_toast_avatar_type_warning:รองรับเฉพาะ JPG, PNG, WEBP`
      );
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      this.toast.warning(
        $localize`:@@profile_toast_avatar_large_warning:ไฟล์มีขนาดใหญ่มาก อาจใช้เวลาประมวลผลนาน`
      );
    }

    if (this.avatarPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(this.avatarPreviewUrl);
    this.avatarPreviewUrl = URL.createObjectURL(file);
    this.avatarFile = file;
  }

  private loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  private async compressImage(
    file: File,
    opts: { maxW?: number; maxH?: number; quality?: number; mime?: 'image/webp' | 'image/jpeg' } = {}
  ): Promise<File> {
    const { maxW = 1200, maxH = 1200, quality = 0.8, mime = 'image/webp' } = opts;

    const img = await this.loadImageFromFile(file);
    const { naturalWidth: w, naturalHeight: h } = img;

    const ratio = Math.min(maxW / w, maxH / h, 1);
    const targetW = Math.round(w * ratio);
    const targetH = Math.round(h * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        b => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        mime,
        quality
      );
    });

    const ext = mime === 'image/webp' ? 'webp' : 'jpg';
    const newName = (file.name || 'avatar').replace(/\.(jpe?g|png|webp)$/i, '') + `.${ext}`;
    return new File([blob], newName, { type: mime, lastModified: Date.now() });
  }

  clearLocalAvatar() {
    if (this.avatarPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(this.avatarPreviewUrl);
    this.avatarPreviewUrl = null;
  }

  deleteAvatar() {
    this.profileService.deleteAvatar().subscribe({
      next: (res: any) => {
        this.clearLocalAvatar();
        this.serverAvatarUrl = res?.avatarUrl || null;
        this.toast.success(
          $localize`:@@profile_toast_avatar_delete_success:ลบรูปเรียบร้อย`
        );
      },
      error: () =>
        this.toast.error(
          $localize`:@@profile_toast_avatar_delete_error:ลบรูปไม่สำเร็จ`
        ),
    });
  }

  addConflict() {
    this.toast.warning(
      $localize`:@@profile_toast_conflict_coming_soon_msg:หน้าต่างเพิ่มวันที่ติดภารกิจกำลังพัฒนา`,
      { title: $localize`:@@profile_toast_conflict_coming_soon_title:Coming soon` }
    );
  }

  toggleProfession(v: number) {
    this.toggleSet(this.selectedProfession, v);
    this.form.controls.title.setValue(Array.from(this.selectedProfession), { emitEvent: false });
  }

  toggleWorkLocation(v: number) {
    this.toggleSet(this.selectedWorkLocations, v);
    this.form.controls.workLocations.setValue(Array.from(this.selectedWorkLocations), { emitEvent: false });
  }

  toggleUnion(v: number) {
    this.toggleSet(this.selectedUnions, v);
    this.form.controls.unions.setValue(Array.from(this.selectedUnions), { emitEvent: false });
  }

  toggleExp(v: number) {
    this.toggleSet(this.selectedExp, v);
    this.form.controls.experience.setValue(Array.from(this.selectedExp), { emitEvent: false });
  }

  togglePartner(v: number) {
    this.toggleSet(this.selectedPartners, v);
    this.form.controls.partners.setValue(Array.from(this.selectedPartners), { emitEvent: false });
  }

  toggleAdd(v: number) {
    this.toggleSet(this.selectedAdds, v);
    // ถ้าคุณมี form.controls.additionals ด้วยจะ set ได้เลย
  }

  toggleGenderIdentity(v: number) {
    this.toggleSet(this.selectedGenders, v);

    const selfId = this.genderSelfDescribeValue;
    const isSelf = selfId != null && this.selectedGenders.has(selfId);

    const ctrl = this.form.controls.genderSelfDescribeText;

    if (!isSelf) {
      ctrl.setValue('', { emitEvent: false });
      ctrl.clearValidators();
      ctrl.updateValueAndValidity({ emitEvent: false });
    } else {
      ctrl.setValidators([Validators.required, Validators.maxLength(100)]);
      ctrl.updateValueAndValidity({ emitEvent: false });
    }
  }
  public toggleExperienceIdentity(v: number) {
    this.toggleSet(this.selectedExp, v);

    const otherId = this.expOtherValue;
    const isOther = otherId != null && this.selectedExp.has(otherId);

    const ctrl = this.form.controls.experienceOtherText;

    if (!isOther) {
      ctrl.setValue('', { emitEvent: false });
      ctrl.clearValidators();
      ctrl.updateValueAndValidity({ emitEvent: false });
    } else {
      ctrl.setValidators([Validators.required, Validators.maxLength(100)]);
      ctrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  getPartnerLabel(pid: number): string {
    return this.partnerLabelMap.get(pid) ?? '';
  }

  public toggleUnionIdentity(v: number) {
    this.toggleSet(this.selectedUnions, v);

    // Other
    {
      const otherId = this.unionOtherValue;
      const isOther = otherId != null && this.selectedUnions.has(otherId);
      const ctrl = this.form.controls.unionOtherText;

      if (!isOther) {
        ctrl.setValue('', { emitEvent: false });
        ctrl.clearValidators();
        ctrl.updateValueAndValidity({ emitEvent: false });
      } else {
        ctrl.setValidators([Validators.required, Validators.maxLength(120)]);
        ctrl.updateValueAndValidity({ emitEvent: false });
      }
    }

    // Student/Academic Member(Text)
    {
      const sid = this.unionStudentAcademicValue;
      const isSel = sid != null && this.selectedUnions.has(sid);
      const ctrl = this.form.controls.unionStudentAcademicText;

      if (!isSel) {
        ctrl.setValue('', { emitEvent: false });
        ctrl.clearValidators();
        ctrl.updateValueAndValidity({ emitEvent: false });
      } else {
        ctrl.setValidators([Validators.required, Validators.maxLength(120)]);
        ctrl.updateValueAndValidity({ emitEvent: false });
      }
    }
  }
  public togglePartnerIdentity(v: number) {
    this.toggleSet(this.selectedPartners, v);

    // เคลียร์ detail ถ้า unselect
    const detail = { ...this.form.controls.partnerDetailById.value };
    if (!this.selectedPartners.has(v)) {
      delete detail[v];
      this.form.controls.partnerDetailById.setValue(detail, { emitEvent: false });
    }

    // Other
    const otherId = this.partnerOtherValue;
    const isOther = otherId != null && this.selectedPartners.has(otherId);

    const otherCtrl = this.form.controls.partnerOtherText;
    if (!isOther) {
      otherCtrl.setValue('', { emitEvent: false });
      otherCtrl.clearValidators();
      otherCtrl.updateValueAndValidity({ emitEvent: false });
    } else {
      otherCtrl.setValidators([Validators.required, Validators.maxLength(120)]);
      otherCtrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  private validateBeforeSave(): boolean {
    // sync set -> form
    this.syncAllSetsToForm();

    // บังคับ trigger validation
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ emitEvent: false });

    // ✅ Email format
    const emailCtrl = this.form.controls.email;
    const email = (emailCtrl.value || '').trim();

    // ถ้าใส่มาแต่ format ไม่ถูก
    if (email && emailCtrl.hasError('email')) {
      this.toast.error(
        $localize`:@@profile_toast_email_invalid:รูปแบบอีเมลไม่ถูกต้อง`,
        { title: $localize`:@@profile_toast_email_invalid_title:ตรวจสอบอีเมล` }
      );
      // optional: โฟกัส input email (ถ้ามี #emailInput)
      // setTimeout(() => this.emailInput?.nativeElement?.focus(), 0);
      return false;
    }

    // ✅ required title (ตัวอย่าง field สำคัญอื่น ๆ)
    if (this.form.controls.title.invalid) {
      this.toast.warning(
        $localize`:@@profile_toast_title_required:กรุณากรอก Title`,
        { title: $localize`:@@profile_toast_invalid_title:ข้อมูลไม่ครบ` }
      );
      return false;
    }

    // ถ้าฟอร์ม invalid โดยรวม
    if (this.form.invalid) {
      this.toast.warning(
        $localize`:@@profile_toast_invalid:กรุณากรอกข้อมูลให้ครบถ้วน`,
        { title: $localize`:@@profile_toast_invalid_title:ข้อมูลไม่ครบ` }
      );
      return false;
    }

    return true;
  }

  public isPartnerNeedNameSelected(id: number): boolean {
    return this.selectedPartners.has(id);
  }

  toggleRace(v: number) { this.toggleSet(this.selectedRaces, v); }

  updateEmbed(which: 1 | 2) {
    const ctrl = which === 1 ? this.form.controls.video1 : this.form.controls.video2;
    const url = ctrl.value || '';
    const id = this.extractYouTubeId(url);
    const safe = id ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${id}`) : null;
    if (which === 1) this._embed1.set(safe); else this._embed2.set(safe);
  }

  extractYouTubeId(url: string): string | null {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1) || null;
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      const m = url.match(/embed\/([\w-]{6,})/i); if (m) return m[1];
      return null;
    } catch { return null; }
  }

  isSaving = false;

  async save() {
    if (!this.validateBeforeSave()) return;
    this.syncAllSetsToForm();

    const base = this.form.getRawValue();
    const payload: ProfilePayload = {
      ...(this.currentProfile && !this.isNewProfile
        ? { id: this.currentProfile.id, userId: this.currentProfile.userId }
        : {}),
      privateProfile: !!base.privateProfile,
      profileIsCompany: !!base.profileIsCompany,
      firstName: base.firstName || '',
      lastName: base.lastName || '',
      pronouns: base.pronouns || '',
      location: base.location || '',
      email: base.email || '',
      phone: base.phone || '',
      website: base.website || '',
      linkedin: base.linkedin || '',
      facebook: base.facebook || '',
      instagram: base.instagram || '',
      twitter: base.twitter || '',
      multiLang: !!base.multiLang,
      additionalLanguages: this.form.controls.multiLang.value
        ? this.additionalLanguagesFA.controls.map(c => (c.value || '').trim()).filter(Boolean)
        : [],
      travel: base.travel ?? false,
      tour: base.tour ?? false,
      about: base.about || '',
      education: base.education || '',
      video1: base.video1 || '',
      video2: base.video2 || '',
      title: Array.from(this.selectedProfession),
      workLocations: Array.from(this.selectedWorkLocations),
      unions: Array.from(this.selectedUnions),
      experience: Array.from(this.selectedExp),
      partners: Array.from(this.selectedPartners),
      genders: Array.from(this.selectedGenders),
      races: Array.from(this.selectedRaces),
      titleOtherText: (base.titleOtherText || '').trim() || undefined,
      workLocationsOtherText: (base.workLocationsOtherText || '').trim() || undefined,
      racialIdentityOtherText: (base.racialIdentityOtherText || '').trim() || undefined,
      genderSelfDescribeText: (base.genderSelfDescribeText || '').trim() || undefined,
      partnerOtherText: (base.partnerOtherText || '').trim() || undefined,
      experienceOtherText: (base.experienceOtherText || '').trim() || undefined,
      unionOtherText: (base.unionOtherText || '').trim() || undefined,
      unionStudentAcademicText: (base.unionStudentAcademicText || '').trim() || undefined,
      partnerDetailById: base.partnerDetailById ?? {},
      additionals: Array.from(this.selectedAdds),
      credits: this.credits,
    };

    this.isSaving = true;

    const save$ = this.isNewProfile
      ? this.profileService.saveProfile(payload)     // ✅ JSON ปกติ
      : this.profileService.updateProfile(payload);  // ✅ JSON ปกติ

    save$
      .pipe(
        switchMap((res: any) => {
          // อัปเดตสถานะ profile หลัง save
          if (res?.id) this.isNewProfile = false;

          // ✅ สร้างรายการ upload ที่ต้องทำต่อ (ถ้ามี)
          const uploads: any[] = [];

          if (this.avatarFile) {
            uploads.push(this.profileService.uploadAvatar(this.avatarFile));
          }

          if (this.resumeFile) {
            uploads.push(this.profileService.uploadResume(this.resumeFile));
          }

          const perfFiles = this.images.filter((f): f is File => !!f);
          if (perfFiles.length) {
            uploads.push(this.profileService.uploadPerformances(perfFiles));
          }

          // ถ้าไม่มีไฟล์อะไรเลย ก็จบ
          return uploads.length ? forkJoin(uploads) : of(null);
        }),
        tap(() => {
          this.toast.success($localize`:@@profile_toast_save_success_msg:บันทึกข้อมูลสำเร็จ`, {
            title: $localize`:@@profile_toast_save_success_title:สำเร็จ`,
            duration: 3000,
          });
        }),
        finalize(() => (this.isSaving = false))
      )
      .subscribe({
        next: () => {
          this.router.navigate(['en/directory/profile']);
        },
        error: (err) => {
          console.error('save profile error', err);
          const msg =
            err?.error?.message ||
            err?.message ||
            $localize`:@@profile_toast_save_error_default_msg:เกิดข้อผิดพลาดในการบันทึกข้อมูล`;
          this.toast.error(msg, { title: $localize`:@@profile_toast_save_error_title:เกิดข้อผิดพลาด` });
        },
      });
  }

  private syncAllSetsToForm() {
    this.form.controls.title.setValue(Array.from(this.selectedProfession), { emitEvent: false });
    this.form.controls.workLocations.setValue(Array.from(this.selectedWorkLocations), { emitEvent: false });
    this.form.controls.unions.setValue(Array.from(this.selectedUnions), { emitEvent: false });
    this.form.controls.experience.setValue(Array.from(this.selectedExp), { emitEvent: false });
    this.form.controls.partners.setValue(Array.from(this.selectedPartners), { emitEvent: false });
    this.form.controls.genders.setValue(Array.from(this.selectedGenders), { emitEvent: false });
    this.form.controls.races.setValue(Array.from(this.selectedRaces), { emitEvent: false });
  }

  cancel() {
    this.router.navigate(['en/directory/profile']);
  }

  private revokeResumeUrl() {
    if (this.resumePreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.resumePreviewUrl);
    }
  }

  ngOnDestroy(): void {
    if (this.avatarPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(this.avatarPreviewUrl);
    this.revokeResumeUrl();
    this.imagePreviewUrls.forEach(u => { if (u?.startsWith('blob:')) URL.revokeObjectURL(u); });
  }

  private readonly MAX_RESUME_SIZE_MB = 50;

  onPickResume(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const maxBytes = this.MAX_RESUME_SIZE_MB * 1024 * 1024;
    const ok = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

    // resume
    if (!ok.includes(file.type)) {
      this.toast.warning(
        $localize`:@@profile_toast_resume_type_warning:รองรับเฉพาะ PDF, JPG, PNG, WEBP`
      );
      input.value = '';
      return;
    }

    if (file.size > maxBytes) {
      this.toast.warning(
        $localize`:@@profile_toast_resume_size_warning:ไฟล์ต้องไม่เกิน ${this.MAX_RESUME_SIZE_MB}MB`
      );
      input.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.toast.info(
        $localize`:@@profile_toast_resume_large_info:ไฟล์ค่อนข้างใหญ่ อาจใช้เวลาในการพรีวิว/อัปโหลด`
      );
    }

    this.revokeResumeUrl();

    const objectUrl = URL.createObjectURL(file);
    this.resumeFile = file;
    this.resumeIsPdf = file.type === 'application/pdf';
    this.resumePreviewUrl = objectUrl;
    this.resumeSafeUrl = this.resumeIsPdf
      ? this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl)
      : null;
  }

  clearResume() {
    this.revokeResumeUrl();
    this.resumeFile = null;
    this.resumePreviewUrl = null;
    this.resumeSafeUrl = null;
    this.resumeIsPdf = false;
  }

  onPickImage(e: Event, i: number) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const ok = ['image/jpeg', 'image/png', 'image/webp'];
    // performance image
    if (!ok.includes(file.type)) {
      this.toast.warning(
        $localize`:@@profile_toast_perf_type_warning:รองรับเฉพาะ JPG, PNG, WEBP`
      );
      input.value = '';
      return;
    }

    const old = this.imagePreviewUrls[i];
    if (old?.startsWith('blob:')) URL.revokeObjectURL(old);

    const objectUrl = URL.createObjectURL(file);
    this.images[i] = file;
    this.imagePreviewUrls[i] = objectUrl;
    this.performanceKinds[i] = 'image';

    input.value = '';
  }

  removeImage(i: number) {

    const preview = this.imagePreviewUrls[i];

    // ---- 1️⃣ ถ้าเป็นไฟล์ใหม่ (blob)
    if (preview?.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
      this.imagePreviewUrls[i] = null;
      this.images[i] = null;
      this.performanceKinds[i] = null;
      return;
    }

    // ---- 2️⃣ ถ้าเป็นไฟล์จาก server
    const item = this.performanceItems[i];
    if (!item?.id) {
      // ไม่มี id ก็แค่เคลียร์
      this.imagePreviewUrls[i] = null;
      this.performanceKinds[i] = null;
      return;
    }

    // เรียก API ลบ
    this.profileService.deletePerformance(item.id).subscribe({
      next: (res) => {

        // อัปเดตรายการใหม่จาก response
        this.performanceItems = res.performanceItems ?? [];

        // รีโหลด preview ใหม่ทั้งหมด
        this.imagePreviewUrls = Array(6).fill(null);
        this.images = Array(6).fill(null);
        this.performanceKinds = Array(6).fill(null);

        const apiBase = environment.apiUrl.replace(/\/api\/?$/, '');

        this.performanceItems.slice(0, 6).forEach((it, idx) => {
          const full = it.url.startsWith('http')
            ? it.url
            : `${apiBase}${it.url.startsWith('/') ? it.url : '/' + it.url}`;

          this.imagePreviewUrls[idx] = full;
          this.performanceKinds[idx] = 'image';
        });

        this.toast.success($localize`:@@profile_toast_delete_success:ลบรูปเรียบร้อย`);
      },
      error: () => {
        this.toast.error($localize`:@@profile_toast_delete_error:ลบรูปไม่สำเร็จ`);
      }
    });
  }

  ddOpen: Record<DdKey, boolean> = {
    work: false,
    unions: false,
    exp: false,
    partners: false,
    genders: false,
    races: false,
    professions: false,
    additional: false,
  };

  ddSearch: Record<DdKey, string> = {
    work: '',
    unions: '',
    exp: '',
    partners: '',
    genders: '',
    races: '',
    professions: '',
    additional: '',
  };

  public toggleDd(e: MouseEvent, key: DdKey) {
    e.stopPropagation();
    (Object.keys(this.ddOpen) as DdKey[]).forEach(k => (this.ddOpen[k] = false));
    this.ddOpen[key] = !this.ddOpen[key];
  }

  public closeDd(key: DdKey) {
    this.ddOpen[key] = false;
  }

  public filterList(list: { label: string; value: number }[], q: string) {
    const s = (q || '').trim().toLowerCase();
    if (!s) return list;
    return list.filter(x => x.label.toLowerCase().includes(s));
  }

  public clearSet(set: Set<number>) {
    set.clear();
  }

  public labelsFromSet(set: Set<number>, list: { label: string; value: number }[]) {
    if (!set?.size) return '';
    const map = new Map(list.map(x => [x.value, x.label]));
    const arr = Array.from(set).map(v => map.get(v)).filter(Boolean) as string[];
    if (arr.length <= 3) return arr.join(', ');
    return `${arr.slice(0, 3).join(', ')} +${arr.length - 3} more`;
  }

  public toggleSet(set: Set<number>, v: number) {
    set.has(v) ? set.delete(v) : set.add(v);
  }

  // ===== Credit modal multi dropdown =====
  creditDdOpen = { dept: false, pos: false };
  creditDdSearch = { dept: '', pos: '' };

  selectedCreditDepts = new Set<number>();
  selectedCreditPositions = new Set<number>();

  // filter list แบบเดียวกับของคุณ แต่แยกใช้ใน modal ได้เลย
  filterAny(list: any[], q: string) {
    const s = (q || '').trim().toLowerCase();
    if (!s) return list;
    return list.filter(x => (this.pickLabel(x) || '').toLowerCase().includes(s));
  }

  toggleNumSet(set: Set<number>, v: number) {
    set.has(v) ? set.delete(v) : set.add(v);
  }

  clearNumSet(set: Set<number>) { set.clear(); }

  // เดิมตัดแค่ 3 แล้ว +more → เปลี่ยนเป็นแสดงทั้งหมด
  labelsFromNumSet(set: Set<number>, list: any[]) {
    if (!set?.size) return '';
    const map = new Map<number, string>(list.map(x => [x.id, this.pickLabel(x)]));
    const arr = Array.from(set)
      .map(id => map.get(id))
      .filter(Boolean) as string[];

    return arr.join(', '); // ✅ แสดงทั้งหมด
  }

  public labelsArrayFromNumSet(set: Set<number>, list: any[]): string[] {
    if (!set?.size) return [];
    const map = new Map<number, string>(list.map(x => [x.id, this.pickLabel(x)]));
    return Array.from(set)
      .map(id => map.get(id))
      .filter(Boolean) as string[];
  }

  public clearCreditDepts() {
    this.selectedCreditDepts.clear();
    // เปลี่ยน dept -> ควร reload positions + เคลียร์ pos ที่ไม่ valid
    this.reloadPositionsForSelectedDepts();
    this.selectedCreditPositions.clear();
  }


  toggleCreditDd(e: MouseEvent, key: 'dept' | 'pos') {
    e.stopPropagation();
    this.creditDdOpen.dept = false;
    this.creditDdOpen.pos = false;
    this.creditDdOpen[key] = !this.creditDdOpen[key];
  }

  public closeCreditDd(key: 'dept' | 'pos') {
    this.creditDdOpen[key] = false;
  }

  partnerLabelMap = new Map<number, string>();

  // ====== outside click close dropdowns (main + credit modal) ======
  @ViewChild('deptWrap') deptWrap?: ElementRef<HTMLElement>;
  @ViewChild('posWrap') posWrap?: ElementRef<HTMLElement>;

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(ev: MouseEvent) {
    const target = ev.target as Node;

    // ---- close main dropdowns (work/unions/exp/partners/genders/races)
    // ถ้าคลิกนอก dropdown ใด ๆ ให้ปิดทั้งหมด (กันค้าง)
    // (ถ้าคุณอยากให้ปิดเฉพาะอันที่เปิดอยู่ ก็ปรับได้)
    const clickedInsideAnyMainDd =
      (target as HTMLElement)?.closest?.('[data-ddwrap="professions"]') ||
      (target as HTMLElement)?.closest?.('[data-ddwrap="work"]') ||
      (target as HTMLElement)?.closest?.('[data-ddwrap="unions"]') ||
      (target as HTMLElement)?.closest?.('[data-ddwrap="exp"]') ||
      (target as HTMLElement)?.closest?.('[data-ddwrap="partners"]') ||
      (target as HTMLElement)?.closest?.('[data-ddwrap="genders"]') ||
      (target as HTMLElement)?.closest?.('[data-ddwrap="races"]');

    if (!clickedInsideAnyMainDd) {
      (Object.keys(this.ddOpen) as DdKey[]).forEach(k => (this.ddOpen[k] = false));
    }

    // ---- close credit dropdowns (dept/pos) แบบไม่พัง
    if (this.creditDdOpen.dept && this.deptWrap && !this.deptWrap.nativeElement.contains(target)) {
      this.creditDdOpen.dept = false;
    }
    if (this.creditDdOpen.pos && this.posWrap && !this.posWrap.nativeElement.contains(target)) {
      this.creditDdOpen.pos = false;
    }
  }

  trackById = (_: number, item: any) => item?.id;

  public getRaceOtherValue(): number | null {
    const it = this.races.find(x => (x.label || '').toLowerCase().includes('other'));
    return it ? it.value : null;
  }

  public get isRaceOtherSelected(): boolean {
    const otherVal = this.getRaceOtherValue();
    return otherVal != null && this.selectedRaces.has(otherVal);
  }

  public toggleRaceIdentity(v: number) {
    this.toggleSet(this.selectedRaces, v);

    // ✅ sync set -> form
    this.form.controls.races.setValue(Array.from(this.selectedRaces), { emitEvent: false });

    const otherVal = this.getRaceOtherValue();
    const isOther = otherVal != null && this.selectedRaces.has(otherVal);

    if (!isOther) {
      this.form.controls.racialIdentityOtherText.setValue('', { emitEvent: false });
      this.form.controls.racialIdentityOtherText.clearValidators();
      this.form.controls.racialIdentityOtherText.updateValueAndValidity({ emitEvent: false });
      return;
    }

    this.form.controls.racialIdentityOtherText.setValidators([
      Validators.required,
      Validators.maxLength(100)
    ]);
    this.form.controls.racialIdentityOtherText.updateValueAndValidity({ emitEvent: false });
  }

  private findValueByLabel(list: Labeled[], includesText: string): number | null {
    const t = includesText.toLowerCase();
    const it = list.find(x => (x.label || '').toLowerCase().includes(t));
    return it ? it.value : null;
  }

  get genderSelfDescribeValue(): number | null {
    return this.findValueByLabel(this.genders, 'self-describe');
  }
  get isGenderSelfDescribeSelected(): boolean {
    const v = this.genderSelfDescribeValue;
    return v != null && this.selectedGenders.has(v);
  }

  get expOtherValue(): number | null {
    return this.findValueByLabel(this.experienceLevels, 'other');
  }
  get isExpOtherSelected(): boolean {
    const v = this.expOtherValue;
    return v != null && this.selectedExp.has(v);
  }

  get unionOtherValue(): number | null {
    return this.findValueByLabel(this.unions, 'other');
  }
  get unionStudentAcademicValue(): number | null {
    // label ของคุณ: "Student / Academic Member (Text)"
    return this.findValueByLabel(this.unions, 'student / academic');
  }

  get isUnionOtherSelected(): boolean {
    const v = this.unionOtherValue;
    return v != null && this.selectedUnions.has(v);
  }
  get isUnionStudentAcademicSelected(): boolean {
    const v = this.unionStudentAcademicValue;
    return v != null && this.selectedUnions.has(v);
  }

  private partnerNeedsNameKeywords = [
    'local theatre', 'community org',
    'university', 'conservatory',
    'non-profit',
    'independent collective'
  ];

  get partnerOtherValue(): number | null {
    return this.findValueByLabel(this.partnerDirectories, 'other');
  }

  public partnerNeedsNameIds(): number[] {
    const set = new Set<number>();
    for (const kw of this.partnerNeedsNameKeywords) {
      const id = this.findValueByLabel(this.partnerDirectories, kw);
      if (id != null) set.add(id);
    }
    return Array.from(set);
  }

  get workLocationOtherValue(): number | null {
    // หา label ที่มีคำว่า other (รองรับ th/en)
    const it = this.workLocations.find(x =>
      (x.label || '').toLowerCase().includes('other')
    );
    return it ? it.value : null;
  }

  get isWorkLocationOtherSelected(): boolean {
    const v = this.workLocationOtherValue;
    return v != null && this.selectedWorkLocations.has(v);
  }

  public toggleWorkLocationIdentity(v: number) {
    this.toggleSet(this.selectedWorkLocations, v);

    const otherId = this.workLocationOtherValue;
    const isOther = otherId != null && this.selectedWorkLocations.has(otherId);

    const ctrl = this.form.controls.workLocationsOtherText;

    if (!isOther) {
      ctrl.setValue('', { emitEvent: false });
      ctrl.clearValidators();
      ctrl.updateValueAndValidity({ emitEvent: false });
    } else {
      ctrl.setValidators([Validators.required, Validators.maxLength(120)]);
      ctrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  public clearWorkLocations() {
    this.selectedWorkLocations.clear();

    const ctrl = this.form.controls.workLocationsOtherText;
    ctrl.setValue('', { emitEvent: false });
    ctrl.clearValidators();
    ctrl.updateValueAndValidity({ emitEvent: false });
  }
  private syncCreditOtherValidators() {
    const deptCtrl = this.creditForm.controls.deptText;
    const posCtrl = this.creditForm.controls.posText;

    if (this.isCreditDeptOtherSelected) {
      deptCtrl.setValidators([Validators.required, Validators.maxLength(120)]);
    } else {
      deptCtrl.setValue('', { emitEvent: false });
      deptCtrl.clearValidators();
    }
    deptCtrl.updateValueAndValidity({ emitEvent: false });

    if (this.isCreditPosOtherSelected) {
      posCtrl.setValidators([Validators.required, Validators.maxLength(120)]);
    } else {
      posCtrl.setValue('', { emitEvent: false });
      posCtrl.clearValidators();
    }
    posCtrl.updateValueAndValidity({ emitEvent: false });
  }
}
