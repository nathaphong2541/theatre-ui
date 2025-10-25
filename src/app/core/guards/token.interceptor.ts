// token.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // หา token จากที่เก็บ (localStorage ก่อน แล้วค่อย sessionStorage)
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        if (token) {
            const authReq = req.clone({
                setHeaders: { Authorization: `Bearer ${token}` }
            });
            return next.handle(authReq);
        }
        return next.handle(req);
    }
}
