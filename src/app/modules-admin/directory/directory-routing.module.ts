import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DirectoryComponent } from './directory.component';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { SettingComponent } from './pages/setting/setting.component';

import { HandleProfileComponent } from './components/profile/handle-profile/handle-profile.component';

import { ListDramaComponent } from './components/drama/list-drama/list-drama.component';
import { HandleDramaComponent } from './components/drama/handle-drama/handle-drama.component';
import { DepartmentComponent } from './components/admin/department/department.component';
import { WorkLocaltionComponent } from './components/admin/work-localtion/work-localtion.component';
import { UnionsComponent } from './components/admin/unions/unions.component';
import { ExperienceLevelComponent } from './components/admin/experience-level/experience-level.component';
import { PartnerDirectoriesComponent } from './components/admin/partner-directories/partner-directories.component';
import { GenderComponent } from './components/admin/gender/gender.component';
import { PersonalComponent } from './components/admin/personal/personal.component';
import { RacialComponent } from './components/admin/racial/racial.component';
import { ProfessionComponent } from './components/admin/profession/profession.component';

const routes: Routes = [
  {
    path: '',
    component: DirectoryComponent,

    children: [
      // =====================================================
      // DEFAULT
      // =====================================================

      {
        path: '',
        component: DashboardComponent,
      },

      // =====================================================
      // USER
      // =====================================================

      {
        path: 'profile',
        component: ProfileComponent,

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
        path: 'script',
        component: ListDramaComponent,

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

      // =====================================================
      // ADMIN
      // =====================================================

      {
        path: 'dashboard',
        component: DashboardComponent,

        data: {
          role: 'ADMIN',
        },
      },

      {
        path: 'department',
        component: DepartmentComponent,

        data: {
          role: 'ADMIN',
        },
      },

      {
        path: 'work-locations',
        component: WorkLocaltionComponent,

        data: {
          role: 'ADMIN',
        },
      },

      {
        path: 'unions',
        component: UnionsComponent,

        data: {
          role: 'ADMIN',
        },
      },

      {
        path: 'experience-levels',
        component: ExperienceLevelComponent,

        data: {
          role: 'ADMIN',
        },
      },

      {
        path: 'partner-directories',
        component: PartnerDirectoriesComponent,

        data: {
          role: 'ADMIN',
        },
      },

      {
        path: 'gender-identity',
        component: GenderComponent,

        data: {
          role: 'ADMIN',
        },
      },

      {
        path: 'personal-identity',
        component: PersonalComponent,

        data: {
          role: 'ADMIN',
        },
      },

      {
        path: 'racial-identity',
        component: RacialComponent,

        data: {
          role: 'ADMIN',
        },
      },

      {
        path: 'profession',
        component: ProfessionComponent,

        data: {
          role: 'ADMIN',
        },
      },

      // =====================================================
      // 404
      // =====================================================

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
