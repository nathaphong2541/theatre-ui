import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/guest.guard';
import { LangGuard } from './core/guards/lang.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'en',
    pathMatch: 'full',
  },

  {
    path: ':lang',
    canActivate: [LangGuard],

    children: [
      // ================= ADMIN =================
      // ⚠️ ต้องอยู่ก่อน path: ''
      {
        path: 'directory',

        canMatch: [AuthGuard],

        loadChildren: () => import('./modules-admin/layout/layout.module').then((m) => m.LayoutModule),
      },

      {
        path: 'admin',

        canMatch: [AuthGuard],

        data: {
          role: 'ADMIN',
        },

        loadChildren: () => import('./modules-admin/layout/layout.module').then((m) => m.LayoutModule),
      },

      // ================= AUTH =================
      {
        path: 'auth',

        canMatch: [GuestGuard],

        loadChildren: () => import('./modules/auth/auth.module').then((m) => m.AuthModule),
      },

      // ================= ERRORS =================
      {
        path: 'errors',

        loadChildren: () => import('./modules/error/error.module').then((m) => m.ErrorModule),
      },

      // ================= USER =================
      // ⚠️ ต้องอยู่ล่างสุด
      {
        path: '',

        loadChildren: () => import('./modules/layout/layout.module').then((m) => m.LayoutModule),
      },

      // ================= 404 =================
      {
        path: '**',
        redirectTo: 'errors/404',
      },
    ],
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      anchorScrolling: 'enabled',
      scrollPositionRestoration: 'enabled',
      scrollOffset: [0, 80],
      onSameUrlNavigation: 'reload',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
