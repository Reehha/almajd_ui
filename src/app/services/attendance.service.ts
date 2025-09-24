import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdminAttendanceData, PunchRequest, PunchResponse, ScheduleInfo } from '../models/types';
import { CommonService } from './common.service';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly BASE_ATTENDANCE_URL = `${environment.api}/attendance`;
  private readonly SCHEDULE_API_BASE_URL = `${environment.api}/schedule`;
  private readonly BASE_URL = `${environment.api}`;

  constructor(private http: HttpClient, private commonService: CommonService) {}

  /** ✅ Centralized method for Authorization headers */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken') || '';
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getAttendanceData(startDate: string, endDate: string) {
    startDate = this.commonService.formatDateForBackend(startDate);
    endDate = this.commonService.formatDateForBackend(endDate);

    return this.http.get<AdminAttendanceData[]>(
      `${this.BASE_ATTENDANCE_URL}/all?start=${startDate}&end=${endDate}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getAbsentData(startDate: string, endDate: string) {
    startDate = this.commonService.formatDateForBackend(startDate);
    endDate = this.commonService.formatDateForBackend(endDate);

    return this.http.get<any>(
      `${this.BASE_ATTENDANCE_URL}/absent?start=${startDate}&end=${endDate}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getMyAttendanceForDate(startDate: string, endDate: string) {
    startDate = this.commonService.formatDateForBackend(startDate);
    endDate = this.commonService.formatDateForBackend(endDate);

    return this.http.get<any[]>(
      `${this.BASE_ATTENDANCE_URL}?start=${startDate}&end=${endDate}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getScheduleInfo(): Observable<ScheduleInfo> {
    return this.http.get<ScheduleInfo>(
      `${this.BASE_URL}/allocation`,
      { headers: this.getAuthHeaders() }
    );
  }

  getAttendanceForDate(employeeId: any, punchDate: string) {
    punchDate = this.commonService.formatDateForBackend(punchDate);

    return this.http.get<any>(
      `${this.BASE_ATTENDANCE_URL}/emp?punchDate=${punchDate}&employeeId=${employeeId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getAllEmployeeIds(): Observable<string[]> {
    return this.http.get<any>(
      `${environment.api}/employee/names`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => response.data || [])
    );
  }

  punch(req: PunchRequest): Observable<PunchResponse> {
    return this.http.post<PunchResponse>(
      `${this.BASE_ATTENDANCE_URL}/punch`,
      req
    ).pipe(
      tap(() => {}),
      catchError(err => throwError(() => err))
    );
  }

  updateEmployeeLocation(employee: any, newLocationName: string, locationId: string): Observable<any> {
    const body = {
      employeeId: employee.employeeId,
      locationName: newLocationName,
      locationId: locationId,
      date: employee.date,
      firstName: employee.firstName,
      lastName: employee.lastName,
      department: employee.department,
      designation: employee.designation,
      punchIn: employee.punchIn,
      punchOut: employee.punchOut,
      punchInUpdated: employee.punchInUpdated || employee.punchIn,
      punchOutUpdated: employee.punchOutUpdated || employee.punchOut,
      updatedDeduction: employee.updatedDeduction || 0,
      status: employee.status,
      statusValue: employee.statusValue || ''
    };
  
    return this.http.post(
      `${this.BASE_ATTENDANCE_URL}/update`,
      body,
      { headers: this.getAuthHeaders() }
    );
  }
}
