import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type MasterItem = {
  id: number;
  nameTh: string;
  nameEn: string;
  description: string;
};

export type MasterResponse = {
  items: MasterItem[];
  total: number;
};

@Injectable({
  providedIn: 'root'
})
export class PubilcService {

  private api = `${environment.apiUrlPubilc}/public`;

  constructor(private http: HttpClient) { }

  /** --------------------- Department --------------------- */
  getDepartment(): Observable<any> {
    return this.http.get<MasterResponse>(`${this.api}/departments`);
  }
  getDepartmentById(id: number): Observable<MasterItem> {
    return this.http.get<MasterItem>(`${this.api}/departments/${id}`);
  }

  /** --------------------- Position --------------------- */
  getPosition(): Observable<any> {
    return this.http.get<MasterResponse>(`${this.api}/positions`);
  }
  getPositionById(id: number): Observable<MasterItem> {
    return this.http.get<MasterItem>(`${this.api}/positions/${id}`);
  }

  /** --------------------- Skills --------------------- */
  getSkills(): Observable<any> {
    return this.http.get<MasterResponse>(`${this.api}/skills`);
  }
  getSkillById(id: number): Observable<MasterItem> {
    return this.http.get<MasterItem>(`${this.api}/skills/${id}`);
  }

  /** --------------------- Work Location --------------------- */
  getWorkLocaltion(): Observable<any> {
    return this.http.get<MasterResponse>(`${this.api}/work-locations`);
  }
  getWorkLocationById(id: number): Observable<MasterItem> {
    return this.http.get<MasterItem>(`${this.api}/work-locations/${id}`);
  }

  /** --------------------- Union Membership --------------------- */
  getUnionMembership(): Observable<any> {
    return this.http.get<MasterResponse>(`${this.api}/unions`);
  }
  getUnionMembershipById(id: number): Observable<MasterItem> {
    return this.http.get<MasterItem>(`${this.api}/unions/${id}`);
  }

  /** --------------------- Experience Level --------------------- */
  getExperienceLevel(): Observable<any> {
    return this.http.get<MasterResponse>(`${this.api}/experience-levels`);
  }
  getExperienceLevelById(id: number): Observable<MasterItem> {
    return this.http.get<MasterItem>(`${this.api}/experience-levels/${id}`);
  }

  /** --------------------- Personal Identity --------------------- */
  getPersonalIdentity(): Observable<any> {
    return this.http.get<MasterResponse>(`${this.api}/personal-identities`);
  }
  getPersonalIdentityById(id: number): Observable<MasterItem> {
    return this.http.get<MasterItem>(`${this.api}/personal-identities/${id}`);
  }

  /** --------------------- Racial Identity --------------------- */
  getRacialIdentity(): Observable<any> {
    return this.http.get<MasterResponse>(`${this.api}/racial-identities`);
  }
  getRacialIdentityById(id: number): Observable<MasterItem> {
    return this.http.get<MasterItem>(`${this.api}/racial-identities/${id}`);
  }

  /** --------------------- Partner Identity --------------------- */
  getPartnerIdentity(): Observable<any> {
    return this.http.get<MasterResponse>(`${this.api}/partner-directories`);
  }
  getPartnerIdentityById(id: number): Observable<MasterItem> {
    return this.http.get<MasterItem>(`${this.api}/partner-directories/${id}`);
  }

  /** --------------------- Gender Identity --------------------- */
  getGenderIdentity(): Observable<any> {
    return this.http.get<MasterResponse>(`${this.api}/gender-identities`);
  }
  getGenderIdentityById(id: number): Observable<MasterItem> {
    return this.http.get<MasterItem>(`${this.api}/gender-identities/${id}`);
  }

}
