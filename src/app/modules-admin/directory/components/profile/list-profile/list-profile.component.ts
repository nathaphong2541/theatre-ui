import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { VideoGalleryComponent } from '../video-gallery/video-gallery.component';
import { Router } from '@angular/router';
import { ProfileService } from '../../../service/profile.service';

type Tag = { label: string; icon?: string };
type Link = { type: 'email' | 'phone' | 'link'; label: string; value: string; href: string; icon: string };

@Component({
  selector: '[list-profile]',
  imports: [CommonModule, AngularSvgIconModule, VideoGalleryComponent],
  templateUrl: './list-profile.component.html',
  styleUrl: './list-profile.component.css'
})
export class ListProfileComponent implements OnInit {

  coverUrl = signal<string>('assets/images/profile-cover.jpg');
  avatarUrl = signal<string | null>(null);
  displayName = signal<string>('');
  about = signal<string>('');            // first + last
  headline = signal<string>('');                // title
  location = signal<string>('');                // location
  tags = signal<Tag[]>([]);
  links = signal<Link[]>([]);

  userId: any | null = null;
  // UI
  isEditing = signal<boolean>(false);
  hasAvatar = computed(() => !!this.avatarUrl());

  constructor(
    private router: Router,
    private profile: ProfileService
  ) { }

  ngOnInit() {
    this.profile.getProfile().subscribe({
      next: (p: any) => {
        // ชื่อ/ตำแหน่ง/ที่อยู่
        const first = (p?.firstName ?? '').trim();
        const last = (p?.lastName ?? '').trim();
        this.displayName.set([first, last].filter(Boolean).join(' '));
        this.headline.set(p?.title ?? '');
        this.location.set(p?.location ?? '');

        this.about.set(p?.about ?? '');
        this.userId = p?.userId ?? null;
        // รูป (ถ้ามีฟิลด์จาก backend; ถ้าไม่มีปล่อย null ให้ใช้ placeholder)
        this.avatarUrl.set(p?.avatarUrl ?? null);
        if (p?.coverUrl) this.coverUrl.set(p.coverUrl);

        // Tags จาก flags
        const tags: Tag[] = [];
        if (p?.multiLang) tags.push({ label: 'Multi-Language', icon: 'heroicons/outline/globe-alt.svg' });
        if (p?.travel) tags.push({ label: 'Will Travel', icon: 'heroicons/outline/map-pin.svg' });
        if (p?.tour) tags.push({ label: 'Will Tour', icon: 'heroicons/outline/video-camera.svg' });
        if (p?.privateProfile) tags.push({ label: 'Private' });
        this.tags.set(tags);

        // Contact links
        const links: Link[] = [];
        if (p?.email) {
          links.push({
            type: 'email',
            label: `Email ${first || ''}`.trim() || 'Email',
            value: p.email,
            href: `mailto:${p.email}`,
            icon: ''
          });
        }
        if (p?.phone) {
          const tel = String(p.phone).replace(/\s|-/g, '');
          links.push({
            type: 'phone',
            label: p.phone,
            value: tel,
            href: `tel:${tel}`,
            icon: ''
          });
        }
        if (p?.website) {
          links.push({
            type: 'link',
            label: 'Portfolio',
            value: p.website,
            href: p.website,
            icon: ''
          });
        }
        this.links.set(links);
      },
      error: err => {
        console.error('getProfile failed', err);
        // fallback UI
        this.displayName.set('—');
        this.headline.set('');
        this.location.set('');
        this.tags.set([]);
        this.links.set([]);
      }
    });
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
    this.router.navigate(['/en/directory/profile/', this.userId]);
  }
}
