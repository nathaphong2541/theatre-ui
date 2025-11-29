import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { DramaService } from '../../../pages/drama/service/drama.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { environment } from 'src/environments/environment';
import { Drama } from '../../../pages/drama/models/drama.model';

type Mode = 'create' | 'edit' | 'view';

@Component({
  selector: 'app-handle-drama',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  get titleCtrl() {
    return this.form.get('title');
  }
  get descriptionCtrl() {
    return this.form.get('description');
  }
  get tagsCtrl() {
    return this.form.get('tags');
  }

  get isViewMode() {
    return this.mode === 'view';
  }

  // =============== lifecycle ===============
  ngOnInit(): void {
    // ตรวจจาก url ว่าเป็น view / edit / create
    const idParam = this.route.snapshot.paramMap.get('id');
    const segments = this.route.snapshot.url.map(s => s.path); // ['script','view','2'] หรือ ['script','2']

    const isView = segments.includes('view');

    if (idParam) {
      this.scriptId = +idParam;
      this.mode = isView ? 'view' : 'edit';
      this.loadScript(this.scriptId);

      if (this.isViewMode) {
        this.form.disable();
      }
    } else {
      this.mode = 'create';
    }
  }

  // โหลด script จาก backend
  private loadScript(id: number) {
    this.dramaService.getDramaById(id).subscribe({
      next: (res: Drama) => {
        this.form.patchValue({
          title: res.title,
          description: res.description,
          tags: res.tags,
        });

        // ----- PDF จาก server -----
        if ((res as any).pdfPath) {
          const rawPath = (res as any).pdfPath as string; // "uploads\\scripts\\pdf\\xxx.pdf"
          const normalized = rawPath.replace(/\\/g, '/'); // => uploads/scripts/pdf/xxx.pdf
          const url = `${this.fileBase}/${normalized}`;   // => http://localhost:8080/uploads/scripts/pdf/xxx.pdf

          this.pdfPreviewSrc = url;
          this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

          const parts = normalized.split('/');
          this.pdfFileName = parts[parts.length - 1];
        }

        // ----- รูปภาพเดิมจาก server -----
        if (res.images && res.images.length > 0) {
          this.previewUrls = res.images.map(img => {
            const raw = img.filePath || '';               // "uploads\\scripts\\1764_xxx.jpg"
            const normalized = raw.replace(/\\/g, '/');    // "uploads/scripts/1764_xxx.jpg"
            return `${this.fileBase}/${normalized}`;       // "http://localhost:8080/uploads/scripts/1764_xxx.jpg"
          });
        }

        if (this.isViewMode) {
          this.form.disable();
        }
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
    // ไปหน้า list หลัก
    this.router.navigate([...base, 'script']);
  }

  // =============== image upload ===============
  onFileChange(event: Event) {
    if (this.isViewMode) return; // กันเผื่อ

    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const selected = Array.from(input.files);

    if (this.files.length + selected.length > this.maxImages) {
      this.toast.warning(`เลือกได้สูงสุด ${this.maxImages} รูปภาพ`, {
        title: 'จำนวนรูปภาพเกินกำหนด',
        duration: 3000,
      });
      const slot = this.maxImages - this.files.length;
      if (slot <= 0) {
        input.value = '';
        return;
      }
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

  removeImage(index: number) {
    if (this.isViewMode) return;
    this.files.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  // =============== PDF upload ===============
  onPdfChange(event: Event) {
    if (this.isViewMode) return;

    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    if (file.type !== 'application/pdf') {
      this.toast.warning('รองรับเฉพาะไฟล์ PDF เท่านั้น', {
        title: 'ชนิดไฟล์ไม่ถูกต้อง',
      });
      input.value = '';
      return;
    }

    // ล้าง blob เดิม
    if (this.pdfPreviewSrc) URL.revokeObjectURL(this.pdfPreviewSrc);

    this.pdfFile = file;
    this.pdfFileName = file.name;

    const blobUrl = URL.createObjectURL(file);
    this.pdfPreviewSrc = blobUrl;
    this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);

    input.value = '';

    this.toast.success('เพิ่มไฟล์ PDF สำเร็จ', {
      title: 'อัปโหลดสำเร็จ',
      duration: 1500,
    });
  }

  openPdfFullScreen() {
    if (!this.pdfPreviewSrc) return;
    window.open(this.pdfPreviewSrc, '_blank');
  }

  removePdf() {
    if (this.isViewMode) return;

    if (this.pdfPreviewSrc) URL.revokeObjectURL(this.pdfPreviewSrc);
    this.pdfFile = null;
    this.pdfPreviewUrl = null;
    this.pdfPreviewSrc = null;
    this.pdfFileName = null;

    this.toast.warning('ลบไฟล์ PDF แล้ว', {
      title: 'ลบสำเร็จ',
      duration: 1500,
    });
  }

  // =============== submit ===============
  onSubmit() {
    if (this.isViewMode) {
      return; // เผื่อมีคนยิง event ผ่าน devtools
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('กรุณากรอกข้อมูลให้ครบถ้วน', { title: 'ข้อมูลไม่ครบ' });
      return;
    }

    // create: ต้องมี PDF เสมอ
    if (this.mode === 'create' && !this.pdfFile) {
      this.toast.warning('จำเป็นต้องอัปโหลดไฟล์ PDF อย่างน้อย 1 ไฟล์', {
        title: 'ยังไม่ได้เพิ่ม PDF',
      });
      return;
    }

    // edit: ถ้าไม่มีทั้ง pdf ใหม่ + preview เดิม = ไม่มี PDF เลย
    if (this.mode === 'edit' && !this.pdfFile && !this.pdfPreviewUrl) {
      this.toast.warning('บทละครต้องมีไฟล์ PDF อย่างน้อย 1 ไฟล์', {
        title: 'ยังไม่มีไฟล์ PDF',
      });
      return;
    }

    this.isSubmitting = true;

    const payload = {
      title: this.form.value.title,
      description: this.form.value.description,
      tags: this.form.value.tags,
    };

    const formData = new FormData();
    formData.append(
      'data',
      new Blob([JSON.stringify(payload)], { type: 'application/json' })
    );

    // PDF ใหม่ (ถ้ามี) – ถ้าไม่มีสำหรับ edit จะไม่ส่ง field pdf ไปเลย → backend จะใช้ของเดิม
    if (this.pdfFile) {
      formData.append('pdf', this.pdfFile);
    }

    // รูปใหม่ (ถ้ามี)
    this.files.forEach(f => formData.append('images', f));

    // แยก call ตามโหมด
    const request$ =
      this.mode === 'create'
        ? this.dramaService.createDrama(formData)
        : this.dramaService.updateDrama(this.scriptId as number, formData);

    request$.subscribe({
      next: () => {
        this.toast.success(
          this.mode === 'create' ? 'บันทึกบทละครสำเร็จ' : 'แก้ไขบทละครสำเร็จ',
          {
            title: 'ดำเนินการสำเร็จ',
          }
        );
        this.isSubmitting = false;
        this.navigateToList();
      },
      error: () => {
        this.toast.error('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง', {
          title: 'บันทึกไม่สำเร็จ',
        });
        this.isSubmitting = false;
      },
    });
  }

  onCancel() {
    this.navigateToList();
  }
}
