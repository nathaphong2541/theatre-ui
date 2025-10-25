// src/app/core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanMatch, Route, UrlSegment, Router, UrlTree } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AuthService } from 'src/app/modules/auth/service/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanMatch {
    constructor(private auth: AuthService, private router: Router) { }

    canMatch(route: Route, segments: UrlSegment[]): Observable<boolean | UrlTree> {
        return this.auth.isLoggedIn$.pipe(
            map(loggedIn => {
                if (loggedIn) return true;
                const lang = segments.length > 0 ? segments[0].path : 'en';
                return this.router.parseUrl(`/${lang}/auth/sign-in`);
            })
        );
    }
}
