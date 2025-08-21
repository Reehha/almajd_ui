import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Location {
  locationId: string;
  locationName: string;
  travelTime: number;
}

export interface EmployeeAllocation {
  employeeId: string;
  firstName: string;
  lastName: string;
  scheduleId: string;
  locationId: string;
  department: string;
  designation: string;
  locationName: string;
  startTime: string | null;
  endTime: string | null;
  startDate: string | null;
  endDate: string | null;
}



export interface Schedule {
  scheduleId: string;
  startTime: string; // format "HH:mm"
  endTime: string;   // format "HH:mm"
}

export interface Allocation {
  employeeId: string;
  firstName: string;
  lastName: string;
  startDate: string | null;
  endDate: string | null;
  scheduleId: string;
  locationId: string;
  department: string;
  designation: string;
  locationName: string;
}


// API wrapper interface
interface ApiResponse<T> {
  timestamp: string;
  status: number;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private apiUrl = environment.api;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ✅ Get all locations (extract `data`)
  getLocations(): Observable<Location[]> {
    return this.http.get<ApiResponse<Location[]>>(`${this.apiUrl}/location/all`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(res => res.data)
    );
  }

  createLocation(location: { locationName: string; travelTime: number }): Observable<Location> {
    return this.http.post<{ data: Location }>(`${this.apiUrl}/location/create`, location, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(res => res.data)
    );
  }
  
  updateLocation(locationId: string, location: { locationName: string; travelTime: number }): Observable<Location> {
    return this.http.put<Location>(`${this.apiUrl}/location/update/${locationId}`, location, {
      headers: this.getAuthHeaders()
    });
  }

  deleteLocation(locationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/location/delete/${locationId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // ✅ Get all schedules
  getSchedules(): Observable<Schedule[]> {
    return this.http.get<{ data: Schedule[] }>(`${this.apiUrl}/schedule/all`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(res => res.data)
    );
  }

  // ✅ Create a schedule
  createSchedule(schedule: { startTime: string; endTime: string }): Observable<Schedule> {
    return this.http.post<{ data: Schedule }>(`${this.apiUrl}/schedule/create`, schedule, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(res => res.data)
    );
  }

  // ✅ Update a schedule
  updateSchedule(scheduleId: string, schedule: { startTime: string; endTime: string }): Observable<Schedule> {
    return this.http.put<Schedule>(`${this.apiUrl}/schedule/update/${scheduleId}`, schedule, {
      headers: this.getAuthHeaders()
    });
  }

  // ✅ Delete a schedule
  deleteSchedule(scheduleId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/schedule/delete/${scheduleId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // ✅ Get all allocations (employees)
  getAllocations(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/allocation/all`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });
  }

  assignSchedules(data: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/allocation/create`, data, {
      headers: this.getAuthHeaders()
    });
  }
  

}
