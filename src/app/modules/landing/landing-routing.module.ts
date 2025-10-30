import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './landing.component';
import { MainPagesComponent } from './pages/main-pages/main-pages.component';
import { SearchDetailComponent } from './components/info-search/search-detail/search-detail.component';

const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
    children: [
      { path: '', redirectTo: '', pathMatch: 'full' },
      { path: '', component: MainPagesComponent },
      { path: 'en/profiles/:id', component: SearchDetailComponent },
      { path: '**', redirectTo: 'errors/404' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LandingRoutingModule { }
