import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { DramaService } from '../../../pages/drama/service/drama.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { environment } from 'src/environments/environment';
import { Drama } from '../../../pages/drama/models/drama.model';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';

type Mode = 'create' | 'edit' | 'view';

@Component({
  selector: 'app-handle-drama',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ImageCropperComponent],
  templateUrl: './handle-drama.component.html',
})
export class HandleDramaComponent implements OnInit {
  form: FormGroup;
  isSubmitting = false;

  // โหมด + id
  mode: Mode = 'create';
  scriptId: number | null = null;

  // upload state
  files: File[] = [];
  previewUrls: string[] = [];

  // PDF (ใหม่ที่เลือกจาก client)
  pdfFile: File | null = null;

  // PDF (สำหรับ iframe / open full screen)
  pdfPreviewUrl: SafeResourceUrl | null = null;
  pdfPreviewSrc: string | null = null;

  // ชื่อไฟล์ที่แสดง (รองรับทั้งไฟล์ใหม่ + ของเดิมจาก server)
  pdfFileName: string | null = null;

  readonly maxImages = 5;

  // base สำหรับ static files (/uploads/**)
  private fileBase = environment.apiUrl.replace(/\/api\/?$/, '');

  // ===== Crop State (ใช้จริง) =====
  cropOpen = false;
  cropBase64: string | undefined;
  croppedBase64: string | undefined;
  private currentCropFile?: File;

  // ปรับได้: ลดความกว้างหลังครอปเพื่อไม่ให้ไฟล์ใหญ่เกิน
  resizeToWidth = 1400;

  // 0 = อิสระ, 1=1:1, 4/3, 16/9
  cropAspect = 0;

  // queue ครอปทีละรูป
  private cropQueue: File[] = [];
  private cropOriginalName = 'image.png';

