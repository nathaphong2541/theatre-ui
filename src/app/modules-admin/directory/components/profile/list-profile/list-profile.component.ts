import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { VideoGalleryComponent } from '../video-gallery/video-gallery.component';
import { Router } from '@angular/router';
import { ProfileService } from '../../../service/profile.service';
import { environment } from 'src/environments/environment';

type Tag = { label: string; icon?: string };
type Link = { type: 'email' | 'phone' | 'link'; label: string; value: string; href: string; icon: string };

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
  avatarUrl?: string | null;
  coverUrl?: string | null;
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
  displayName = signal<string>('');      // first + last
  about = signal<string>('');            // about
  headline = signal<string>('');         // title
  location = signal<string>('');         // location

  // UI badges/links
  tags = signal<Tag[]>([]);
  links = signal<Link[]>([]);

  // control
  userId: number | null = null;
  isEditing = signal<boolean>(false);
  isLoading = signal<boolean>(true);
  isError = signal<boolean>(false);

  hasAvatar = computed(() => !!this.avatarUrl());

  constructor(
    private router: Router,
    private profile: ProfileService
  ) { }

  ngOnInit() {
    this.isLoading.set(true);

    this.profile.getProfile().subscribe({
      next: (p: any) => {
        const first = (p?.firstName ?? '').trim();
        const last = (p?.lastName ?? '').trim();

        // ✅ ชื่อ + ตำแหน่ง
        this.displayName.set([first, last].filter(Boolean).join(' '));
        this.headline.set(p?.title || '');
        this.location.set(p?.location || '');
        this.about.set(p?.about || '');
        this.userId = p?.userId ?? null;

        // ✅ Avatar / Cover
        this.avatarUrl.set(this.toAbsolute(p?.avatarUrl) || null);
        if (p?.coverUrl) {
          this.coverUrl.set(this.toAbsolute(p.coverUrl)!);
        }

        this.isLoading.set(false);
        this.isError.set(false);
        if (p?.coverUrl) this.coverUrl.set(this.toAbsolute(p.coverUrl)!);

        // ✅ Tags
        const tags: Tag[] = [];
        if (p?.multiLang)
          tags.push({
            label: 'Multi-Language',
            icon: 'assets/icons/heroicons/outline/globe-alt.svg',
          });
        if (p?.travel)
          tags.push({
            label: 'Will Travel',
            icon: 'assets/icons/heroicons/outline/map-pin.svg',
          });
        if (p?.tour)
          tags.push({
            label: 'Will Tour',
            icon: 'assets/icons/heroicons/outline/video-camera.svg',
          });
        if (p?.privateProfile)
          tags.push({
            label: 'Private',
            icon: 'assets/icons/heroicons/outline/lock-closed.svg',
          });
        this.tags.set(tags);

        // ✅ Contact Links
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
            href: p.website.startsWith('http')
              ? p.website
              : 'https://' + p.website,
            icon: 'assets/icons/heroicons/outline/link.svg',
          });
        }
        this.links.set(links);

        // ✅ set video sources จาก API (ตัดค่าว่าง/undefined ออก)
        this.videoSources.set(
          [p?.video1, p?.video2].filter((x): x is string => !!x && x.trim().length > 0)
        );

        this.isLoading.set(false);
        this.isError.set(false);
      },
      error: (err) => {
        console.error('getProfile failed', err);
        this.displayName.set('—');
        this.headline.set('');
        this.location.set('');
        this.about.set('');
        this.tags.set([]);
        this.links.set([]);
        this.isLoading.set(false);
        this.isError.set(true);
      },
    });
  }

  toAbsolute(url?: string | null): string | null {
    if (!url) return null;
    // ถ้า backend ส่งมาเป็น http(s) แล้ว ก็ใช้ได้เลย
    if (/^https?:\/\//i.test(url)) return url;
    // ตัด /api ออก แล้วต่อกับ path เช่น /files/profile/xxx.jpg
    const apiBase = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${apiBase}${url.startsWith('/') ? url : '/' + url}`;
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
