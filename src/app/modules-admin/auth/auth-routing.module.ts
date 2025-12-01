// src/app/modules/auth/auth-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { NewPasswordComponent } from './pages/new-password/new-password.component';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { TwoStepsComponent } from './pages/two-steps/two-steps.component';
import { PolicyConsentComponent } from 'src/app/shared/components/policy-conset/policy-conset.component';
import { GuestGuard } from 'src/app/core/guards/guest.guard'; // 👈 import guard ใหม่

const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
    canActivateChild: [GuestGuard],   // 👈 กันทั้งกลุ่ม auth/*
    children: [
      { path: '', redirectTo: 'sign-in', pathMatch: 'full' },
      {
        path: 'sign-in',
        component: SignInComponent,
        data: { returnUrl: window.location.pathname },
      },
      { path: 'sign-up', component: SignUpComponent },
      { path: 'policy', component: PolicyConsentComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'new-password', component: NewPasswordComponent },
      { path: 'two-steps', component: TwoStepsComponent },
      { path: '**', redirectTo: 'sign-in', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule { }
