import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './landing.component';
import { MainPagesComponent } from './pages/main-pages/main-pages.component';
import { SearchDetailComponent } from './components/info-search/search-detail/search-detail.component';
import { AllScriptComponent } from './components/info-script/all-script/all-script.component';
import { DetailScriptComponent } from './components/info-script/detail-script/detail-script.component';
import { AllSearchComponent } from './components/info-search/all-search/all-search.component';
import { HowToUseComponent } from './components/info-about/how-to-use/how-to-use.component';

const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
    children: [
      { path: '', redirectTo: '', pathMatch: 'full' },
      { path: '', component: MainPagesComponent },
      { path: 'profiles/:id', component: SearchDetailComponent },
      { path: 'member', component: AllSearchComponent },
      { path: 'how-to-user', component: HowToUseComponent },
      { path: 'theatre-library', component: AllScriptComponent },
      { path: 'theatre-library-detail/:id', component: DetailScriptComponent },
      { path: '**', redirectTo: 'errors/404' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LandingRoutingModule { }
