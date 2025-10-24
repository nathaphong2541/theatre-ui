import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: '[list-setting]',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './list-setting.component.html',
})
export class ListSettingComponent {
  // ── Options state
  privateProfile = signal(false);
  isCompany = signal(false);
  themeDark = signal(true);

  // ── Handle form
  handleForm = new FormGroup({
    handle: new FormControl<string>('', [
      Validators.required,
      Validators.maxLength(20),
      Validators.pattern(/^[a-zA-Z0-9_-]+$/),
    ]),
  });
  saving = signal(false);
  basePath = 'profile'; // เปลี่ยนเป็น path จริงของคุณได้
  profileUrl = computed(() => {
    const h = this.handleForm.controls.handle.value?.trim() || 'your-handle';
    return `${this.basePath}/${h}`;
  });

  constructor() {
    // sync theme toggle (เดโม่): เพิ่ม/ลบ class 'dark' ที่ <html>
    effect(() => {
      const dark = this.themeDark();
      document.documentElement.classList.toggle('dark', dark);
    });
  }

  // ── Actions
  togglePrivate() { this.privateProfile.update(v => !v); }
  toggleProfileType() { this.isCompany.update(v => !v); }
  toggleTheme() { this.themeDark.update(v => !v); }

  copyProfileUrl() {
    navigator.clipboard.writeText(this.profileUrl()).catch(() => { });
  }

  changeEmail() {
    // TODO: เปิด modal หรือนำทางไปหน้าเปลี่ยนอีเมล
    alert('Change email action');
  }

  changePassword() {
    // TODO: เปิด modal หรือนำทางไปหน้าเปลี่ยนรหัสผ่าน
    alert('Change password action');
  }

  saveHandle() {
    this.handleForm.markAllAsTouched();
    if (this.handleForm.invalid) return;
    this.saving.set(true);
    // จำลองเรียก API
    setTimeout(() => this.saving.set(false), 800);
  }

  deleteAccount() {
    // ใส่ยืนยันง่าย ๆ (ควรใช้ modal จริงในโปรดักชัน)
    if (confirm('ยืนยันลบบัญชีถาวรหรือไม่?')) {
      alert('Deleted (demo)');
    }
  }
}
