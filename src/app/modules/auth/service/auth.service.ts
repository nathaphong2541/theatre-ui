// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export type MeResponse = { firstName: string; lastName: string, email: string };
export type RegisterRequest = {
  policyConfirm: boolean;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = `${environment.apiUrl}/auth`;

  private _isLoggedIn$ = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this._isLoggedIn$.asObservable();

  private _user$ = new BehaviorSubject<MeResponse | null>(null);
  user$ = this._user$.asObservable();

  private _sessionChecked = false;
  private _sessionCheck$?: Observable<MeResponse | null>;

  constructor(private http: HttpClient) { }

  /** เรียกครั้งแรกของแอป/หลังรีเฟรช — จะเรียก /me เฉพาะกรณีมี flag จากการ login แล้วเท่านั้น */
  checkSession(force = false): Observable<MeResponse | null> {
    // ไม่มี flag ก็ไม่ต้องยิง /me
    if (!force && sessionStorage.getItem('hasAppSession') !== '1') {
      this._isLoggedIn$.next(false);
      this._user$.next(null);
      return of(null);
    }
    if (!force && this._sessionChecked && this._sessionCheck$) return this._sessionCheck$;

    this._sessionChecked = true;
    this._sessionCheck$ = this.http.get<MeResponse>(`${this.api}/me`, { withCredentials: true }).pipe(
      tap(me => {
        this._isLoggedIn$.next(true);
        this._user$.next(me);
      }),
      catchError(() => {
        this._isLoggedIn$.next(false);
        this._user$.next(null);
        // ถ้า cookie หมดอายุ ให้ลบ flag ด้วย
        sessionStorage.removeItem('hasAppSession');
        return of(null);
      }),
      shareReplay(1)
    );
    return this._sessionCheck$;
  }

  login(email: string, password: string, remember = true): Observable<void> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<{ user?: MeResponse }>(
      `${this.api}/login`,
      { email, password, remember },
      { headers, withCredentials: true }
    ).pipe(
      tap(() => {
        // ตั้ง flag ให้รู้ว่า login สำเร็จ
        sessionStorage.setItem('hasAppSession', '1');
        this._isLoggedIn$.next(true);
        this._sessionChecked = false; // รีเซ็ตให้ /me ยิงได้
        this._sessionCheck$ = undefined;
      }),
      // ✅ ยิง /me หลังจาก login เสร็จเท่านั้น
      // เพื่อให้ข้อมูลจาก backend ล่าสุด
      switchMap(() => this.checkSession(true).pipe(
        catchError(() => of(null)),
        tap(me => {
          if (me) this._user$.next(me);
        }),
        map(() => void 0)
      ))
    );
  }

  logout(): Observable<void> {
    return this.http.post(`${this.api}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this._isLoggedIn$.next(false);
        this._user$.next(null);
        sessionStorage.removeItem('hasAppSession');
        this._sessionChecked = false;
        this._sessionCheck$ = undefined;
      }),
      map(() => void 0)
    );
  }

  get isLoggedIn(): boolean {
    return this._isLoggedIn$.value === true;
  }

  register(data: RegisterRequest, autoLogin = true): Observable<void> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http
      .post<void>(`${this.api}/register`, data, { headers, withCredentials: true })
      .pipe(
      );
  }
}
