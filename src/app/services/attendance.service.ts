import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdminAttendanceData, PunchRequest, PunchResponse, ScheduleInfo } from '../models/types';
import { CommonService } from './common.service';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly BASE_URL = `${environment.api}/attendance`;
  private readonly SCHEDULE_API_BASE_URL = `${environment.api}/schedule`;

  constructor(private http: HttpClient, private commonService: CommonService) {}

  getAttendanceData(startDate: string, endDate: string) {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    startDate = this.commonService.formatDateForBackend(startDate);
    endDate = this.commonService.formatDateForBackend(endDate);
  
    return this.http.get<AdminAttendanceData[]>(`${this.BASE_URL}/all?start=${startDate}&end=${endDate}`, { headers });
  }

  getMyAttendanceForDate(startDate: string, endDate: string) {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    startDate = this.commonService.formatDateForBackend(startDate);
    endDate = this.commonService.formatDateForBackend(endDate);
  
    return this.http.get<any[]>(`${this.BASE_URL}?start=${startDate}&end=${endDate}`, { headers });
  }  

  getScheduleInfo(): Observable<ScheduleInfo> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
     return this.http.get<ScheduleInfo>(
       `${this.SCHEDULE_API_BASE_URL}`,
       { headers }
    );
  }

  getAttendanceForDate(employeeId: any, punchDate: string) {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    punchDate = this.commonService.formatDateForBackend(punchDate);

    return this.http.get<any>(`${this.BASE_URL}/emp?punchDate=${punchDate}&employeeId=${employeeId}`, { headers });
  }

  // Inside attendance.service.ts or employee.service.ts

getAllEmployeeIds(): Observable<string[]> {
  const token = localStorage.getItem('accessToken');
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  return this.http.get<any>(`${environment.api}/employee/names`, { headers }).pipe(
    map(response => (response.data || []).map((emp: any) => emp.employeeId))
  );
}

  private transformAttendance(data: any[], startDate: string, endDate: string, empIdFilter?: string) {
    const grouped: { [key: string]: any } = {};

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include full end date

    data.forEach(entry => {
      const timestamp = new Date(entry.timestamp);
      const dateStr = timestamp.toISOString().split('T')[0];

      if (timestamp < start || timestamp > end) return;
      if (empIdFilter && entry.employeeId !== empIdFilter) return;

      const key = `${entry.employeeId}-${dateStr}`;
      if (!grouped[key]) {
        grouped[key] = {
          date: this.formatDateDDMMYYYY(dateStr),
          empId: entry.employeeId,
          name: '',
          checkIn: '',
          checkOut: '',
          status: 'Absent'
        };
      }

      const timeStr = timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      if (entry.punchType === 'IN') {
        if (!grouped[key].checkIn || timestamp < new Date(`${dateStr}T${grouped[key].checkIn}`)) {
          grouped[key].checkIn = timeStr;
        }
      } else if (entry.punchType === 'OUT') {
        if (!grouped[key].checkOut || timestamp > new Date(`${dateStr}T${grouped[key].checkOut}`)) {
          grouped[key].checkOut = timeStr;
        }
      }
    });

    return Object.values(grouped).map((entry: any) => {
      if (entry.checkIn) {
        const hour = parseInt(entry.checkIn.split(':')[0], 10);
        entry.status = hour > 9 ? 'Late' : 'Present';
      } else {
        entry.status = 'Absent';
      }
      return entry;
    });
  }

  private formatDateDDMMYYYY(input: string): string {
    const [year, month, day] = input.split('-');
    return `${day}/${month}/${year}`;
  }

  punch(req: PunchRequest): Observable<PunchResponse> {
    return this.http.post<PunchResponse>(`${this.BASE_URL}/punch`, req).pipe(
      tap(res => {
      }),
      catchError(err => throwError(() => err))
    );
  }
}
