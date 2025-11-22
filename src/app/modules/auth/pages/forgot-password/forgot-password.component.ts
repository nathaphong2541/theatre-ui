import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../service/auth.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { LanguageMenuComponent } from 'src/locale/language-menu.component';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LanguageMenuComponent],
})
export class ForgotPasswordComponent implements OnInit {
  email = '';
  isSubmitting = false;
  error: string | null = null;
  success: string | null = null;

  // regex ภาษาไทย + เลขไทย
  private readonly THAI_PATTERN = /[\u0E00-\u0E7F\u0E50-\u0E59]/g;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) { }

  ngOnInit(): void { }

  // ดัก input ไม่ให้มีอักษรไทย/เลขไทย
  onEmailInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const original = input.value;
    const cleaned = original.replace(this.THAI_PATTERN, ''); // ลบไทยทิ้งหมด

    if (cleaned !== original) {
      input.value = cleaned;
    }
    this.email = cleaned;
  }

  /** helper: ดึง prefix แรกจาก URL เช่น /en/... -> 'en' */
  private getLangPrefix(): string | null {
    const path = this.router.url.split('?')[0].split('#')[0];
    const segments = path.split('/').filter(Boolean);
    return segments.length > 0 ? segments[0] : null;
  }

  onSubmit(): void {
    this.error = null;
    this.success = null;

    const trimmed = this.email.trim();

    if (!trimmed) {
      this.toast.warning('กรุณากรอกอีเมลให้ถูกต้อง', {
        title: 'ข้อมูลไม่ครบ',
        duration: 3000,
      });
      return;
    }

    this.isSubmitting = true;

    this.authService.forgotPassword(trimmed).subscribe({
      next: () => {
        this.isSubmitting = false;

        this.toast.success('ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านให้แล้ว กรุณาตรวจสอบอีเมล', {
          title: 'ส่งสำเร็จ',
          duration: 3000,
          onTimeout: () => {
            // ✅ redirect ตามภาษาใน URL ตอนนี้
            const lang = this.getLangPrefix();
            if (lang) {
              this.router.navigate(['/', lang, 'auth', 'sign-in']);
            } else {
              this.router.navigate(['/auth/sign-in']);
            }
          },
        });

      },

      error: (err) => {
        this.isSubmitting = false;

        const msg =
          err?.error?.message ||
          'ไม่สามารถส่งคำขอได้ กรุณาลองใหม่อีกครั้ง';

        this.toast.warning(msg, {
          title: 'เกิดข้อผิดพลาด',
          duration: 3000,
        });
      },
    });
  }

  public loginLink(): any[] {
    const lang = this.getLangPrefix();
    return lang ? ['/', lang, 'auth', 'sign-in'] : ['/auth/sign-in'];
  }

}
