import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/modules/auth/service/auth.service';

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

  handleForm = new FormGroup({
    handle: new FormControl<string>('', [
      Validators.required,
      Validators.maxLength(20),
      Validators.pattern(/^[a-zA-Z0-9_-]+$/),
    ]),
  });

  saving = signal(false);
  basePath = 'profile';
  profileUrl = computed(() => {
    const h = this.handleForm.controls.handle.value?.trim() || 'your-handle';
    return `${this.basePath}/${h}`;
  });

  // ── Popup state
  showChangeEmail = signal(false);
  showChangePassword = signal(false);
  showDeleteConfirm = signal(false);

  // ── Loading state
  isChangingEmail = signal(false);
  isChangingPassword = signal(false);
  isDeletingAccount = signal(false);

  // ── Forms for modals
  changeEmailForm = new FormGroup({
    newEmail: new FormControl<string>('', [Validators.required, Validators.email]),
    currentPassword: new FormControl<string>('', [Validators.required]),
  });

  changePasswordForm = new FormGroup({
    currentPassword: new FormControl<string>('', [Validators.required]),
    newPassword: new FormControl<string>('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl<string>('', [Validators.required]),
  });

  deleteAccountForm = new FormGroup({
    confirmText: new FormControl<string>('', [Validators.required]),
  });

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {
    // theme sync
    effect(() => {
      document.documentElement.classList.toggle('dark', this.themeDark());
    });
  }

  // ───────────────────────────────
  //  Derived states
  // ───────────────────────────────
  get passwordMismatch(): boolean {
    const { newPassword, confirmPassword } = this.changePasswordForm.value;
    return !!newPassword && !!confirmPassword && newPassword !== confirmPassword;
  }

  get canDeleteAccount(): boolean {
    return this.deleteAccountForm.controls.confirmText.value === 'DELETE';
  }

  // ───────────────────────────────
  //  Popup open/close handlers
  // ───────────────────────────────
  changeEmail() {
    this.changeEmailForm.reset();
    this.showChangeEmail.set(true);
  }

  closeChangeEmail() {
    this.showChangeEmail.set(false);
  }

  changePassword() {
    this.changePasswordForm.reset();
    this.showChangePassword.set(true);
  }

  closeChangePassword() {
    this.showChangePassword.set(false);
  }

  deleteAccount() {
    this.deleteAccountForm.reset();
    this.showDeleteConfirm.set(true);
  }

  closeDeleteAccount() {
    this.showDeleteConfirm.set(false);
  }

  // ───────────────────────────────
  //  Submit handlers
  // ───────────────────────────────
  submitChangeEmail() {
    this.changeEmailForm.markAllAsTouched();
    if (this.changeEmailForm.invalid) return;

    const { newEmail, currentPassword } = this.changeEmailForm.value;
    if (!newEmail || !currentPassword) return;

    this.isChangingEmail.set(true);
    this.auth.changeEmail(newEmail.trim(), currentPassword).subscribe({
      next: () => {
        this.isChangingEmail.set(false);
        this.showChangeEmail.set(false);
        this.toast.success('Your email has been updated successfully.', {
          title: 'Success',
          duration: 3000,
        });
      },
      error: (err) => {
        this.isChangingEmail.set(false);
        const msg =
          err?.error?.message ||
          'Unable to change email at the moment. Please try again.';
        this.toast.error(msg, {
          title: 'Error',
          duration: 4000,
        });
      },
    });
  }

  submitChangePassword() {
    this.changePasswordForm.markAllAsTouched();
    if (this.changePasswordForm.invalid || this.passwordMismatch) return;

    const { currentPassword, newPassword } = this.changePasswordForm.value;
    if (!currentPassword || !newPassword) return;

    this.isChangingPassword.set(true);
    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.showChangePassword.set(false);

        this.toast.success('Your password has been updated successfully.', {
          title: 'Success',
          duration: 3000,
          onTimeout: () => {
            // logout แล้วพากลับไปหน้า sign-in
            this.auth.logout().subscribe(() => {
              this.router.navigate(['/auth/sign-in']);
            });
          },
        });
      },
      error: (err) => {
        this.isChangingPassword.set(false);
        const msg =
          err?.error?.message ||
          'Unable to change password. Please try again.';
        this.toast.error(msg, {
          title: 'Error',
          duration: 4000,
        });
      },
    });
  }

  submitDeleteAccount() {
    this.deleteAccountForm.markAllAsTouched();
    if (!this.canDeleteAccount) return;

    this.isDeletingAccount.set(true);
    this.auth.deleteAccount().subscribe({
      next: () => {
        this.isDeletingAccount.set(false);
        this.showDeleteConfirm.set(false);
        this.toast.success('Your account has been deleted.', {
          title: 'Account Deleted',
          duration: 3000,
          onTimeout: () => {
            this.router.navigate(['/']);
          },
        });
      },
      error: (err) => {
        this.isDeletingAccount.set(false);
        const msg =
          err?.error?.message ||
          'Unable to delete account at the moment.';
        this.toast.error(msg, {
          title: 'Error',
          duration: 4000,
        });
      },
    });
  }

  // ───────────────────────────────
  // extras
  // ───────────────────────────────
  togglePrivate() { this.privateProfile.update(v => !v); }
  toggleProfileType() { this.isCompany.update(v => !v); }
  toggleTheme() { this.themeDark.update(v => !v); }

  copyProfileUrl() {
    navigator.clipboard.writeText(this.profileUrl()).then(
      () => this.toast.success('Link copied successfully.', { title: 'Copied', duration: 2000 }),
      () => this.toast.error('Failed to copy link.', { title: 'Error', duration: 3000 })
    );
  }

  saveHandle() {
    this.handleForm.markAllAsTouched();
    if (this.handleForm.invalid) return;
    this.saving.set(true);

    // TODO: call API จริง
    setTimeout(() => {
      this.saving.set(false);
      this.toast.success('Your profile link has been updated.', {
        title: 'Saved',
        duration: 2500,
      });
    }, 800);
  }
}
