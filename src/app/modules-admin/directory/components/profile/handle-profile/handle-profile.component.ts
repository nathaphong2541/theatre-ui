import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
// Helper types
type Labeled = { label: string; value: string };

@Component({
  selector: 'app-handle-profile',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './handle-profile.component.html',
  styleUrl: './handle-profile.component.css'
})
export class HandleProfileComponent implements OnInit {
  form = this.fb.group({
    // Options
    privateProfile: new FormControl(false),
    profileIsCompany: new FormControl(false),

    // Name
    firstName: new FormControl<string>('nathaphong', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl<string>('thongkhamrod', { nonNullable: true, validators: [Validators.required] }),
    pronouns: new FormControl<string>(''),

    // Profession
    title: new FormControl<string>('programmer', { nonNullable: true, validators: [Validators.required, Validators.maxLength(50)] }),
    location: new FormControl<string>('Thailand', { nonNullable: true, validators: [Validators.maxLength(25)] }),

    // Contact
    email: new FormControl<string>('nathaphong2541@gmail.com', { nonNullable: true, validators: [Validators.email] }),
    phone: new FormControl<string>('0800790345'),
    website: new FormControl<string>(''),

    // Flags
    multiLang: new FormControl(false),
    travel: new FormControl<boolean | null>(null),
    tour: new FormControl<boolean | null>(null),

    // About/Education
    about: new FormControl<string>(''),
    education: new FormControl<string>(''),

    // Media URLs
    video1: new FormControl<string>(''),
    video2: new FormControl<string>(''),

    // Social
    facebook: new FormControl<string>(''),
    instagram: new FormControl<string>(''),
    twitter: new FormControl<string>(''),
    tiktok: new FormControl<string>(''),
    linkedin: new FormControl<string>(''),
  });

  // Option lists (trimmed to keep example concise — add more as needed)
  workLocations: Labeled[] = [
    { label: 'Atlanta/Southeast', value: 'atl' },
    { label: 'Boston/New England', value: 'bos' },
    { label: 'Carolinas', value: 'car' },
    { label: 'Chicago/Midwest', value: 'chi' },
    { label: 'D.C./Baltimore/Mid-Atlantic', value: 'dc' },
    { label: 'Denver/West', value: 'den' },
    { label: 'LA/Southern California', value: 'la' },
    { label: 'Nashville Area', value: 'nas' },
    { label: 'NYC/Tri-State Area', value: 'nyc' },
    { label: 'San Francisco/Northern California', value: 'sf' },
    { label: 'Seattle/Pacific NW', value: 'sea' },
    { label: 'Texas/Southwest', value: 'tx' },
    { label: 'Upstate NY', value: 'uny' },
    { label: 'Regional', value: 'regional' },
    { label: 'Touring', value: 'touring' },
    { label: 'TV/Film', value: 'tv' },
  ];
  unions: Labeled[] = [
    { label: 'Actors Equity Association (AEA)', value: 'aea' },
    { label: 'American Federation of Musicians (AFM)', value: 'afm' },
    { label: 'American Guild of Musical Artists (AGMA)', value: 'agma' },
    { label: 'American Guild of Variety Artist (AGVA)', value: 'agva' },
    { label: 'Association of Theatrical Press Agents & Managers (ATPAM)', value: 'atpam' },
    { label: 'Casting Society of America (CSA)', value: 'csa' },
    { label: 'Dramatists Guild of America (DG)', value: 'dg' },
    { label: 'International Union of Operating Engineers (IUOE)', value: 'iuoe' },
    { label: 'Society of American Fight Directors (SAFD)', value: 'safd' },
    { label: 'Stage Directors and Choreographers Society (SDC)', value: 'sdc' },
    { label: 'United Scenic Artists (USA)', value: 'usa' },
    { label: 'IATSE', value: 'iatse' },
  ];
  experienceLevels: Labeled[] = [
    { label: 'Broadway', value: 'bway' },
    { label: 'Community Theatre', value: 'comm' },
    { label: 'Educational', value: 'edu' },
    { label: 'Fellowship', value: 'fell' },
    { label: 'Internship', value: 'intern' },
    { label: 'Off Broadway', value: 'offb' },
    { label: 'Off Off Broadway', value: 'ooffb' },
    { label: 'Regional', value: 'regional' },
    { label: 'Touring', value: 'touring' },
    { label: 'TV/Film', value: 'tv' },
  ];
  partnerDirectories: Labeled[] = [
    { label: 'BIPOC Arts', value: 'bipoc' },
    { label: 'Design Action', value: 'design' },
    { label: 'Maestra Music', value: 'maestra' },
    { label: 'MUSE', value: 'muse' },
    { label: 'Parity Productions', value: 'parity' },
    { label: 'Ring of Keys', value: 'rok' },
  ];
  genders: Labeled[] = [
    { label: 'Cisgender', value: 'cis' },
    { label: 'Female identifying', value: 'fem' },
    { label: 'Gender nonconforming', value: 'gnc' },
    { label: 'Male identifying', value: 'male' },
    { label: 'Nonbinary', value: 'nb' },
    { label: 'Transgender', value: 'trans' },
  ];
  races: Labeled[] = [
    { label: 'AAPI (Asian American Pacific Islander)', value: 'aapi' },
    { label: 'Black or African American', value: 'black' },
    { label: 'Hispanic or Latine/Latinx', value: 'latinx' },
    { label: 'Indigenous/Native American', value: 'native' },
    { label: 'MENA (Middle Eastern or North African)', value: 'mena' },
    { label: 'White or Caucasian', value: 'white' },
  ];
  additionals: Labeled[] = [
    { label: 'Disabled', value: 'disabled' },
    { label: 'LGBTQIA+', value: 'lgbt' },
    { label: 'Neurodiverse', value: 'neuro' },
  ];

  // Selected sets (simulate real binding to a model)
  selectedWorkLocations = new Set<string>(['tx']);
  selectedUnions = new Set<string>();
  selectedExp = new Set<string>();
  selectedPartners = new Set<string>();
  selectedGenders = new Set<string>(['male']);
  selectedRaces = new Set<string>();
  selectedAdds = new Set<string>();

  credits: string[] = [];

  // Embeds
  private _embed1 = signal<SafeResourceUrl | null>(null);
  private _embed2 = signal<SafeResourceUrl | null>(null);
  embed1 = computed(() => this._embed1());
  embed2 = computed(() => this._embed2());

  constructor(private fb: FormBuilder, private sanitizer: DomSanitizer) { }
  ngOnInit(): void { }

  // Actions
  onPickAvatar(_e: Event) { }
  onPickResume(_e: Event) { }

  addConflict() { alert('Add conflict date dialog — to implement'); }

  addCredit() { this.credits.push(`Untitled credit #${this.credits.length + 1}`); }
  removeCredit(i: number) { this.credits.splice(i, 1); }

  toggleWorkLocation(v: string) { this.toggleSet(this.selectedWorkLocations, v); }
  toggleUnion(v: string) { this.toggleSet(this.selectedUnions, v); }
  toggleExp(v: string) { this.toggleSet(this.selectedExp, v); }
  togglePartner(v: string) { this.toggleSet(this.selectedPartners, v); }
  toggleGender(v: string) { this.toggleSet(this.selectedGenders, v); }
  toggleRace(v: string) { this.toggleSet(this.selectedRaces, v); }
  toggleAdd(v: string) { this.toggleSet(this.selectedAdds, v); }

  private toggleSet(set: Set<string>, v: string) { set.has(v) ? set.delete(v) : set.add(v); }

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

  save() {
    const payload = {
      ...this.form.value,
      workLocations: Array.from(this.selectedWorkLocations),
      unions: Array.from(this.selectedUnions),
      experience: Array.from(this.selectedExp),
      partners: Array.from(this.selectedPartners),
      genders: Array.from(this.selectedGenders),
      races: Array.from(this.selectedRaces),
      additionals: Array.from(this.selectedAdds),
      credits: this.credits,
    };
    console.log('SAVE', payload);
    alert('Saved (console.log) — wire to your API');
  }
}
