// src/app/modules/auth/sign-in/sign-in.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LanguageMenuComponent } from 'src/locale/language-menu.component';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    AngularSvgIconModule,
    LanguageMenuComponent
  ],
})
export class SignInComponent implements OnInit {

  serverError?: string; // เผื่อ template เดิมยังใช้แสดงข้อความใต้ฟอร์ม
  loading = signal(false);
  showPassword = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true]
  });

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private auth: AuthService,
    private toast: ToastService, // ✅ inject toast
  ) { }

  ngOnInit(): void { }

  get f() { return this.form.controls; }

  togglePw() {
    this.showPassword.set(!this.showPassword());
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('กรุณากรอกอีเมลและรหัสผ่านให้ถูกต้อง', {
        title: 'ข้อมูลไม่ครบ',
        duration: 3000,
      });
      return;
    }

    this.loading.set(true);
    this.serverError = undefined;

    const { email, password, remember } = this.form.value;

    try {
      await firstValueFrom(this.auth.login(email!, password!, !!remember));

      // ✅ แจ้งเตือนสำเร็จ + redirect อัตโนมัติเมื่อหลอดหมดเวลา
      this.toast.success('เข้าสู่ระบบสำเร็จ', {
        title: 'ยินดีต้อนรับ 👋',
        duration: 2000,
        onTimeout: () => this.router.navigate(['/']), // ⬅ redirect ทันทีที่ progress หมด
      });

      // หากต้องการนำทางทันที (ไม่รอหลอด): uncomment บรรทัดนี้
      // this.router.navigate(['/']);
    } catch (err: any) {
      const msg = err?.error?.message || err?.message || 'ไม่สามารถเข้าสู่ระบบได้';
      this.serverError = msg;

      this.toast.error(msg, {
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        actionText: 'ลืมรหัสผ่าน?',
        onAction: () => this.router.navigate(['/auth/forgot-password']),
        duration: 5000,
      });
    } finally {
      this.loading.set(false);
    }
  }

  policy() {
    this.router.navigate(['/en/auth/policy']);
  }
}
