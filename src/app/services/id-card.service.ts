// src/app/services/id-card.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class IdCardService {
  constructor(private http: HttpClient) {}

  uploadProfilePicture(employeeId: string, imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('employeeId', employeeId);
    formData.append('file', imageFile);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
    });

    const uploadUrl = `${environment.api}/employee/upload-profile-pic?employeeId=${employeeId}`;

    return this.http.post(uploadUrl, formData, { headers });
  }

  getProfileImage(employeeId: string): Observable<any> {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
    };
  
    return this.http.get(`${environment.api}/employee/profile-image?employeeId=${employeeId}`, {
      headers,
      observe: 'response',
    });
  }
  
}
