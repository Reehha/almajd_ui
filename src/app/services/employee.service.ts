// employee.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private apiUrl = 'http://localhost:8081/auth/employee/all';

  constructor(private http: HttpClient) {}

  getAllEmployees(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}` // Ensure token is stored in localStorage
    });

    return this.http.get<any>(this.apiUrl, { headers });
  }
}
