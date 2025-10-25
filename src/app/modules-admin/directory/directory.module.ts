import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DirectoryRoutingModule } from './directory-routing.module';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from 'src/app/core/guards/token.interceptor';
import { AuthErrorInterceptor } from 'src/app/core/guards/auth-error.interceptor';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    DirectoryRoutingModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthErrorInterceptor, multi: true },
  ]

})
export class DirectoryModule { }
