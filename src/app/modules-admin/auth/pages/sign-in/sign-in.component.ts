import { CommonModule, NgClass, NgIf } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { LanguageMenuComponent } from 'src/locale/language-menu.component';

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

  serverError?: string = undefined; // ตั้งค่าจาก response ของ backend เมื่อ login fail

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
    // Example: navigate to dashboard
    this.router.navigate(['/']);
  }

  policy() {
    this.router.navigate(['/en/auth/policy']);
  }
}