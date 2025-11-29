import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Drama } from '../models/drama.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class DramaService {
    private baseUrl = `${environment.apiUrl}/scripts`;
    constructor(private http: HttpClient) { }

    getMyDramas(): Observable<Drama[]> {
        return this.http.get<Drama[]>(`${this.baseUrl}`);
    }

    deleteDrama(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    // ✅ ใช้สำหรับอัปโหลดบทละครใหม่
    createDrama(formData: FormData): Observable<Drama> {
        return this.http.post<Drama>(`${this.baseUrl}`, formData);
    }
}
