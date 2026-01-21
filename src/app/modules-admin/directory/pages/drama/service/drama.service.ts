// src/app/modules-admin/directory/pages/drama/service/drama.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { Drama } from '../models/drama.model';

@Injectable({
    providedIn: 'root',
})
export class DramaService {
    private baseUrl = `${environment.apiUrl}/scripts`; // => http://localhost:8080/api/scripts

    constructor(private http: HttpClient) { }

    // ========== ของเดิม (ตัวอย่าง) ==========
    createDrama(formData: FormData): Observable<Drama> {
        return this.http.post<Drama>(this.baseUrl, formData);
    }

    getMyDramas(): Observable<Drama[]> {
        // ถ้า backend ของคุณใช้ path อื่น เช่น /scripts/my ก็แก้ตรงนี้เอา
        return this.http.get<Drama[]>(this.baseUrl);
    }

    deleteDrama(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    // ========== ที่ขอเพิ่ม ==========
    /**
     * ดึงรายละเอียดบทละครตาม id
     * ใช้ทั้งตอน edit และตอน view
     */
    getDramaById(id: number): Observable<Drama> {
        return this.http.get<Drama>(`${this.baseUrl}/${id}`);
    }

    getMyDramasMe(): Observable<Drama[]> {
        return this.http.get<Drama[]>(
            `${this.baseUrl}/me`,
            { withCredentials: true }
        );
    }

    // ================= GET (owner-only) =================
    getMyDramaById(id: number): Observable<Drama> {
        return this.http.get<Drama>(
            `${this.baseUrl}/me/${id}`,
            { withCredentials: true }
        );
    }

    /**
     * อัปเดตบทละคร (ใช้ FormData เหมือน create)
     * รองรับการส่ง pdf ใหม่ + รูปใหม่
     */
    updateDrama(id: number, formData: FormData): Observable<Drama> {
        return this.http.put<Drama>(`${this.baseUrl}/${id}`, formData);
    }
}
