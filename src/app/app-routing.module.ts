import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'en', pathMatch: 'full' },

  {
    path: ':lang',
    children: [
      // ✅ PUBLIC — เข้าตรง /en ได้เลย
      {
        path: '',
        loadChildren: () =>
          import('./modules/layout/layout.module').then((m) => m.LayoutModule),
      },

      // ✅ PRIVATE — ต้องล็อกอินก่อน (ค่อยเด้งไป login)
      {
        path: 'directory',
        canMatch: [AuthGuard],        // <— ใช้ canMatch กันตั้งแต่จับคู่ route
        loadChildren: () =>
          import('./modules-admin/layout/layout.module').then((m) => m.LayoutModule),
      },

      // ✅ AUTH — เปิดเสมอ
      {
        path: 'auth',
        loadChildren: () =>
          import('./modules/auth/auth.module').then((m) => m.AuthModule),
      },

      {
        path: 'errors',
        loadChildren: () =>
          import('./modules/error/error.module').then((m) => m.ErrorModule),
      },
      { path: '**', redirectTo: 'errors/404' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    anchorScrolling: 'enabled',
    scrollPositionRestoration: 'enabled',
    scrollOffset: [0, 80], // เผื่อความสูง navbar (ปรับได้)
    onSameUrlNavigation: 'reload', // ให้เลื่อนซ้ำได้แม้อยู่หน้าเดิม
  })],
  exports: [RouterModule],

})
export class AppRoutingModule { }
