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

declare global {
  interface Window {
    onTurnstileSuccess: (token: string) => void;
  }
}

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
    LanguageMenuComponent,
  ],
})
export class SignInComponent implements OnInit {

  turnstileToken?: string;

  serverError?: string;
  loading = signal(false);
  showPassword = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true],
  });

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private auth: AuthService,
    private toast: ToastService,
  ) {
    // callback จาก Cloudflare Turnstile (ชื่อเดียวกับ data-callback ใน HTML)
    window.onTurnstileSuccess = (token: string) => {
      this.turnstileToken = token;
      // console.log('Turnstile token =', token);
    };
  }

  ngOnInit(): void { }

  get f() { return this.form.controls; }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('กรุณากรอกอีเมลและรหัสผ่านให้ถูกต้อง', {
        title: 'ข้อมูลไม่ครบ',
        duration: 3000,
      });
      return;
    }

    // // ต้องผ่าน Turnstile ก่อน
    // if (!this.turnstileToken) {
    //   this.toast.warning('กรุณายืนยันความปลอดภัยก่อนเข้าสู่ระบบ', {
    //     title: 'ยังไม่ได้ตรวจสอบ',
    //     duration: 3000,
    //   });
    //   return;
    // }

    this.loading.set(true);
    this.serverError = undefined;

    const { email, password, remember } = this.form.value;

    try {
      await firstValueFrom(this.auth.login(email!, password!, !!remember));

      this.toast.success('เข้าสู่ระบบสำเร็จ', {
        title: 'ยินดีต้อนรับ 👋',
        duration: 2000,
        onTimeout: () => this.router.navigate(['/en']), // ปรับ path ตามที่คุณใช้จริง
      });

      // ถ้าอยาก redirect ทันที ไม่รอ toast:
      // this.router.navigate(['/en']);
    } catch (err: any) {
      const msg =
        err?.error?.message ||
        err?.message ||
        'ไม่สามารถเข้าสู่ระบบได้ในขณะนี้';
      this.serverError = msg;

      this.toast.error(msg, {
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        actionText: 'ลืมรหัสผ่าน?',
        onAction: () => this.router.navigate(['/en/auth/forgot-password']),
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
