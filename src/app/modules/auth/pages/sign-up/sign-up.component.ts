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
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    passwordGroup: this.fb.group(
      {
        // เอา noThaiValidator ออก แล้วใช้ตัวกรองอัตโนมัติแทน
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
    // กรองอักขระไทยทิ้งทันทีเมื่อมีการเปลี่ยนค่า (พิมพ์/วาง)
    const stripThai = (s: string) => s.replace(/[\u0E00-\u0E7F]/g, '');

    this.pw?.valueChanges.subscribe((val: string | null) => {
      const v = val ?? '';
      const cleaned = stripThai(v);
      if (cleaned !== v) {
        this.pw?.setValue(cleaned, { emitEvent: false }); // ไม่ลูปซ้ำ
      }
    });

    this.cf?.valueChanges.subscribe((val: string | null) => {
      const v = val ?? '';
      const cleaned = stripThai(v);
      if (cleaned !== v) {
        this.cf?.setValue(cleaned, { emitEvent: false });
      }
    });
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
