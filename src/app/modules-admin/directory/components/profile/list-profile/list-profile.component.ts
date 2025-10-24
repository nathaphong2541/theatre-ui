import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { VideoGalleryComponent } from '../video-gallery/video-gallery.component';
import { Router } from '@angular/router';

type Tag = { label: string; icon?: string };
type Link = { type: 'email' | 'phone' | 'link'; label: string; value: string; href: string; icon: string };


@Component({
  selector: '[list-profile]',
  imports: [
    CommonModule,
    AngularSvgIconModule,
    VideoGalleryComponent
  ],
  templateUrl: './list-profile.component.html',
  styleUrl: './list-profile.component.css'
})
export class ListProfileComponent implements OnInit {

  coverUrl = signal<string>('assets/images/profile-cover.jpg'); // ใส่รูปปกของแบรนด์
  avatarUrl = signal<string | null>(null); // ถ้ายังไม่มีรูป จะโชว์ placeholder
  displayName = signal<string>('nathaphong thongkhamrod');
  headline = signal<string>('programmer based in Thailand');
  location = signal<string>('Texas/Southwest');
  tags = signal<Tag[]>([
    { label: 'Will Travel' },
    { label: 'Will Tour' },
  ]);

  links = signal<Link[]>([
    { type: 'email', label: 'Email nathaphong', value: 'dev@yourmail.com', href: 'mailto:dev@yourmail.com', icon: 'heroicons/outline/envelope.svg' },
    { type: 'phone', label: '0800-790345', value: '0800790345', href: 'tel:0800790345', icon: 'heroicons/outline/phone.svg' },
    { type: 'link', label: 'Portfolio', value: 'https://yourportfolio.com', href: 'https://yourportfolio.com', icon: 'heroicons/outline/link.svg' },
  ]);

  // ---- UI state ----
  isEditing = signal<boolean>(false);
  hasAvatar = computed(() => !!this.avatarUrl());

  constructor(private router: Router) { }

  ngOnInit() {
    // โหลดข้อมูลโปรไฟล์จาก API หรือ service อื่น ๆ
  }

  onUploadAvatar(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    // demo preview
    const reader = new FileReader();
    reader.onload = () => this.avatarUrl.set(reader.result as string);
    reader.readAsDataURL(f);
  }

  editProfile() {
    this.router.navigate(['/admin/directory/profile/123']); // เปลี่ยน 123 เป็นไอดีจริง
  }

}
