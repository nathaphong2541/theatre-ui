// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly TOKEN_NAME = 'access_token';
    private _isLoggedIn$ = new BehaviorSubject<boolean>(this.hasToken());
    readonly isLoggedIn$ = this._isLoggedIn$.asObservable();

    private getCookie(name: string): string | null {
        const m = document.cookie.split('; ').find(row => row.startsWith(name + '='));
        return m ? decodeURIComponent(m.split('=').slice(1).join('=')) : null;
    }

    hasToken(): boolean {
        return !!this.getCookie(this.TOKEN_NAME);
    }

    /** เรียกหลัง login/logout เสร็จ เพื่อรีเฟรชสถานะ */
    refreshLoginState(): void {
        this._isLoggedIn$.next(this.hasToken());
    }
}
