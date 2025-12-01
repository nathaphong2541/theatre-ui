import { Injectable } from '@angular/core';
import {
    CanMatch,
    Route,
    Router,
    UrlSegment,
    UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/modules/auth/service/auth.service';

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanMatch {

    constructor(
        private auth: AuthService,
        private router: Router
    ) { }

    canMatch(
        route: Route,
        segments: UrlSegment[]
    ): Observable<boolean | UrlTree> {

        // 1) ถ้ารู้แน่ ๆ ว่าล็อกอินแล้วจาก state ปัจจุบัน → redirect ทันที
        if (this.auth.isLoggedIn) {
            return of(this.redirectForLoggedIn(segments));
        }

        // 2) ถ้าเพิ่งรีเฟรชหน้า ยังไม่รู้ว่า login ไหม → ให้ guard เช็ค session เอง
        return this.auth.checkSession().pipe(
            map(me => {
                const loggedIn = !!me || this.auth.isLoggedIn;

                if (!loggedIn) {
                    // ยังไม่ login → ปล่อยให้เข้า /:lang/auth/* ได้ปกติ
                    return true;
                }

                // login แล้ว → redirect ออกไป
                return this.redirectForLoggedIn(segments);
            })
        );
    }

    /** หา lang แล้ว redirect ไปหน้าอื่นเวลาล็อกอินแล้ว */
    private redirectForLoggedIn(segments: UrlSegment[]): UrlTree {
        // segments จะเป็นประมาณ ['en', 'auth', 'new-password']
        const lang = segments.length > 0 ? segments[0].path : 'en';

        // อยากให้ไปหน้าไหน ปรับตรงนี้
        return this.router.parseUrl(`/${lang}`);
        // หรือ dashboard:
        // return this.router.parseUrl(`/${lang}/directory/dashboard`);
    }
}
