// src/app/core/services/onboarding.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
    private dismissKey = 'thaitheatre_profile_onboarding_dismissed';

    constructor(private http: HttpClient) { }

    // เรียก API เช็คว่า user สร้างโปรไฟล์แล้วหรือยัง
    checkProfileCompleted(): Observable<boolean> {
        // ปรับ URL ให้ตรงกับ backend จริงของคุณ
        return this.http.get<any>('/api/me').pipe(
            map((res) => !!res?.profileCompleted)
        );
    }

    isDismissed(): boolean {
        return localStorage.getItem(this.dismissKey) === 'true';
    }

    setDismissed(): void {
        localStorage.setItem(this.dismissKey, 'true');
    }
}
