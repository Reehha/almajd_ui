import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private readonly BASE_URL = environment.api;

  constructor(private http: HttpClient) {}

  registerEmployee(data: any): Observable<any> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post<any>(`${this.BASE_URL}/auth/register`, data, { headers });
  }

  getOrganizations(): Observable<any> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<any>(`${this.BASE_URL}/organizations`, { headers });
  }

  getAllSchedules(): Observable<any[]> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  
    return this.http.get<any[]>(`${this.BASE_URL}/schedule/all`, { headers });
  }
  
  getAllLocations(): Observable<any[]> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  
    return this.http.get<any[]>(`${this.BASE_URL}/location/all`, { headers });
  }
  

  getReportingManagers(): Observable<any> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<any>(`${this.BASE_URL}/auth/employee/managers`, { headers });
  }

  saveOrganizations(payload: any): Observable<any> {
    const token = localStorage.getItem('accessToken'); // Assuming JWT is stored here

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(`${this.BASE_URL}/organizations`, payload, { headers });
  }

  
  
  
  
}
