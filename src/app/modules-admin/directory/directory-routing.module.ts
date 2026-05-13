import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DirectoryComponent } from './directory.component';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { SettingComponent } from './pages/setting/setting.component';

import { HandleProfileComponent } from './components/profile/handle-profile/handle-profile.component';

import { ListDramaComponent } from './components/drama/list-drama/list-drama.component';
import { HandleDramaComponent } from './components/drama/handle-drama/handle-drama.component';

const routes: Routes = [
  {
    path: '',
    component: DirectoryComponent,

    children: [
      // ================= DEFAULT =================
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

      // =========================================================
      // USER ONLY
      // =========================================================

      {
        path: 'dashboard',
        component: DashboardComponent,

        data: {
          role: 'USER',
        },
      },

      {
        path: 'profile-new',
        component: HandleProfileComponent,

        data: {
          role: 'USER',
        },
      },

      {
        path: 'profile/:id',
        component: HandleProfileComponent,

        data: {
          role: 'USER',
        },
      },

      {
        path: 'setting',
        component: SettingComponent,

        data: {
          role: 'USER',
        },
      },

      {
        path: 'script/new',
        component: HandleDramaComponent,

        data: {
          role: 'USER',
        },
      },

      // =========================================================
      // USER + USER
      // =========================================================

      {
        path: 'profile',
        component: ProfileComponent,

        data: {
          role: 'USER',
        },
      },

      {
        path: 'script',
        component: ListDramaComponent,

        data: {
          role: 'USER',
        },
      },

      {
        path: 'script/:id',
        component: HandleDramaComponent,

        data: {
          role: 'USER',
        },
      },

      {
        path: 'script/view/:id',
        component: HandleDramaComponent,

        data: {
          role: 'USER',
        },
      },

      // ================= MASTER =================

      {
        path: 'department',
        component: DashboardComponent,
        data: {
          role: 'ADMIN',
        },
      },

      {
        path: 'work-locations',
        component: DashboardComponent,
        data: {
          role: 'ADMIN',
        },
      },

      {
        path: 'memberships',
        component: DashboardComponent,
        data: {
          role: 'ADMIN',
        },
      },

      {
        path: 'experience-levels',
        component: DashboardComponent,
        data: {
          role: 'ADMIN',
        },
      },

      {
        path: 'partner-directories',
        component: DashboardComponent,
        data: {
          role: 'ADMIN',
        },
      },

      {
        path: 'gender-identity',
        component: DashboardComponent,
        data: {
          role: 'ADMIN',
        },
      },

      {
        path: 'personal-identity',
        component: DashboardComponent,
        data: {
          role: 'ADMIN',
        },
      },

      {
        path: 'racial-identity',
        component: DashboardComponent,
        data: {
          role: 'ADMIN',
        },
      },

      {
        path: 'profession',
        component: DashboardComponent,
        data: {
          role: 'ADMIN',
        },
      },

      // ================= 404 =================
      {
        path: '**',
        redirectTo: '/en/errors/404',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DirectoryRoutingModule {}
