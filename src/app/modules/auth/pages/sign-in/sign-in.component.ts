import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LanguageMenuComponent } from 'src/locale/language-menu.component';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
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

  serverError?: string;
  loading = signal(false);
  showPassword = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true] // ถ้าอยากคุมอายุคุกกี้ ให้ส่งไปให้ backend ตัดสินใจ
  });

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private auth: AuthService
  ) { }

  ngOnInit(): void { }

  get f() { return this.form.controls; }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError = undefined;

    const { email, password, remember } = this.form.value;

    try {
      // ✅ เรียก API login — backend จะ Set-Cookie: access_token=... (HttpOnly)
      await firstValueFrom(this.auth.login(email!, password!, !!remember));

      // ไม่ต้องเก็บ token ใน local/session storage อีก
      // ไปหน้าแรกหรือ dashboard
      this.router.navigate(['/']);
    } catch (err: any) {
      const msg = err?.error?.message || err?.message || 'ไม่สามารถเข้าสู่ระบบได้';
      this.serverError = msg;
    } finally {
      this.loading.set(false);
    }
  }

  policy() {
    this.router.navigate(['/en/auth/policy']);
  }
}
