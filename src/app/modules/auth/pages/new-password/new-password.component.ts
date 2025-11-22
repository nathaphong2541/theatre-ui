import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { AuthService } from '../../service/auth.service';
import { LanguageMenuComponent } from 'src/locale/language-menu.component';
import { ToastService } from 'src/app/shared/components/toast/toast.service';

@Component({
  selector: 'app-new-password',
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSvgIconModule, ButtonComponent, LanguageMenuComponent],
})
export class NewPasswordComponent implements OnInit {
  password = '';
  confirmPassword = '';

  showPassword = false;
  showConfirmPassword = false;

  isSubmitting = false;
  error: string | null = null;
  success: string | null = null;

  token: string | null = null;

  // แทนที่อันเดิมให้เป็นแบบมี /g ด้วย
  private readonly THAI_PATTERN = /[\u0E00-\u0E7F\u0E50-\u0E59]/g;

  // ถ้ายังอยากใช้ hasThai* ไว้เช็คก็ได้ แต่จริง ๆ หลังจากล้างแล้วจะไม่เหลือไทยอยู่แล้ว
  get hasThaiInPassword(): boolean {
    return false; // ตอนนี้เราล้างออกหมดแล้ว จะไม่ให้มีไทยอยู่เลย
  }

  get hasThaiInConfirm(): boolean {
    return false;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.error = 'Invalid or expired reset link.';
    }
  }

  onPasswordInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const original = input.value;
    const cleaned = original.replace(this.THAI_PATTERN, ''); // ลบไทยทิ้งหมด

    if (cleaned !== original) {
      input.value = cleaned;
    }
    this.password = cleaned;
  }

  onConfirmPasswordInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const original = input.value;
    const cleaned = original.replace(this.THAI_PATTERN, '');

    if (cleaned !== original) {
      input.value = cleaned;
    }
    this.confirmPassword = cleaned;
  }


  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // ✅ แก้เป็น public (เอา private ออก)
  get passwordScore(): number {
    const pwd = this.password || '';
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  }

  passwordBarClass(index: number): string {
    if (this.passwordScore >= index) {
      if (this.passwordScore <= 1) {
        return 'bg-red-500';
      } else if (this.passwordScore === 2) {
        return 'bg-yellow-400';
      } else {
        return 'bg-emerald-400';
      }
    }
    return 'bg-white/10';
  }

  get passwordStrengthLabel(): string {
    const s = this.passwordScore;
    if (!this.password) return 'Too short';
    if (s <= 1) return 'Weak';
    if (s === 2) return 'Medium';
    return 'Strong';
  }

  get passwordsMatch(): boolean {
    return !!this.password && !!this.confirmPassword && this.password === this.confirmPassword;
  }

  get showMismatchError(): boolean {
    return !!this.confirmPassword && this.password !== this.confirmPassword;
  }

  get canSubmit(): boolean {
    return !!this.token &&
      !this.isSubmitting &&
      this.password.length >= 8 &&
      this.password === this.confirmPassword;
  }

  onSubmit(): void {
    this.error = null;
    this.success = null;

    if (!this.token) {
      this.error = 'Invalid or expired reset link.';
      return;
    }

    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.isSubmitting = true;

    this.authService.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.isSubmitting = false;

        this.toast.success('Your password has been updated successfully.', {
          title: 'Success',
          duration: 3000,
          onTimeout: () => {
            const lang = this.getLangPrefix();
            if (lang) {
              this.router.navigate(['/', lang, 'auth', 'sign-in']);
            } else {
              this.router.navigate(['/auth/sign-in']);
            }
          }
        });
      },
      error: (err) => {
        console.error('reset password error', err);
        this.isSubmitting = false;
        this.error =
          err?.error?.message ||
          'Unable to reset password. The reset link may be invalid or expired.';
      },
    });
  }

  /** helper: ดึง prefix แรกจาก URL เช่น /en/... -> 'en' */
  private getLangPrefix(): string | null {
    const path = this.router.url.split('?')[0].split('#')[0];
    const segments = path.split('/').filter(Boolean);
    return segments.length > 0 ? segments[0] : null;
  }

}
