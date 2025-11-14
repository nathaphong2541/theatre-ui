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

type Labeled = { label: string; value: number };

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
  credits: number[];
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string; // 👈 เพิ่ม
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
  credits: number[];
};

@Component({
  selector: 'app-handle-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './handle-profile.component.html',
  styleUrl: './handle-profile.component.css'
})
export class HandleProfileComponent implements OnInit {

  // ==== เพิ่ม: จัดการ avatar ====
  avatarFile: File | null = null;
  avatarPreviewUrl: string | null = null; // ใช้โชว์ preview (object URL หรือจาก server)
  private serverAvatarUrl: string | null = null;

  // === resume preview state ===
  resumeFile: File | null = null;
  resumePreviewUrl: string | null = null;       // ใช้กับ <img> และลิงก์ดาวน์โหลด
  resumeSafeUrl: SafeResourceUrl | null = null; // ใช้ฝัง <iframe> สำหรับ PDF
  resumeIsPdf = false;

  // ===== Images (gallery) state =====
  images: (File | null)[] = Array(6).fill(null);
  imagePreviewUrls: (string | null)[] = Array(6).fill(null);

  get avatarSrc(): string | null {
    return this.avatarPreviewUrl ?? this.serverAvatarUrl ?? null;
  }

  workLocations: Labeled[] = [];
  unions: Labeled[] = [];
  experienceLevels: Labeled[] = [];
  partnerDirectories: Labeled[] = [];
  genders: Labeled[] = [];
  races: Labeled[] = [];
  // additionals: Labeled[] = [];

  constructor(
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private profileService: ProfileService,
    private toast: ToastService,
    private router: Router,
    private publicService: PubilcService,
  ) { }


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
        // เลือก label เป็น EN (หรือใช้ TH ก็ได้แล้วแต่ว่าหน้านี้เป็นภาษาอะไร)
        this.workLocations = res.workLocations.items.map((x: { nameEn: any; id: any; }) => ({
          label: x.nameEn,  // หรือ x.nameTh
          value: x.id,
        }));

        this.unions = res.unions.items.map((x: { nameEn: any; id: any; }) => ({
          label: x.nameEn,
          value: x.id,
        }));

        this.experienceLevels = res.experienceLevels.items.map((x: { nameEn: any; id: any; }) => ({
          label: x.nameEn,
          value: x.id,
        }));

        this.partnerDirectories = res.partnerDirectories.items.map((x: { nameEn: any; id: any; }) => ({
          label: x.nameEn,
          value: x.id,
        }));

        this.races = res.races.items.map((x: { nameEn: any; id: any; }) => ({
          label: x.nameEn,
          value: x.id,
        }));

