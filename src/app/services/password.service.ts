// password.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

interface PasswordResetRequest {
  employeeId: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordService {
  private readonly CHANGE_PASSWORD_URL = `${environment.api}/auth/change-password`;

  constructor(private http: HttpClient) {}

  private getEmployeeIdFromToken(): string | null {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const decoded = jwtDecode<{ preferred_username: string }>(token);
      return decoded.preferred_username;
    } catch (error) {
      return null;
    }
  }

  changePassword(newPassword: string): Observable<any> {
    const employeeId = this.getEmployeeIdFromToken();
    const token = localStorage.getItem('accessToken');
  
    if (!token || !employeeId) {
      return throwError(() => new Error('Missing token or employee ID'));
    }
  
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  
    const payload = {
      employeeId,
      newPassword
    };
  
    return this.http.post(this.CHANGE_PASSWORD_URL, payload, { headers });
  }
  
}
