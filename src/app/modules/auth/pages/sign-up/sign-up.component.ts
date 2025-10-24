import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, FormGroup, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LanguageMenuComponent } from 'src/locale/language-menu.component';

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
  // อนุญาตเฉพาะ A-Z a-z และเว้นวรรค
  const ok = /^[A-Za-z\s]+$/.test(raw);
  return ok ? null : { invalidNameChars: true };
}

function sanitizeNameEn(s: string): string {
  // ตัดทุกอย่างที่ไม่ใช่ A-Z a-z หรือเว้นวรรค
  let out = s.replace(/[^A-Za-z\s]/g, '');
  // ลดเว้นวรรคซ้อนและ trim
  out = out.replace(/\s{2,}/g, ' ').trimStart(); // ปล่อยให้มี space ท้ายได้ถ้าชอบก็เปลี่ยนเป็น trim() ได้
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

  // Getters ช่วยให้ template อ่านง่าย
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

  private invalidNameChar = /[^A-Za-z ]/g; // อนุญาตเฉพาะ A-Z a-z และช่องว่าง

  onBeforeNameInput(e: InputEvent) {
    // บาง browser จะให้ e.data เฉพาะตอนพิมพ์ตัวเดียว (ไม่รวม paste/drag)
    const data = (e as any).data as string | null | undefined;
    if (data && this.invalidNameChar.test(data)) {
      e.preventDefault();
    }
  }

  // เผื่อกรณี paste ใส่ทีละหลายตัว
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

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    try {
      // TODO: เรียก service สมัครสมาชิกจริง
      alert('✅ Registration successful!');
      this.router.navigate(['/auth/sign-in']);
    } finally {
      this.submitting.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/']);
  }
}