        this.genders = res.genders.items.map((x: { nameEn: any; id: any; }) => ({
          label: x.nameEn,
          value: x.id,
        }));
      },
      error: (err) => {
        console.error('Load master data failed', err);
        this.toast.error('ไม่สามารถโหลดข้อมูลตัวเลือกได้', { title: 'โหลดข้อมูลล้มเหลว' });
      }
    });
  }
  /** ใช้บอกว่าหน้านี้คือหน้า "สร้างโปรไฟล์ใหม่" หรือไม่ */
  private isNewProfile = false;

  /** เก็บโปรไฟล์ปัจจุบันไว้ใช้ตัดสินใจ POST/PUT */
  private currentProfile: ProfileDto | null = null;

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
    // โซเชียลเก็บไว้ใช้ใน UI
    facebook: new FormControl<string>(''),
    instagram: new FormControl<string>(''),
    twitter: new FormControl<string>(''),
    tiktok: new FormControl<string>(''),
    linkedin: new FormControl<string>(''),
  });

  additionals: Labeled[] = [
    { label: 'Disabled', value: 1 },
    { label: 'LGBTQIA+', value: 2 },
    { label: 'Neurodiverse', value: 3 },
  ];

  // selections เป็น number ให้ตรงกับ API
  selectedWorkLocations = new Set<number>();
  selectedUnions = new Set<number>();
  selectedExp = new Set<number>();
  selectedPartners = new Set<number>();
  selectedGenders = new Set<number>();
  selectedRaces = new Set<number>();
  selectedAdds = new Set<number>();

  // API ส่งเป็น number[]
  credits: number[] = [];

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
  }

  /** ---------- Load & map from API ---------- */
  private loadProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (p: ProfileDto) => {
        this.currentProfile = p;
        this.populateFromProfile(p);

        // ✅ สร้าง URL เต็มจาก avatarUrl
        if (p.avatarUrl) {
          // ถ้า backend ส่ง path เริ่มด้วย /files/... ให้ต่อ base จาก environment
          const apiBase = environment.apiUrl.replace(/\/api\/?$/, ''); // ตัด /api ออก
          this.serverAvatarUrl = p.avatarUrl.startsWith('http')
            ? p.avatarUrl
            : `${apiBase}${p.avatarUrl}`;
        } else {
          this.serverAvatarUrl = null;
        }
      },
      error: () => this.toast.error('ไม่สามารถดึงข้อมูลโปรไฟล์ได้', { title: 'โหลดข้อมูลล้มเหลว' }),
    });
  }

  private populateFromProfile(p: ProfileDto): void {
    // patch ฟอร์มหลัก
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
      multiLang: p.multiLang,
      travel: p.travel,
      tour: p.tour,
      about: p.about,
      education: p.education,
      video1: p.video1,
      video2: p.video2,
    });

    // map array → Set<number>
    this.selectedWorkLocations = new Set(p.workLocations ?? []);
    this.selectedUnions = new Set(p.unions ?? []);
    this.selectedExp = new Set(p.experience ?? []);
    this.selectedPartners = new Set(p.partners ?? []);
    this.selectedGenders = new Set(p.genders ?? []);
    this.selectedRaces = new Set(p.races ?? []);
    this.selectedAdds = new Set(p.additionals ?? []);
    this.credits = [...(p.credits ?? [])];

    // อัปเดตตัวอย่างวิดีโอ
    this.updateEmbed(1);
    this.updateEmbed(2);
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

    // ไม่ block แต่เตือนถ้าไฟล์ใหญ่มาก (เช่น > 20MB)
    if (file.size > 20 * 1024 * 1024) {
      this.toast.warning('ไฟล์มีขนาดใหญ่มาก อาจใช้เวลาประมวลผลนาน');
    }

    if (this.avatarPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(this.avatarPreviewUrl);
    this.avatarPreviewUrl = URL.createObjectURL(file);
    this.avatarFile = file; // เก็บไฟล์ต้นฉบับไว้ (full-res) แล้วค่อยบีบอัดตอน Save
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

    // คำนวณสเกลให้พอดีกับกรอบ maxW x maxH
    const ratio = Math.min(maxW / w, maxH / h, 1); // ไม่ขยายเกินต้นฉบับ
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

    // ตั้งชื่อไฟล์ใหม่ให้สอดคล้องชนิด
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
        this.serverAvatarUrl = res?.avatarUrl || null; // ส่วนใหญ่จะเป็น null หลังลบ
        this.toast.success('ลบรูปเรียบร้อย');
      },
      error: () => this.toast.error('ลบรูปไม่สำเร็จ'),
    });
  }

  addConflict() {
    this.toast.warning('หน้าต่างเพิ่มวันที่ติดภารกิจกำลังพัฒนา', { title: 'Coming soon' });
  }

  addCredit() { this.credits.push(Date.now()); }
  removeCredit(i: number) { this.credits.splice(i, 1); }

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

  /** ---------- Save payload กลับไปหา API ---------- */
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

    // ✅ ถ้ามีรูป → บีบอัดก่อนอัปโหลด
    let uploadFile: File | null = null;
    if (this.avatarFile) {
      try {
        // เลือกชนิดไฟล์ปลายทางตามที่ backend รองรับ
        const targetMime: 'image/webp' | 'image/jpeg' = 'image/webp'; // เปลี่ยนเป็น 'image/jpeg' ถ้าจำเป็น
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
        ? this.profileService.saveProfileMultipart(payload, uploadFile!)  // POST multipart
        : this.profileService.saveProfile(payload))                        // POST json
      : (this.currentProfile
        ? (isMultipart
          ? this.profileService.updateProfileMultipart(payload, uploadFile!) // PUT multipart
          : this.profileService.updateProfile(payload))                      // PUT json
        : (isMultipart
          ? this.profileService.saveProfileMultipart(payload, uploadFile!)   // POST multipart
          : this.profileService.saveProfile(payload)));                      // POST json

    req$.subscribe({
      next: (res: ProfileDto & { avatarUrl?: string }) => {
        this.currentProfile = res as ProfileDto;

        // ถ้า backend คืน URL ใหม่มา ใช้แสดงต่อทันที
        if ((res as any).avatarUrl) {
          // แนะนำให้ map เป็น URL เต็มแบบที่คุณทำใน loadProfile() (ต่อ base url)
          this.avatarPreviewUrl = (res as any).avatarUrl!;
        }
        this.avatarFile = null;

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

  // ทำลาย objectURL ทั้งหมดตอนทำลาย component
  ngOnDestroy(): void {
    if (this.avatarPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(this.avatarPreviewUrl);
    this.revokeResumeUrl();
    this.imagePreviewUrls.forEach(u => { if (u?.startsWith('blob:')) URL.revokeObjectURL(u); });
  }

  // กำหนดคงที่ไว้บนสุดของคลาส (อ่านง่าย/แก้ทีหลังสะดวก)
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

    // ✅ อัปเดตเป็น 50MB
    const maxBytes = this.MAX_RESUME_SIZE_MB * 1024 * 1024; // 50 * 1024 * 1024
    if (file.size > maxBytes) {
      this.toast.warning(`ไฟล์ต้องไม่เกิน ${this.MAX_RESUME_SIZE_MB}MB`);
      input.value = '';
      return;
    }

    // (ทางเลือก) เตือนถ้าไฟล์ใหญ่มาก เช่น > 10MB
    if (file.size > 10 * 1024 * 1024) {
      this.toast.info('ไฟล์ค่อนข้างใหญ่ อาจใช้เวลาในการพรีวิว/อัปโหลด');
    }

    // ล้าง URL เก่า
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

  // เรียกเมื่อเลือกไฟล์ในช่องที่ i
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

    // ✅ ไม่จำกัดขนาดไฟล์ ณ ตอนเลือก (จะบีบอัดตอน save)
    // ล้าง URL เก่าเพื่อไม่ให้ memory leak
    const old = this.imagePreviewUrls[i];
    if (old?.startsWith('blob:')) URL.revokeObjectURL(old);

    const objectUrl = URL.createObjectURL(file);
    this.images[i] = file;
    this.imagePreviewUrls[i] = objectUrl;

    // เคลียร์ค่า input เพื่อให้เลือกไฟล์เดิมซ้ำได้
    input.value = '';
  }

  // ลบไฟล์ที่ช่อง i
  removeImage(i: number) {
    if (this.imagePreviewUrls[i]?.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreviewUrls[i]!);
    }
    this.imagePreviewUrls[i] = null;
    this.images[i] = null;
  }


}
