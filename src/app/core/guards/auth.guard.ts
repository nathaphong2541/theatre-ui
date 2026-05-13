import { Injectable } from '@angular/core';
import { CanMatch, Route, UrlSegment, Router, UrlTree } from '@angular/router';

import { map, Observable } from 'rxjs';

import { AuthService } from 'src/app/modules/auth/service/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanMatch {
  constructor(private auth: AuthService, private router: Router) {}

  canMatch(route: Route, segments: UrlSegment[]): Observable<boolean | UrlTree> {
    return this.auth.user$.pipe(
      map((user) => {
        const lang = segments.length > 0 ? segments[0].path : 'en';

        // ================= NOT LOGIN =================
        if (!user) {
          return this.router.parseUrl(`/${lang}/auth/sign-in`);
        }

        // ================= ROLE CHECK =================
        const requiredRole = route.data?.['role'];

        if (requiredRole) {
          // รองรับทั้ง:
          // role: 'ADMIN'
          // role: ['ADMIN', 'USER']

          const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

          if (!roles.includes(user.role)) {
            return this.router.parseUrl(`/${lang}`);
          }
        }

        return true;
      }),
    );
  }
}
