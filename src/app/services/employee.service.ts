import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly BASE_URL = `${environment.api}/auth/employee/all`;

  constructor(private http: HttpClient) {}

  getAllEmployees(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`
    });

    return this.http.get<any>(this.BASE_URL, { headers });
  }
}
