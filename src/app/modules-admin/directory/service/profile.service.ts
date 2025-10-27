import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private api = `${environment.apiUrl}/profile`;

  constructor(private http: HttpClient) { }

  /** ดึงโปรไฟล์ของผู้ใช้ปัจจุบัน */
  getProfile(): Observable<any /* ProfileDto & { avatarUrl?: string } */> {
    return this.http.get(`${this.api}/me`);
  }

  // ---------- JSON ONLY ----------
  /** บันทึก/สร้างโปรไฟล์ (JSON) */
  saveProfile(profileData: any /* ProfilePayload */): Observable<any> {
    return this.http.post(`${this.api}/save`, profileData);
  }

  /** อัปเดตโปรไฟล์ (JSON) */
  updateProfile(profileData: any /* ProfilePayload */): Observable<any> {
    return this.http.put(`${this.api}/me`, profileData);
  }

  // ---------- MULTIPART (JSON + avatar) ----------
  /** บันทึก/สร้างโปรไฟล์ (multipart: json + avatar) */
  saveProfileMultipart(profileData: any /* ProfilePayload */, avatarFile: File): Observable<any> {
    const fd = this.buildMultipart(profileData, avatarFile);
    return this.http.post(`${this.api}/save`, fd);
  }

  /** อัปเดตโปรไฟล์ (multipart: json + avatar) */
  updateProfileMultipart(profileData: any /* ProfilePayload */, avatarFile: File): Observable<any> {
    const fd = this.buildMultipart(profileData, avatarFile);
    return this.http.put(`${this.api}/me`, fd);
  }

  // ---------- AVATAR ONLY ----------
  /** อัปโหลด/เปลี่ยน avatar อย่างเดียว */
  uploadAvatar(avatarFile: File): Observable<any> {
    const fd = new FormData();
    fd.append('avatar', avatarFile);
    return this.http.put(`${this.api}/avatar`, fd);
  }

  /** ลบ avatar */
  deleteAvatar(): Observable<any> {
    return this.http.delete(`${this.api}/avatar`);
  }

  // ---------- Helper ----------
  private buildMultipart(profileData: any, avatarFile?: File): FormData {
    const fd = new FormData();
    fd.append('json', new Blob([JSON.stringify(profileData)], { type: 'application/json' }));
    if (avatarFile) fd.append('avatar', avatarFile);
    return fd;
  }

  /**
   * ทางเลือก: เมธอดเดียวจบ (จะเลือก JSON หรือ Multipart ให้อัตโนมัติ)
   * @param isNew true = POST /save, false = PUT /me
   */
  saveOrUpdate(profileData: any, avatarFile?: File, isNew: boolean = false): Observable<any> {
    if (avatarFile) {
      return isNew
        ? this.saveProfileMultipart(profileData, avatarFile)
        : this.updateProfileMultipart(profileData, avatarFile);
    }
    return isNew ? this.saveProfile(profileData) : this.updateProfile(profileData);
  }
}
