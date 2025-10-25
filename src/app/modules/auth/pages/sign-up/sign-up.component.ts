// src/app/modules/auth/sign-up/sign-up.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, FormGroup, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LanguageMenuComponent } from 'src/locale/language-menu.component';
import { AuthService, RegisterRequest } from '../../service/auth.service';
import { lastValueFrom } from 'rxjs';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
// --- Custom Validators ---
function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value ?? '';
  const cf = group.get('confirmPassword')?.value ?? '';
  return pw && cf && pw !== cf ? { passwordsNotMatch: true } : null;
}

// ความแข็งแรงรหัสผ่าน: A-Z, a-z, 0-9, special, ≥ 8
function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value ?? '';
  if (!value) return null;
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  const validLength = value.length >= 8;

  const isValid = hasUpper && hasLower && hasNumber && hasSpecial && validLength;
  return isValid ? null : { weakPassword: true };
}

// --- Name (EN only) ---
function nameEnValidator(control: AbstractControl): ValidationErrors | null {
  const raw = (control.value ?? '') as string;
  if (!raw) return null; // ให้ required จัดการเอง
  const ok = /^[A-Za-z\s]+$/.test(raw);
  return ok ? null : { invalidNameChars: true };
}

function sanitizeNameEn(s: string): string {
  let out = s.replace(/[^A-Za-z\s]/g, '');
  out = out.replace(/\s{2,}/g, ' ').trimStart();
  return out;
}

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LanguageMenuComponent],
  templateUrl: './sign-up.component.html',
})
export class SignUpComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);
  private toast = inject(ToastService); // ✅ ใช้งาน Toast

  submitting = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100), nameEnValidator]],
    lastName: ['', [Validators.required, Validators.maxLength(100), nameEnValidator]],
    email: ['', [Validators.required, Validators.email]],
    passwordGroup: this.fb.group(
      {
        password: ['', [Validators.required, passwordStrengthValidator]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordsMatchValidator }
    ),
    over18: [false, [Validators.requiredTrue]],
  });

  // Getters
  get f() { return this.form.controls; }
  get pwGroup(): FormGroup { return this.form.get('passwordGroup') as FormGroup; }
  get pw() { return this.pwGroup.get('password'); }
  get cf() { return this.pwGroup.get('confirmPassword'); }

  // สำหรับ checklist ใน UI
  get haveUpper(): boolean { return /[A-Z]/.test(this.pw?.value ?? ''); }
  get haveLower(): boolean { return /[a-z]/.test(this.pw?.value ?? ''); }
  get haveNumber(): boolean { return /\d/.test(this.pw?.value ?? ''); }
  get haveSpecial(): boolean { return /[!@#$%^&*(),.?":{}|<>]/.test(this.pw?.value ?? ''); }
  get haveMinLen(): boolean { return (this.pw?.value ?? '').length >= 8; }

  ngOnInit(): void {
    // --- ของเดิมสำหรับ password ---
    const stripThai = (s: string) => s.replace(/[\u0E00-\u0E7F]/g, '');
    this.pw?.valueChanges.subscribe((val: string | null) => {
      const v = val ?? '';
      const cleaned = stripThai(v);
      if (cleaned !== v) this.pw?.setValue(cleaned, { emitEvent: false });
    });
    this.cf?.valueChanges.subscribe((val: string | null) => {
      const v = val ?? '';
      const cleaned = stripThai(v);
      if (cleaned !== v) this.cf?.setValue(cleaned, { emitEvent: false });
    });

    // --- ใหม่: กรองชื่อและนามสกุล ---
    const fn = this.f['firstName'];
    const ln = this.f['lastName'];

    fn.valueChanges.subscribe((val: string | null) => {
      const v = val ?? '';
      const cleaned = sanitizeNameEn(v);
      if (cleaned !== v) fn.setValue(cleaned, { emitEvent: false });
    });

    ln.valueChanges.subscribe((val: string | null) => {
      const v = val ?? '';
      const cleaned = sanitizeNameEn(v);
      if (cleaned !== v) ln.setValue(cleaned, { emitEvent: false });
    });
  }

  private invalidNameChar = /[^A-Za-z ]/g;

  onBeforeNameInput(e: InputEvent) {
    const data = (e as any).data as string | null | undefined;
    if (data && this.invalidNameChar.test(data)) {
      e.preventDefault();
    }
  }

  onPasteName(e: ClipboardEvent, control: 'firstName' | 'lastName') {
    const pasted = e.clipboardData?.getData('text') ?? '';
    const cleaned = pasted.replace(this.invalidNameChar, '');
    if (cleaned !== pasted) {
      e.preventDefault();
      const ctrl = this.form.get(control)!;
      const cur = (ctrl.value ?? '') as string;
      ctrl.setValue((cur + cleaned).replace(/\s{2,}/g, ' ').trimStart());
    }
  }

  hasErr(ctrl: 'firstName' | 'lastName', key: string) {
    return this.form.get(ctrl)?.touched && !!this.form.get(ctrl)?.errors?.[key];
  }

  togglePassword(type: 'pw' | 'cf') {
    if (type === 'pw') this.showPassword.set(!this.showPassword());
    else this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  /** ✅ อ่าน PDPA consent จาก localStorage.pdpaConsent */
  private getPdpaAccepted(): boolean {
    try {
      const raw = localStorage.getItem('pdpaConsent');
      if (!raw) return false;
      const obj = JSON.parse(raw);
      return obj?.accepted === true;
    } catch {
      return false;
    }
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('กรุณากรอกข้อมูลให้ครบถ้วน', { title: 'ข้อมูลไม่ครบ' });
      return;
    }

    // ต้องยอมรับ PDPA ก่อน (ดึงจาก localStorage)
    const policyConfirm = this.getPdpaAccepted();
    if (!policyConfirm) {
      this.toast.warning('โปรดยอมรับนโยบายความเป็นส่วนตัว (PDPA) ก่อนสมัครใช้งาน', {
        title: 'ต้องยอมรับ PDPA',
        actionText: 'อ่านนโยบาย',
        onAction: () => this.router.navigate(['/pdpa']),
        duration: 6000,
      });
      return;
    }

    const payload: RegisterRequest = {
      policyConfirm,
      firstName: this.f['firstName'].value!,
      lastName: this.f['lastName'].value!,
      email: this.f['email'].value!,
      password: this.pw?.value!,
    };

    this.submitting.set(true);
    try {
      await lastValueFrom(this.auth.register(payload, true)); // auto-login หลังสมัคร
      this.toast.success('สมัครสมาชิกสำเร็จ 🎉', {
        title: 'Welcome!',
        duration: 3000,
        onTimeout: () => this.router.navigate(['/']),
      });
    } catch (err: any) {
      const msg = err?.error?.message || 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      this.toast.error(msg, { title: 'เกิดข้อผิดพลาด' });
    } finally {
      this.submitting.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/']);
  }
}
