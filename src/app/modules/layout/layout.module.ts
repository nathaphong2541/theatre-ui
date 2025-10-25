import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { LayoutRoutingModule } from './layout-routing.module';
import { TokenInterceptor } from 'src/app/core/guards/token.interceptor';
@NgModule({
    imports: [LayoutRoutingModule, AngularSvgIconModule.forRoot()],
    providers: [
        provideHttpClient(withInterceptorsFromDi()),
        {
            provide: HTTP_INTERCEPTORS,
            useClass: TokenInterceptor,
            multi: true
        }
    ]
})
export class LayoutModule { }
