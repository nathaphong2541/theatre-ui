import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface MasterPayload {
  nameTh: string;
  nameEn: string;
  description: string;
}

export interface PositionPayload extends MasterPayload {
  departmentId: number;
}

@Injectable({
  providedIn: 'root',
})
export class MasterService {
  private api = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // ======================================================
  // DEPARTMENTS
  // ======================================================

  getDepartments(): Observable<any> {
    return this.http.get(`${this.api}/master/departments`);
  }

  getDepartmentById(id: number): Observable<any> {
    return this.http.get(`${this.api}/master/departments/${id}`);
  }

  createDepartment(payload: MasterPayload): Observable<any> {
    return this.http.post(`${this.api}/master/departments`, payload);
  }

  updateDepartment(id: number, payload: MasterPayload): Observable<any> {
    return this.http.put(`${this.api}/master/departments/${id}`, payload);
  }

  deleteDepartment(id: number): Observable<any> {
    return this.http.delete(`${this.api}/master/departments/${id}`);
  }

  // ======================================================
  // POSITIONS
  // ======================================================

  getPositions(): Observable<any> {
    return this.http.get(`${this.api}/master/positions`);
  }

  getPositionById(id: number): Observable<any> {
    return this.http.get(`${this.api}/master/positions/${id}`);
  }

  createPosition(payload: PositionPayload): Observable<any> {
    return this.http.post(`${this.api}/master/positions`, payload);
  }

  updatePosition(id: number, payload: PositionPayload): Observable<any> {
    return this.http.put(`${this.api}/master/positions/${id}`, payload);
  }

  deletePosition(id: number): Observable<any> {
    return this.http.delete(`${this.api}/master/positions/${id}`);
  }

  // ======================================================
  // WORK LOCATIONS
  // ======================================================

  getWorkLocations(): Observable<any> {
    return this.http.get(`${this.api}/master/work-locations`);
  }

  getWorkLocationById(id: number): Observable<any> {
    return this.http.get(`${this.api}/master/work-locations/${id}`);
  }

  createWorkLocation(payload: MasterPayload): Observable<any> {
    return this.http.post(`${this.api}/master/work-locations`, payload);
  }

  updateWorkLocation(id: number, payload: MasterPayload): Observable<any> {
    return this.http.put(`${this.api}/master/work-locations/${id}`, payload);
  }

  deleteWorkLocation(id: number): Observable<any> {
    return this.http.delete(`${this.api}/master/work-locations/${id}`);
  }

  // ======================================================
  // UNIONS
  // ======================================================

  getUnions(): Observable<any> {
    return this.http.get(`${this.api}/master/unions`);
  }

  getUnionById(id: number): Observable<any> {
    return this.http.get(`${this.api}/master/unions/${id}`);
  }

  createUnion(payload: MasterPayload): Observable<any> {
    return this.http.post(`${this.api}/master/unions`, payload);
  }

  updateUnion(id: number, payload: MasterPayload): Observable<any> {
    return this.http.put(`${this.api}/master/unions/${id}`, payload);
  }

  deleteUnion(id: number): Observable<any> {
    return this.http.delete(`${this.api}/master/unions/${id}`);
  }

  // ======================================================
  // EXPERIENCE LEVELS
  // ======================================================

  getExperienceLevels(): Observable<any> {
    return this.http.get(`${this.api}/master/experience-levels`);
  }

  getExperienceLevelById(id: number): Observable<any> {
    return this.http.get(`${this.api}/master/experience-levels/${id}`);
  }

  createExperienceLevel(payload: MasterPayload): Observable<any> {
    return this.http.post(`${this.api}/master/experience-levels`, payload);
  }

  updateExperienceLevel(id: number, payload: MasterPayload): Observable<any> {
    return this.http.put(`${this.api}/master/experience-levels/${id}`, payload);
  }

  deleteExperienceLevel(id: number): Observable<any> {
    return this.http.delete(`${this.api}/master/experience-levels/${id}`);
  }

