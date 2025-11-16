import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { ProfileService } from '../../../service/profile.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { PubilcService } from 'src/app/shared/service/public/pubilc.service';
import { forkJoin } from 'rxjs';
import { LocaleSwitcherService } from 'src/locale/locale-switcher.service';

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
  // ❗ ตาม backend ล่าสุด: ให้รองรับหลายอัน
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
};

export type ProfilePayload = {
  id?: number;
  userId?: number;
  privateProfile: boolean;
  profileIsCompany: boolean;
  firstName: string;
  lastName: string;
  pronouns?: string;
  title: string;
  location?: string;
  email?: string;
  phone?: string;
  website?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  multiLang: boolean;
  travel: boolean;
  tour: boolean;
  about?: string;
  education?: string;
  video1?: string;
  video2?: string;
  workLocations: number[];
  unions: number[];
  experience: number[];
  partners: number[];
  genders: number[];
  races: number[];
  additionals: number[];
  credits: ProfileCredit[];
};

@Component({
  selector: 'app-handle-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
    console.log(this.serverAvatarUrl);
    return this.avatarPreviewUrl ?? this.serverAvatarUrl ?? null;
  }

  // master data
  workLocations: Labeled[] = [];
  unions: Labeled[] = [];
  experienceLevels: Labeled[] = [];
  partnerDirectories: Labeled[] = [];
  genders: Labeled[] = [];
  races: Labeled[] = [];
  additionals: Labeled[] = [
    { label: 'Disabled', value: 1 },
    { label: 'LGBTQIA+', value: 2 },
    { label: 'Neurodiverse', value: 3 },
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
    this.creditForm.get('deptId')!.valueChanges.subscribe(deptId => {
      if (!deptId) {
        this.filteredPositions = [];
        this.filteredSkills = [];
        this.creditForm.patchValue({ posId: null, skillIds: [] }, { emitEvent: false });
        return;
      }

      // ใช้ departmentId จาก API
      this.filteredPositions = this.positionsApi.filter((p: any) => p.departmentId === deptId);

      this.filteredSkills = [];
      this.creditForm.patchValue({ posId: null, skillIds: [] }, { emitEvent: false });
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


  private pickLabel(x: { nameTh?: string; nameEn?: string }): string {
    const lang = this.ls.currentLocale();
    const isTh = lang === 'th';
    return isTh
      ? (x.nameTh || x.nameEn || '')
      : (x.nameEn || x.nameTh || '');
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
      },
      error: (err) => {
        console.error('Load master data failed', err);
        this.toast.error('ไม่สามารถโหลดข้อมูลตัวเลือกได้', { title: 'โหลดข้อมูลล้มเหลว' });
      }
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
    company: ['', Validators.required],
    title: ['', Validators.required],
    startYear: ['', Validators.required],
    endYear: [''],
    current: [false],
    venue: ['', Validators.required],
    jobLocation: ['', Validators.required],
    internship: [false],
    fellowship: [false],
    deptId: new FormControl<number | null>(null, { validators: Validators.required }),
    posId: new FormControl<number | null>(null, { validators: Validators.required }),
    skillIds: new FormControl<number[]>([], { nonNullable: true }),
  });

  /** ฟอร์มหลัก */
  form = this.fb.group({
    privateProfile: new FormControl(false),
    profileIsCompany: new FormControl(false),
    firstName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    pronouns: new FormControl<string>(''),
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(50)] }),
    location: new FormControl<string>('', { nonNullable: true, validators: [Validators.maxLength(25)] }),
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.email] }),
    phone: new FormControl<string>(''),
    website: new FormControl<string>(''),
    multiLang: new FormControl(false),
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
  });

  // selections เป็น number ให้ตรงกับ API
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
  }

  private buildCreditLabel(c: ProfileCredit): string {
    const period = c.current
      ? `${c.startYear} – Present`
      : c.endYear
        ? `${c.startYear} – ${c.endYear}`
        : `${c.startYear}`;

    return `${c.company} — ${c.title} (${period})`;
  }

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
        if (p.performanceUrls?.length) {
          const fullUrls = p.performanceUrls.map(u => {
            if (!u.startsWith('http')) {
              const path = u.startsWith('/') ? u : '/' + u;
              return `${apiBase}${path}`;
            }
            return u;
          });

          fullUrls.slice(0, 6).forEach((url, idx) => {
            this.imagePreviewUrls[idx] = url;
            this.images[idx] = null;

            const lower = url.toLowerCase();
            if (lower.endsWith('.pdf')) {
              this.performanceKinds[idx] = 'pdf';
            } else if (/\.(jpe?g|png|webp)$/.test(lower)) {
              this.performanceKinds[idx] = 'image';
            } else {
              this.performanceKinds[idx] = 'other';
            }
          });
        }
      },
      error: () =>
        this.toast.error('ไม่สามารถดึงข้อมูลโปรไฟล์ได้', {
          title: 'โหลดข้อมูลล้มเหลว',
        }),
    });
  }

  private populateFromProfile(p: ProfileDto): void {
    this.form.patchValue({
      privateProfile: p.privateProfile,
      profileIsCompany: p.profileIsCompany,
      firstName: p.firstName,
      lastName: p.lastName,
      pronouns: p.pronouns ?? '',
      title: p.title,
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
    });

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

  selectDept(departmentId: number) {
    const ctrl = this.creditForm.controls.deptId;
    const current = ctrl.value;

    // ถ้ากดอันเดิมซ้ำ → เคลียร์
    if (current === departmentId) {
      ctrl.setValue(null);
      this.filteredPositions = [];
      this.filteredSkills = [];
      this.creditForm.patchValue(
        { posId: null, skillIds: [] },
        { emitEvent: false }
      );
    } else {
      // เปลี่ยนเป็น department ใหม่
      ctrl.setValue(departmentId);
      // ตรงนี้ไม่ต้องทำอะไรเพิ่ม เพราะ valueChanges(deptId) ข้างบนจะจัดการ filter ให้
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
  // ---------- Credit popup handlers ----------
  addCredit() {
    // กด + New Credit = สร้างใหม่ ไม่ใช่แก้ของเก่า
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

    this.filteredPositions = [];
    this.filteredSkills = [];

    this.creditModalOpen = true;
  }

  editCredit(index: number) {
    const c = this.credits[index];
    if (!c) return;

    this.editingCreditIndex = index;

    const deptId = c.deptIds?.[0] ?? null;
    const posId = c.posIds?.[0] ?? null;

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
      deptId,
      posId,
      skillIds: [...(c.skillIds ?? [])],
    }, { emitEvent: false });

    if (deptId) {
      this.filteredPositions = this.positionsApi.filter((p: any) => p.departmentId === deptId);
    } else {
      this.filteredPositions = [];
    }

    if (posId) {
      this.filteredSkills = this.skillsApi.filter((s: any) => s.positionId === posId);
    } else {
      this.filteredSkills = [];
    }

    this.creditModalOpen = true;
  }

  closeCreditModal() {
    this.creditModalOpen = false;
  }

  saveCreditFromModal() {
    console.log('[credit] saveCreditFromModal clicked');

    if (this.creditForm.invalid) {
      this.creditForm.markAllAsTouched();
      this.toast.warning('กรุณากรอกข้อมูลเครดิตให้ครบก่อนบันทึก', {
        title: 'ข้อมูลเครดิตไม่ครบ',
      });
      console.warn('[credit] creditForm invalid', this.creditForm.value);
      return;
    }

    const v = this.creditForm.getRawValue();

    const credit: ProfileCredit = {
      company: v.company!,
      title: v.title!,
      startYear: v.startYear!,
      endYear: v.endYear || null,
      current: !!v.current,
      venue: v.venue!,
      jobLocation: v.jobLocation!,
      internship: !!v.internship,
      fellowship: !!v.fellowship,
      deptIds: v.deptId ? [v.deptId] : [],
      posIds: v.posId ? [v.posId] : [],
      skillIds: v.skillIds ?? [],
    };

    if (this.editingCreditIndex !== null) {
      // แก้ไขรายการเดิม
      this.credits[this.editingCreditIndex] = credit;
      console.log('[credit] updated credit at', this.editingCreditIndex, credit);
    } else {
      // เพิ่มใหม่
      this.credits.push(credit);
      console.log('[credit] created new credit', credit);
    }

    this.editingCreditIndex = null;
    this.closeCreditModal();
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
    if (!ok.includes(file.type)) {
      this.toast.warning('รองรับเฉพาะ JPG, PNG, WEBP');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      this.toast.warning('ไฟล์มีขนาดใหญ่มาก อาจใช้เวลาประมวลผลนาน');
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
        this.toast.success('ลบรูปเรียบร้อย');
      },
      error: () => this.toast.error('ลบรูปไม่สำเร็จ'),
    });
  }

  addConflict() {
    this.toast.warning('หน้าต่างเพิ่มวันที่ติดภารกิจกำลังพัฒนา', { title: 'Coming soon' });
  }

  toggleWorkLocation(v: number) { this.toggleSet(this.selectedWorkLocations, v); }
  toggleUnion(v: number) { this.toggleSet(this.selectedUnions, v); }
  toggleExp(v: number) { this.toggleSet(this.selectedExp, v); }
  togglePartner(v: number) { this.toggleSet(this.selectedPartners, v); }
  toggleGender(v: number) { this.toggleSet(this.selectedGenders, v); }
  toggleRace(v: number) { this.toggleSet(this.selectedRaces, v); }
  toggleAdd(v: number) { this.toggleSet(this.selectedAdds, v); }

  private toggleSet(set: Set<number>, v: number) {
    set.has(v) ? set.delete(v) : set.add(v);
  }

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

  /** ---------- Save ---------- */
  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('กรุณากรอกข้อมูลให้ครบถ้วน', { title: 'ข้อมูลไม่ครบ' });
      return;
    }

    const base = this.form.getRawValue();
    const payload: ProfilePayload = {
      ...(this.currentProfile && !this.isNewProfile
        ? { id: this.currentProfile.id, userId: this.currentProfile.userId }
        : {}),
      privateProfile: !!base.privateProfile,
      profileIsCompany: !!base.profileIsCompany,
      firstName: base.firstName!,
      lastName: base.lastName!,
      pronouns: base.pronouns ?? '',
      title: base.title!,
      location: base.location ?? '',
      email: base.email ?? '',
      phone: base.phone ?? '',
      website: base.website ?? '',
      linkedin: base.linkedin ?? '',
      facebook: base.facebook ?? '',
      instagram: base.instagram ?? '',
      twitter: base.twitter ?? '',
      multiLang: !!base.multiLang,
      travel: base.travel ?? false,
      tour: base.tour ?? false,
      about: base.about ?? '',
      education: base.education ?? '',
      video1: base.video1 ?? '',
      video2: base.video2 ?? '',
      workLocations: Array.from(this.selectedWorkLocations),
      unions: Array.from(this.selectedUnions),
      experience: Array.from(this.selectedExp),
      partners: Array.from(this.selectedPartners),
      genders: Array.from(this.selectedGenders),
      races: Array.from(this.selectedRaces),
      additionals: Array.from(this.selectedAdds),
      credits: this.credits,
    };

    let uploadFile: File | null = null;
    if (this.avatarFile) {
      try {
        const targetMime: 'image/webp' | 'image/jpeg' = 'image/webp';
        uploadFile = await this.compressImage(this.avatarFile, {
          maxW: 1200,
          maxH: 1200,
          quality: 0.8,
          mime: targetMime,
        });
      } catch (err) {
        console.error('Compress avatar failed', err);
        this.toast.warning('บีบอัดรูปไม่สำเร็จ จะอัปโหลดรูปต้นฉบับแทน');
        uploadFile = this.avatarFile;
      }
    }

    const isMultipart = !!uploadFile;
    const req$ = this.isNewProfile
      ? (isMultipart
        ? this.profileService.saveProfileMultipart(payload, uploadFile!)
        : this.profileService.saveProfile(payload))
      : (this.currentProfile
        ? (isMultipart
          ? this.profileService.updateProfileMultipart(payload, uploadFile!)
          : this.profileService.updateProfile(payload))
        : (isMultipart
          ? this.profileService.saveProfileMultipart(payload, uploadFile!)
          : this.profileService.saveProfile(payload)));

    req$.subscribe({
      next: async (res: ProfileDto & { avatarUrl?: string }) => {
        this.currentProfile = res as ProfileDto;

        if (res.avatarUrl) {
          this.serverAvatarUrl = res.avatarUrl;
          this.avatarPreviewUrl = null;
        }
        this.avatarFile = null;

        try {
          if (this.resumeFile) {
            await this.profileService.uploadResume(this.resumeFile).toPromise();
          }

          const perfFiles = this.images.filter((f): f is File => !!f);
          if (perfFiles.length) {
            await this.profileService.uploadPerformances(perfFiles).toPromise();
          }
        } catch (e) {
          console.error('Upload resume/performance failed', e);
          this.toast.warning('บันทึกข้อมูลหลักสำเร็จ แต่ไฟล์บางส่วนอัปโหลดไม่สำเร็จ');
        }

        this.toast.success('บันทึกข้อมูลสำเร็จ 🎉', {
          title: 'Saved',
          duration: 3000,
          onTimeout: () => this.router.navigate(['en/directory/profile']),
        });
      },
      error: (err) => {
        console.error('Save profile failed', err);
        const msg = err?.error?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
        this.toast.error(msg, { title: 'เกิดข้อผิดพลาด' });
      }
    });
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

    const ok = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!ok.includes(file.type)) {
      this.toast.warning('รองรับเฉพาะ PDF, JPG, PNG, WEBP');
      input.value = '';
      return;
    }

    const maxBytes = this.MAX_RESUME_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      this.toast.warning(`ไฟล์ต้องไม่เกิน ${this.MAX_RESUME_SIZE_MB}MB`);
      input.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.toast.info('ไฟล์ค่อนข้างใหญ่ อาจใช้เวลาในการพรีวิว/อัปโหลด');
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
    if (!ok.includes(file.type)) {
      this.toast.warning('รองรับเฉพาะ JPG, PNG, WEBP');
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
    if (this.imagePreviewUrls[i]?.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreviewUrls[i]!);
    }
    this.imagePreviewUrls[i] = null;
    this.images[i] = null;
  }
}
