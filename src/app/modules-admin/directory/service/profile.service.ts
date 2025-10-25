import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private api = `${environment.apiUrl}/profile`;

  constructor(private http: HttpClient) { }

  /** ดึงโปรไฟล์ของผู้ใช้ปัจจุบัน */
  getProfile(): Observable<any> {
    return this.http.get(`${this.api}/me`);
  }

  /** บันทึกหรือสร้างโปรไฟล์ใหม่ */
  saveProfile(profileData: any): Observable<any> {
    return this.http.post(`${this.api}/save`, profileData);
  }

  /** อัปเดตข้อมูลโปรไฟล์ */
  updateProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.api}/me`, profileData);
  }
}
