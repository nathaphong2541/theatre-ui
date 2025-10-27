import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DirectoryComponent } from './directory.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { SettingComponent } from './pages/setting/setting.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HandleProfileComponent } from './components/profile/handle-profile/handle-profile.component';

const routes: Routes = [
  {
    path: '',
    component: DirectoryComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'profile-new', component: HandleProfileComponent },
      { path: 'profile/:id', component: HandleProfileComponent },
      { path: 'setting', component: SettingComponent },
      { path: '**', redirectTo: 'errors/404' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DirectoryRoutingModule { }
