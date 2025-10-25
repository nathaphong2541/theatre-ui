// src/app/core/interceptors/auth-error.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthErrorInterceptor implements HttpInterceptor {
    constructor(private router: Router) { }
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const withCreds = req.clone({ withCredentials: true });
        return next.handle(withCreds).pipe(
            catchError((err: HttpErrorResponse) => {
                if (err.status === 401) this.router.navigate(['/en/auth/sign-in']);
                return throwError(() => err);
            })
        );
    }
}
