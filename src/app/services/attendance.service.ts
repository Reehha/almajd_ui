import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly BASE_URL = `${environment.api}/attendance`;

  constructor(private http: HttpClient) {}

  getAttendanceData(startDate: string, endDate: string, employeeId?: string) {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<any>(`${this.BASE_URL}/all`, { headers }).pipe(
      map(res => this.transformAttendance(res.data, startDate, endDate, employeeId))
    );
  }

  getAttendanceForDate(punchDate: string) {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<any>(`${this.BASE_URL}?punchDate=${punchDate}`, { headers });
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
}
