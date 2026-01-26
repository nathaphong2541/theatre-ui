import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { LanguageMenuComponent } from 'src/locale/language-menu.component';

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

  serverError?: string = undefined;

  loading = signal(false);
  showPassword = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true]
  });

  constructor(
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    // ล้างทันทีรอบแรก
    this.clearAllClientState();

    // ล้างอีกรอบหลัง init ต่างๆ (กัน theme/onboarding เขียนกลับ)
    queueMicrotask(() => this.clearAllClientState());
    setTimeout(() => this.clearAllClientState(), 0);
  }

  private clearAllClientState() {
    try { localStorage.clear(); } catch { }
    try { sessionStorage.clear(); } catch { }
    this.clearAllCookies();
  }

  private clearAllCookies() {
    const cookies = document.cookie ? document.cookie.split('; ') : [];
    for (const c of cookies) {
      const eq = c.indexOf('=');
      const name = eq > -1 ? c.substring(0, eq) : c;
      document.cookie = `${name}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    }
  }

  get f() { return this.form.controls; }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);

    // TODO: Replace with your AuthService
    await new Promise(r => setTimeout(r, 800));

    this.loading.set(false);
    this.router.navigate(['/']);
  }

  private getLangPrefix(): string | null {
    const path = this.router.url.split('?')[0].split('#')[0];
    const segments = path.split('/').filter(Boolean); // ตัดช่องว่างออก
    return segments.length > 0 ? segments[0] : null;
  }

  policy() {
    const lang = this.getLangPrefix();

    if (lang) {
      this.router.navigate(['/', lang, 'auth', 'policy']);
    } else {
      this.router.navigate(['/auth/policy']);
    }
  }
}
