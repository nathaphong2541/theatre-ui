import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class SignInCleanupGuard implements CanActivate {
    canActivate(): boolean {
        try { localStorage.clear(); } catch { }
        try { sessionStorage.clear(); } catch { }

        // ลบ cookie ที่ลบได้ (cookie ที่เป็น HttpOnly ลบจาก JS ไม่ได้)
        try {
            const cookies = document.cookie ? document.cookie.split('; ') : [];
            for (const c of cookies) {
                const eq = c.indexOf('=');
                const name = eq > -1 ? c.substring(0, eq) : c;

                // ลองลบหลาย path เผื่อ cookie ถูก set ไว้คนละ path
                document.cookie = `${name}=; Max-Age=0; path=/`;
                document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
            }
        } catch { }

        return true;
    }
}
