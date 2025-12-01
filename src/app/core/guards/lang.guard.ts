import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    Router,
    RouterStateSnapshot,
    UrlTree,
} from '@angular/router';

@Injectable({ providedIn: 'root' })
export class LangGuard implements CanActivate {
    // ภาษาที่ระบบรองรับ
    private readonly allowedLangs = ['en', 'th']; // เพิ่มได้ตามจริง
    private readonly defaultLang = 'en';

    constructor(private router: Router) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean | UrlTree {
        const lang = route.params['lang'];

        // ✅ ภาษาถูกต้อง → ผ่านเลย
        if (this.allowedLangs.includes(lang)) {
            return true;
        }

        // ❌ ภาษาผิด → แปลง URL ให้เป็น defaultLang แทน
        // ตัวอย่าง: /auth            -> /en
        //          /xx/auth/sign-in  -> /en/auth/sign-in

        const originalUrl = state.url; // เช่น /auth หรือ /xx/auth/sign-in

        // ตัด segment แรก (ที่เป็น lang ผิด) ทิ้ง
        const rest = originalUrl.replace(/^\/[^\/]+/, ''); // remove "/something"

        // ประกอบ URL ใหม่ด้วย defaultLang
        const target = `/${this.defaultLang}${rest || ''}`;

        return this.router.parseUrl(target);
    }
}