  constructor(
    private fb: FormBuilder,
    private dramaService: DramaService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(5000)]],
      tags: [''],
    });
  }

  // --------- getters ----------
  get titleCtrl() { return this.form.get('title'); }
  get descriptionCtrl() { return this.form.get('description'); }
  get tagsCtrl() { return this.form.get('tags'); }
  get isViewMode() { return this.mode === 'view'; }

  @ViewChild('pdfInput') pdfInput!: ElementRef<HTMLInputElement>;
  @ViewChild('imagesInput') imagesInput!: ElementRef<HTMLInputElement>;

  triggerPdfPicker() {
    if (this.isViewMode) return;
    const el = this.pdfInput?.nativeElement;
    if (!el) return;
    el.value = ''; // เลือกไฟล์เดิมซ้ำได้
    el.click();
  }

  triggerImagesPicker() {
    if (this.isViewMode) return;
    const el = this.imagesInput?.nativeElement;
    if (!el) return;
    el.value = ''; // เลือกไฟล์เดิมซ้ำได้
    el.click();
  }

  // =============== lifecycle ===============
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const segments = this.route.snapshot.url.map(s => s.path);
    const isView = segments.includes('view');

    if (idParam) {
      this.scriptId = +idParam;
      this.mode = isView ? 'view' : 'edit';
      this.loadScript(this.scriptId);

      if (this.isViewMode) this.form.disable();
    } else {
      this.mode = 'create';
    }
  }

  private loadScript(id: number) {
    this.dramaService.getDramaById(id).subscribe({
      next: (res: Drama) => {
        this.form.patchValue({
          title: res.title,
          description: res.description,
          tags: res.tags,
        });

        // PDF จาก server
        if ((res as any).pdfPath) {
          const rawPath = (res as any).pdfPath as string;
          const normalized = rawPath.replace(/\\/g, '/');
          const url = `${this.fileBase}/${normalized}`;

          this.pdfPreviewSrc = url;
          this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

          const parts = normalized.split('/');
          this.pdfFileName = parts[parts.length - 1];
        }

        // รูปภาพเดิมจาก server
        if (res.images?.length) {
          this.previewUrls = res.images.map(img => {
            const raw = img.filePath || '';
            const normalized = raw.replace(/\\/g, '/');
            return `${this.fileBase}/${normalized}`;
          });
        }

        if (this.isViewMode) this.form.disable();
      },
      error: () => {
        this.toast.error('ไม่พบข้อมูลบทละครที่ต้องการ', { title: 'เกิดข้อผิดพลาด' });
        this.navigateToList();
      },
    });
  }

  // ---------- helper lang ----------
  private getLangPrefix(): string | null {
    const segments = this.router.url.split('/').filter(Boolean);
    const supported = ['th', 'en'];
    return supported.includes(segments[0]) ? segments[0] : null;
  }

  private navigateToList() {
    const lang = this.getLangPrefix();
    const base = lang ? ['/', lang, 'directory'] : ['/directory'];
    this.router.navigate([...base, 'script']);
  }

  // =============== image upload + crop ===============
  onFileChange(event: Event) {
    if (this.isViewMode) return;

    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    let selected = Array.from(input.files);

    // กันไฟล์ไม่ใช่รูป (บางที user เลือกผิด)
    selected = selected.filter(f => f.type.startsWith('image/'));

    if (!selected.length) {
      this.toast.warning('กรุณาเลือกไฟล์รูปภาพเท่านั้น', { title: 'ชนิดไฟล์ไม่ถูกต้อง' });
      input.value = '';
      return;
    }

    // จำกัดจำนวนรวม
    const remaining = this.maxImages - this.files.length;
    if (remaining <= 0) {
      this.toast.warning(`เลือกได้สูงสุด ${this.maxImages} รูปภาพ`, { title: 'จำนวนรูปภาพเกินกำหนด' });
      input.value = '';
      return;
    }

    if (selected.length > remaining) {
      this.toast.warning(`เหลือที่ว่างอีก ${remaining} รูป (รวมสูงสุด ${this.maxImages})`, {
        title: 'จำนวนรูปภาพเกินกำหนด',
      });
      selected = selected.slice(0, remaining);
    }

    // ต่อคิว (ไม่ทับของเดิม)
    this.cropQueue.push(...selected);

    input.value = '';

    // ถ้ายังไม่ได้เปิด crop อยู่ ให้เริ่มตัวแรก
    if (!this.cropOpen) {
      void this.startNextCrop();
    }
  }

  removeImage(index: number) {
    if (this.isViewMode) return;
    this.files.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  private async startNextCrop() {
    if (this.cropQueue.length === 0) return;

    const nextFile = this.cropQueue.shift()!;
    this.currentCropFile = nextFile;               // ✅ เก็บไฟล์เดิม
    this.cropOriginalName = nextFile.name;

    this.croppedBase64 = undefined;                // (ตามที่แก้ type เป็น undefined)
    this.cropBase64 = await this.fileToBase64(nextFile);

    this.cropOpen = true;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read failed'));
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  onCropped(event: ImageCroppedEvent) {
    this.croppedBase64 = event.base64 ?? undefined;
  }

  onCropLoadFailed() {
    this.toast.error('โหลดรูปภาพไม่สำเร็จ', { title: 'เกิดข้อผิดพลาด' });
    this.closeCrop();
  }

  closeCrop() {
    this.cropOpen = false;
    this.cropBase64 = undefined;
    this.croppedBase64 = undefined;
    this.currentCropFile = undefined;

    setTimeout(() => void this.startNextCrop(), 0);
  }

  confirmCrop() {
    // ถ้ามีผลครอป -> ใช้รูปที่ครอป
    if (this.croppedBase64) {
      const safeName = this.cropOriginalName.replace(/\.\w+$/, '');
      const file = this.base64ToFile(this.croppedBase64, `${safeName}.jpg`);

      this.files.push(file);
      this.previewUrls.push(this.croppedBase64);
    } else {
      // ไม่ครอปก็ได้ -> ใช้ไฟล์เดิม
      if (this.currentCropFile) {
        this.files.push(this.currentCropFile);

        const reader = new FileReader();
        reader.onload = () => this.previewUrls.push(reader.result as string);
        reader.readAsDataURL(this.currentCropFile);
      }
    }

    // reset
    this.cropOpen = false;
    this.cropBase64 = undefined;
    this.croppedBase64 = undefined;
    this.currentCropFile = undefined;

    setTimeout(() => void this.startNextCrop(), 0);
  }

  private base64ToFile(base64: string, filename: string): File {
    const arr = base64.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }

  // =============== PDF upload ===============
  onPdfChange(event: Event) {
    if (this.isViewMode) return;

    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    if (file.type !== 'application/pdf') {
      this.toast.warning('รองรับเฉพาะไฟล์ PDF เท่านั้น', { title: 'ชนิดไฟล์ไม่ถูกต้อง' });
      input.value = '';
      return;
    }

    // revoke เฉพาะกรณีเป็น blob url (ของที่มาจาก server ไม่ต้อง revoke)
    if (this.pdfPreviewSrc?.startsWith('blob:')) {
      URL.revokeObjectURL(this.pdfPreviewSrc);
    }

    this.pdfFile = file;
    this.pdfFileName = file.name;

    const blobUrl = URL.createObjectURL(file);
    this.pdfPreviewSrc = blobUrl;
    this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);

    input.value = '';

    this.toast.success('เพิ่มไฟล์ PDF สำเร็จ', { title: 'อัปโหลดสำเร็จ', duration: 1500 });
  }

  openPdfFullScreen() {
    if (!this.pdfPreviewSrc) return;
    window.open(this.pdfPreviewSrc, '_blank');
  }

  removePdf() {
    if (this.isViewMode) return;

    if (this.pdfPreviewSrc?.startsWith('blob:')) {
      URL.revokeObjectURL(this.pdfPreviewSrc);
    }

    this.pdfFile = null;
    this.pdfPreviewUrl = null;
    this.pdfPreviewSrc = null;
    this.pdfFileName = null;

    this.toast.warning('ลบไฟล์ PDF แล้ว', { title: 'ลบสำเร็จ', duration: 1500 });
  }

  // =============== submit ===============
  onSubmit() {
    if (this.isViewMode) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('กรุณากรอกข้อมูลให้ครบถ้วน', { title: 'ข้อมูลไม่ครบ' });
      return;
    }

    if (this.mode === 'create' && !this.pdfFile) {
      this.toast.warning('จำเป็นต้องอัปโหลดไฟล์ PDF อย่างน้อย 1 ไฟล์', { title: 'ยังไม่ได้เพิ่ม PDF' });
      return;
    }

    if (this.mode === 'edit' && !this.pdfFile && !this.pdfPreviewUrl) {
      this.toast.warning('บทละครต้องมีไฟล์ PDF อย่างน้อย 1 ไฟล์', { title: 'ยังไม่มีไฟล์ PDF' });
      return;
    }

    this.isSubmitting = true;

    const payload = {
      title: this.form.value.title,
      description: this.form.value.description,
      tags: this.form.value.tags,
    };

    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    if (this.pdfFile) formData.append('pdf', this.pdfFile);
    this.files.forEach(f => formData.append('images', f));

    const request$ =
      this.mode === 'create'
        ? this.dramaService.createDrama(formData)
        : this.dramaService.updateDrama(this.scriptId as number, formData);

    request$.subscribe({
      next: () => {
        this.toast.success(this.mode === 'create' ? 'บันทึกบทละครสำเร็จ' : 'แก้ไขบทละครสำเร็จ', {
          title: 'ดำเนินการสำเร็จ',
        });
        this.isSubmitting = false;
        this.navigateToList();
      },
      error: () => {
        this.toast.error('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง', { title: 'บันทึกไม่สำเร็จ' });
        this.isSubmitting = false;
      },
    });
  }

  onCancel() {
    this.navigateToList();
  }
}
