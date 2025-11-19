import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface CreditItem {
  company: string;
  title: string;
  startYear: string;
  endYear: string;
  current: boolean;
  venue: string;
  jobLocation: string;
  internship: boolean;
  fellowship: boolean;
  deptIds: number[];
  posIds: number[];
  skillIds: number[];
}

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
  credits: CreditItem[];
  avatarUrl?: string;
  coverUrl?: string;
  galleryUrls?: string[];
  createdAt?: string;
  updatedAt?: string;
  recordStatus?: 'A' | 'I';
  delFlag?: 'Y' | 'N';

  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
}

export type Paged<T> = { items: T[]; total: number };

// ✅ options ที่แม็ปตรงกับ ProfileSearchRequest ฝั่ง Java
export interface ProfileSearchOptions {
  q?: string;
  status?: string;  // ถ้าแบ็กเอนด์ใช้ก็ส่งได้

  // paging
  page?: number;    // 1-based จาก UI
  limit?: number;   // map ไปเป็น size

  // วันที่ (ถ้าใช้)
  dateFrom?: string;
  dateTo?: string;

  // filter จาก credits
  creditDeptIds?: number[];
  creditPosIds?: number[];
  creditSkillIds?: number[];

  // ถ้ามีใน backend ค่อยใช้เพิ่ม:
  locations?: string[];
  experiences?: string[];
  unions?: string[];
}

@Injectable({ providedIn: 'root' })
export class InfoSearchService {
  private api = `${environment.apiUrl}/profiles`;

  constructor(private http: HttpClient) { }

  /** ค้นหา + กรอง + แบ่งหน้า (UI ใช้ page แบบ 1-based; แปลงเป็น 0-based ก่อนส่ง) */
  searchProfiles(opts: ProfileSearchOptions): Observable<Paged<Profile>> {
    const pageZero = Math.max(0, (opts.page ?? 1) - 1); // 0-based
    const size = opts.limit ?? 12;

    let params = new HttpParams()
      .set('page', String(pageZero))
      .set('size', String(size));

    // ---- single value ----
    if (opts.q?.trim()) params = params.set('q', opts.q.trim());
    if (opts.status) params = params.set('status', opts.status);
    if (opts.dateFrom) params = params.set('dateFrom', opts.dateFrom);
    if (opts.dateTo) params = params.set('dateTo', opts.dateTo);

    // ---- helper สำหรับ list ----
    const appendList = (key: string, list?: (number | string)[]) => {
      if (!list || !list.length) return;
      list.forEach(v => {
        params = params.append(key, String(v));
      });
    };

    // ✅ ชื่อ key ต้องตรงกับ field ใน ProfileSearchRequest ฝั่ง Java
    appendList('creditDeptIds', opts.creditDeptIds);
    appendList('creditPosIds', opts.creditPosIds);
    appendList('creditSkillIds', opts.creditSkillIds);

    appendList('locations', opts.locations);
    appendList('experiences', opts.experiences);
    appendList('unions', opts.unions);

    return this.http.get<any>(this.api, { params }).pipe(
      map(res => {
        // รูปแบบ Spring Data Page
        if (res?.content && Array.isArray(res.content)) {
          return {
            items: res.content as Profile[],
            total: res.totalElements ?? res.content.length,
          };
        }
        // fallback formats
        if (Array.isArray(res)) return { items: res as Profile[], total: res.length };
        if (res?.data && Array.isArray(res.data)) {
          return { items: res.data, total: res.total ?? res.data.length };
        }
        if (res?.items) {
          return { items: res.items, total: res.total ?? res.items.length };
        }
        return { items: [], total: 0 };
      })
    );
  }

  getProfileById(id: number): Observable<Profile> {
    return this.http.get<Profile>(`${this.api}/${id}`);
  }
}
