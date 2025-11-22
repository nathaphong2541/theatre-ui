import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { VideoGalleryComponent } from '../video-gallery/video-gallery.component';
import { Router } from '@angular/router';
import { ProfileService } from '../../../service/profile.service';
import { environment } from 'src/environments/environment';

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

  constructor(
    private router: Router,
    private profileService: ProfileService,
  ) { }

  ngOnInit() {
    this.isLoading.set(true);

    this.profileService.getProfile().subscribe({
      next: (p: ProfileDto | any) => {
        const first = (p?.firstName ?? '').trim();
        const last = (p?.lastName ?? '').trim();

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
            value: p.website,
            href: this.normalizeUrl(p.website),
            icon: 'assets/icons/heroicons/outline/link.svg',
          });
        }

        if (p?.linkedin) {
          links.push({
            type: 'link',
            label: 'LinkedIn',
            value: p.linkedin,
            href: this.normalizeUrl(p.linkedin),
            icon: 'assets/icons/social/linkedin.svg',
          });
        }

        if (p?.facebook) {
          links.push({
            type: 'link',
            label: 'Facebook',
            value: p.facebook,
            href: this.normalizeUrl(p.facebook),
            icon: 'assets/icons/social/facebook.svg',
          });
        }

        if (p?.instagram) {
          links.push({
            type: 'link',
            label: 'Instagram',
            value: p.instagram,
            href: this.normalizeUrl(p.instagram),
            icon: 'assets/icons/social/instagram.svg',
          });
        }

        if (p?.twitter) {
          links.push({
            type: 'link',
            label: 'Twitter / X',
            value: p.twitter,
            href: this.normalizeUrl(p.twitter),
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
    if (!this.userId) {
      this.router.navigate(['/en/directory/profile-new/']);
    } else {
      this.router.navigate(['/en/directory/profile/', this.userId]);
    }
  }
}