  // ======================================================
  // PARTNER DIRECTORIES
  // ======================================================

  getPartnerDirectories(): Observable<any> {
    return this.http.get(`${this.api}/master/partner-directories`);
  }

  getPartnerDirectoryById(id: number): Observable<any> {
    return this.http.get(`${this.api}/master/partner-directories/${id}`);
  }

  createPartnerDirectory(payload: MasterPayload): Observable<any> {
    return this.http.post(`${this.api}/master/partner-directories`, payload);
  }

  updatePartnerDirectory(id: number, payload: MasterPayload): Observable<any> {
    return this.http.put(`${this.api}/master/partner-directories/${id}`, payload);
  }

  deletePartnerDirectory(id: number): Observable<any> {
    return this.http.delete(`${this.api}/master/partner-directories/${id}`);
  }

  // ======================================================
  // GENDER IDENTITIES
  // ======================================================

  getGenderIdentities(): Observable<any> {
    return this.http.get(`${this.api}/master/gender-identities`);
  }

  getGenderIdentityById(id: number): Observable<any> {
    return this.http.get(`${this.api}/master/gender-identities/${id}`);
  }

  createGenderIdentity(payload: MasterPayload): Observable<any> {
    return this.http.post(`${this.api}/master/gender-identities`, payload);
  }

  updateGenderIdentity(id: number, payload: MasterPayload): Observable<any> {
    return this.http.put(`${this.api}/master/gender-identities/${id}`, payload);
  }

  deleteGenderIdentity(id: number): Observable<any> {
    return this.http.delete(`${this.api}/master/gender-identities/${id}`);
  }

  // ======================================================
  // PERSONAL IDENTITIES
  // ======================================================

  getPersonalIdentities(): Observable<any> {
    return this.http.get(`${this.api}/master/personal-identities`);
  }

  getPersonalIdentityById(id: number): Observable<any> {
    return this.http.get(`${this.api}/master/personal-identities/${id}`);
  }

  createPersonalIdentity(payload: MasterPayload): Observable<any> {
    return this.http.post(`${this.api}/master/personal-identities`, payload);
  }

  updatePersonalIdentity(id: number, payload: MasterPayload): Observable<any> {
    return this.http.put(`${this.api}/master/personal-identities/${id}`, payload);
  }

  deletePersonalIdentity(id: number): Observable<any> {
    return this.http.delete(`${this.api}/master/personal-identities/${id}`);
  }

  // ======================================================
  // RACIAL IDENTITIES
  // ======================================================

  getRacialIdentities(): Observable<any> {
    return this.http.get(`${this.api}/master/racial-identities`);
  }

  getRacialIdentityById(id: number): Observable<any> {
    return this.http.get(`${this.api}/master/racial-identities/${id}`);
  }

  createRacialIdentity(payload: MasterPayload): Observable<any> {
    return this.http.post(`${this.api}/master/racial-identities`, payload);
  }

  updateRacialIdentity(id: number, payload: MasterPayload): Observable<any> {
    return this.http.put(`${this.api}/master/racial-identities/${id}`, payload);
  }

  deleteRacialIdentity(id: number): Observable<any> {
    return this.http.delete(`${this.api}/master/racial-identities/${id}`);
  }

  // ======================================================
  // PROFESSIONS
  // ======================================================

  getProfessions(): Observable<any> {
    return this.http.get(`${this.api}/master/professions`);
  }

  getProfessionById(id: number): Observable<any> {
    return this.http.get(`${this.api}/master/professions/${id}`);
  }

  createProfession(payload: MasterPayload): Observable<any> {
    return this.http.post(`${this.api}/master/professions`, payload);
  }

  updateProfession(id: number, payload: MasterPayload): Observable<any> {
    return this.http.put(`${this.api}/master/professions/${id}`, payload);
  }

  deleteProfession(id: number): Observable<any> {
    return this.http.delete(`${this.api}/master/professions/${id}`);
  }
}
