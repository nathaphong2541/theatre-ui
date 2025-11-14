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

  getDepartment(): Observable<any /* ProfileDto & { avatarUrl?: string } */> {
    return this.http.get<MasterResponse>(`${this.api}/departments`);
  }

  getPosition(): Observable<any> {
    return this.http.get<MasterResponse>(`${this.api}/positions`);
  }

  getSkills(): Observable<any> {
    return this.http.get<MasterResponse>(`${this.api}/skills`);
  }

  getWorkLocaltion(): Observable<any> {
    return this.http.get<MasterResponse>(`${this.api}/work-locations`);
  }

  getUnionMembership(): Observable<any> {
    return this.http.get<MasterResponse>(`${this.api}/unions`);
  }

  getExperienceLevel(): Observable<any> {
    return this.http.get<MasterResponse>(`${this.api}/experience-levels`);
  }

  getPersonalIdentity(): Observable<any> {
    return this.http.get<MasterResponse>(`${this.api}/personal-identities`);
  }

  getRacialIdentity(): Observable<any> {
    return this.http.get<MasterResponse>(`${this.api}/racial-identities`);
  }

  getPartnerIdentity(): Observable<any> {
    return this.http.get<MasterResponse>(`${this.api}/partner-directories`);
  }

  getGenderIdentity(): Observable<any> {
    return this.http.get<MasterResponse>(`${this.api}/gender-identities`);
  }

}
