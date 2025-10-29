import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Profile {
  id?: number;
  userId?: number;
  privateProfile?: boolean;
  profileIsCompany?: boolean;
  firstName?: string;
  lastName?: string;
  pronouns?: string;
  title?: string;
  location?: string;
  email?: string;
  phone?: string;
  website?: string;
  multiLang?: boolean;
  travel?: boolean;
  tour?: boolean;
  about?: string;
  education?: string;
  video1?: string;
  video2?: string;
  workLocations?: number[];
  unions?: number[];
  experience?: number[];
  partners?: number[];
  genders?: number[];
  races?: number[];
  additionals?: number[];
  credits?: number[];
  avatarUrl?: string;
  coverUrl?: string;
  galleryUrls?: string[];
  createdAt?: string;
  updatedAt?: string;
  recordStatus?: 'A' | 'I';
  delFlag?: 'Y' | 'N';
  // memberCode?: string;
  // rating?: number; orders?: number; startedYear?: number;
}

export type Paged<T> = { items: T[]; total: number };

@Injectable({ providedIn: 'root' })
export class InfoSearchService {
  private api = `${environment.apiUrl}/profiles`;
  constructor(private http: HttpClient) { }

  /** ค้นหา + กรอง + แบ่งหน้า (UI ใช้ page แบบ 1-based; แปลงเป็น 0-based ก่อนส่ง) */
  searchProfiles(opts: {
    q?: string;
    status?: string;     // ถ้าแบ็กเอนด์รองรับค่อยส่ง
    page?: number;       // 1-based ใน UI
    limit?: number;      // map ไปเป็น size
  }): Observable<Paged<Profile>> {

    const pageZero = Math.max(0, (opts.page ?? 1) - 1); // 0-based
    const size = opts.limit ?? 12;

    let params = new HttpParams()
      .set('page', String(pageZero))
      .set('size', String(size));

    if (opts.q) params = params.set('q', opts.q);
    if (opts.status) params = params.set('status', opts.status); // ใช้ได้ถ้า API รองรับ

    return this.http.get<any>(this.api, { params }).pipe(
      map(res => {
        // รูปแบบ Spring Data Page
        if (res?.content && Array.isArray(res.content)) {
          return { items: res.content as Profile[], total: res.totalElements ?? res.content.length };
        }
        // รูปแบบ fallback อื่น ๆ
        if (Array.isArray(res)) return { items: res as Profile[], total: res.length };
        if (res?.data && Array.isArray(res.data)) return { items: res.data, total: res.total ?? res.data.length };
        if (res?.items) return { items: res.items, total: res.total ?? res.items.length };
        return { items: [], total: 0 };
      })
    );
  }
}
