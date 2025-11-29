// src/app/modules-admin/directory/components/drama/handle-drama/handle-drama.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DramaService } from '../../../pages/drama/service/drama.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-handle-drama',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './handle-drama.component.html',
})
export class HandleDramaComponent {
  form: FormGroup;
  isSubmitting = false;
  error: string | null = null;

  files: File[] = [];
  previewUrls: string[] = [];
  pdfFile: File | null = null;
  pdfPreviewUrl: SafeResourceUrl | null = null; // iframe ใช้ตัวนี้
  pdfPreviewSrc: string | null = null;         // window.open ใช้ตัวนี้

  readonly maxImages = 5;

  constructor(
    private fb: FormBuilder,
    private dramaService: DramaService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(5000)]],
      tags: [''],
    });
  }

  get titleCtrl() {
    return this.form.get('title');
  }
  get descriptionCtrl() {
    return this.form.get('description');
  }
  get tagsCtrl() {
    return this.form.get('tags');
  }

  // ---------- helper lang ----------
  private getLangPrefix(): string | null {
    const url = this.router.url;
    const segments = url.split('/').filter(Boolean);
    const first = segments[0];
    const supportedLangs = ['th', 'en'];
    return supportedLangs.includes(first) ? first : null;
  }

  private navigateToList() {
    const lang = this.getLangPrefix();
    const base: any[] = [];
    if (lang) base.push('/', lang, 'directory');
    else base.push('/directory');
    this.router.navigate([...base, 'script', 'list']);
  }

  // ---------- image ----------
  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const selected = Array.from(input.files);
    if (this.files.length + selected.length > this.maxImages) {
      const slot = this.maxImages - this.files.length;
      if (slot <= 0) {
        this.error = `อัปโหลดรูปได้ไม่เกิน ${this.maxImages} รูป`;
        input.value = '';
        return;
      }
      this.error = `เลือกรูปได้ไม่เกิน ${this.maxImages} รูป (จะใช้เฉพาะ ${slot} รูปแรกจากที่เลือกเพิ่ม)`;
      selected.splice(slot);
    }

    selected.forEach(file => {
      this.files.push(file);
      const reader = new FileReader();
      reader.onload = () => this.previewUrls.push(reader.result as string);
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  // ---------- PDF ----------
  onPdfChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.type !== 'application/pdf') {
      this.error = 'รองรับเฉพาะไฟล์ PDF เท่านั้น';
      input.value = '';
      return;
    }

    // ถ้ามี blob เดิมอยู่แล้ว ให้ revoke ก่อน
    if (this.pdfPreviewSrc) {
      URL.revokeObjectURL(this.pdfPreviewSrc);
    }

    this.pdfFile = file;

    const blobUrl = URL.createObjectURL(file);
    this.pdfPreviewSrc = blobUrl;
    this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);

    input.value = '';
  }

  // เปิด PDF เต็มหน้าต่างใหม่
  openPdfFullScreen() {
    if (!this.pdfPreviewSrc) return;
    window.open(this.pdfPreviewSrc, '_blank');
  }

  // ลบไฟล์ PDF ที่เลือก
  removePdf() {
    if (this.pdfPreviewSrc) {
      URL.revokeObjectURL(this.pdfPreviewSrc);
    }
    this.pdfPreviewSrc = null;
    this.pdfPreviewUrl = null;
    this.pdfFile = null;
  }

  removeImage(index: number) {
    this.files.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  // ---------- submit ----------
  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.pdfFile) {
      this.error = 'กรุณาอัปโหลดไฟล์บทละคร (PDF) อย่างน้อย 1 ไฟล์';
      return;
    }

    if (this.files.length > this.maxImages) {
      this.error = `อัปโหลดรูปได้ไม่เกิน ${this.maxImages} รูป`;
      return;
    }

    this.error = null;
    this.isSubmitting = true;

    const payload = {
      title: this.form.value.title,
      description: this.form.value.description,
      tags: this.form.value.tags,
    };

    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    this.files.forEach(f => formData.append('images', f));
    formData.append('pdf', this.pdfFile);

    this.dramaService.createDrama(formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.navigateToList();
      },
      error: err => {
        console.error(err);
        this.error = 'อัปโหลดบทละครไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
        this.isSubmitting = false;
      },
    });
  }

  onCancel() {
    this.navigateToList();
  }
}
