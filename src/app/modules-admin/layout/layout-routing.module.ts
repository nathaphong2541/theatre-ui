import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LayoutComponent } from './layout.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,

    children: [
      {
        path: '',
        loadChildren: () => import('../directory/directory.module').then((m) => m.DirectoryModule),
      },

      {
        path: 'components',
        loadChildren: () => import('../uikit/uikit.module').then((m) => m.UikitModule),
      },
    ],
  },

  {
    path: '**',
    redirectTo: '/en/errors/404',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LayoutRoutingModule {}
