import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { ProfileService } from '../../../service/profile.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { Router } from '@angular/router';

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

  constructor(
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private profileService: ProfileService,
    private toast: ToastService,
    private router: Router,
  ) { }

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

  // Option lists
  workLocations: Labeled[] = [
    { label: 'Atlanta/Southeast', value: 1 },
    { label: 'Boston/New England', value: 2 },
    { label: 'Carolinas', value: 3 },
    { label: 'Chicago/Midwest', value: 4 },
    { label: 'D.C./Baltimore/Mid-Atlantic', value: 5 },
    { label: 'Denver/West', value: 6 },
    { label: 'LA/Southern California', value: 7 },
    { label: 'Nashville Area', value: 8 },
    { label: 'NYC/Tri-State Area', value: 9 },
    { label: 'San Francisco/Northern California', value: 10 },
    { label: 'Seattle/Pacific NW', value: 11 },
    { label: 'Texas/Southwest', value: 12 },
    { label: 'Upstate NY', value: 13 },
    { label: 'Regional', value: 14 },
    { label: 'Touring', value: 15 },
    { label: 'TV/Film', value: 16 },
  ];

  unions: Labeled[] = [
    { label: 'Actors Equity Association (AEA)', value: 1 },
    { label: 'American Federation of Musicians (AFM)', value: 2 },
    { label: 'American Guild of Musical Artists (AGMA)', value: 3 },
    { label: 'American Guild of Variety Artist (AGVA)', value: 4 },
    { label: 'Association of Theatrical Press Agents & Managers (ATPAM)', value: 5 },
    { label: 'Casting Society of America (CSA)', value: 6 },
    { label: 'Dramatists Guild of America (DG)', value: 7 },
    { label: 'International Union of Operating Engineers (IUOE)', value: 8 },
    { label: 'Society of American Fight Directors (SAFD)', value: 9 },
    { label: 'Stage Directors and Choreographers Society (SDC)', value: 10 },
    { label: 'United Scenic Artists (USA)', value: 11 },
    { label: 'IATSE', value: 12 },
  ];

  experienceLevels: Labeled[] = [
    { label: 'Broadway', value: 1 },
    { label: 'Community Theatre', value: 2 },
    { label: 'Educational', value: 3 },
    { label: 'Fellowship', value: 4 },
    { label: 'Internship', value: 5 },
    { label: 'Off Broadway', value: 6 },
    { label: 'Off Off Broadway', value: 7 },
    { label: 'Regional', value: 8 },
    { label: 'Touring', value: 9 },
    { label: 'TV/Film', value: 10 },
  ];

  partnerDirectories: Labeled[] = [
    { label: 'BIPOC Arts', value: 1 },
    { label: 'Design Action', value: 2 },
    { label: 'Maestra Music', value: 3 },
    { label: 'MUSE', value: 4 },
    { label: 'Parity Productions', value: 5 },
    { label: 'Ring of Keys', value: 6 },
  ];

  genders: Labeled[] = [
    { label: 'Cisgender', value: 1 },
    { label: 'Female identifying', value: 2 },
    { label: 'Gender nonconforming', value: 3 },
    { label: 'Male identifying', value: 4 },
    { label: 'Nonbinary', value: 5 },
    { label: 'Transgender', value: 6 },
  ];

  races: Labeled[] = [
    { label: 'AAPI (Asian American Pacific Islander)', value: 1 },
    { label: 'Black or African American', value: 2 },
    { label: 'Hispanic or Latine/Latinx', value: 3 },
    { label: 'Indigenous/Native American', value: 4 },
    { label: 'MENA (Middle Eastern or North African)', value: 5 },
    { label: 'White or Caucasian', value: 6 },
  ];

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
    this.loadProfile();
  }

  /** ---------- Load & map from API ---------- */
  private loadProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (p: ProfileDto) => {
        this.currentProfile = p;
        this.populateFromProfile(p);
      },
      error: (err) => {
        console.error('getProfile failed', err);
        this.currentProfile = null; // ไม่มีโปรไฟล์ => สร้างใหม่
        this.toast.error('ไม่สามารถดึงข้อมูลโปรไฟล์ได้', { title: 'โหลดข้อมูลล้มเหลว' });
      },
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
  onPickAvatar(_e: Event) { }
  onPickResume(_e: Event) { }

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
  save() {
    // ถ้าฟอร์มไม่ผ่าน ให้เตือนด้วย toast และไม่ยิง API
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('กรุณากรอกข้อมูลให้ครบถ้วน', { title: 'ข้อมูลไม่ครบ' });
      return;
    }

    const base = this.form.getRawValue();

    const payload: ProfilePayload = {
      ...(this.currentProfile ? { id: this.currentProfile.id, userId: this.currentProfile.userId } : {}),
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

    const req$ = this.currentProfile
      ? this.profileService.updateProfile(payload)  // PUT /me
      : this.profileService.saveProfile(payload);   // POST /save

    req$.subscribe({
      next: (res: ProfileDto) => {
        this.currentProfile = res;
        this.toast.success('บันทึกข้อมูลสำเร็จ 🎉', {
          title: 'Saved',
          duration: 3000,
          onTimeout: () => this.router.navigate(['/profile']),
        });

      },
      error: (err) => {
        console.error('Save profile failed', err);
        const msg = err?.error?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
        this.toast.error(msg, { title: 'เกิดข้อผิดพลาด' });
      }
    });
  }
}
