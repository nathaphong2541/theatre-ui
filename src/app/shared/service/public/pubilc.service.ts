import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PubilcService {

  private api = `${environment.apiUrlPubilc}/public`;

  constructor(private http: HttpClient) { }

  getDepartment(): Observable<any /* ProfileDto & { avatarUrl?: string } */> {
    return this.http.get(`${this.api}/departments`);
  }
  
  getPosition(): Observable<any> {
    return this.http.get(`${this.api}/positions`);
  }

  getSkills(): Observable<any> {
    return this.http.get(`${this.api}/skills`);
  }
}
