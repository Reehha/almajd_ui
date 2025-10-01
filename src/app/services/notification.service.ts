import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  NotificationsApiResponse,
  NotificationReceivedItem
} from '../models/types';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly BASE_NOTIFICATION_URL = `${environment.api}/notification`;

  constructor(private http: HttpClient) {}

  /** 🔹 Common Auth Headers */
  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
      'Content-Type': 'application/json'
    });
  }

  /** 🔹 Fetch full notifications payload */
  getNotifications(): Observable<NotificationsApiResponse> {
    return this.http.get<NotificationsApiResponse>(
      `${this.BASE_NOTIFICATION_URL}/all`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      shareReplay(1), // cache last value for all subscribers
      catchError(err => {
        console.error('Failed to fetch notifications', err);
        return of({
          status: 'error',
          message: 'Failed to fetch',
          timestamp: new Date().toISOString(),
          data: { notificationReceived: [], notificationSent: [] }
        } as NotificationsApiResponse);
      })
    );
  }

  /** 🔹 Derived unread count (read === false) */
  getUnreadCount(): Observable<number> {
    return this.getNotifications().pipe(
      map(res => {
        const received: NotificationReceivedItem[] =
          res?.data?.notificationReceived ?? [];

        return received.filter(n => {
          const readVal = n?.read;
          const isRead =
            typeof readVal === 'boolean'
              ? readVal
              : String(readVal).toLowerCase() === 'true';
          return !isRead;
        }).length;
      })
    );
  }

  /** 🔹 Delete notification */
  deleteNotification(notificationId: string, employeeId: string): Observable<any> {
    const body = {
      notificationId,
      employeeId,
      status: 'disable'
    };
    return this.http.post(
      `${this.BASE_NOTIFICATION_URL}/status/update`,
      body,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(err => {
        console.error('Delete notification failed', err);
        return of(err);
      })
    );
  }

  /** 🔹 Mark notification as read */
  markAsRead(notificationId: string, employeeId: string): Observable<any> {
    const body = {
      notificationId,
      employeeId,
      status: 'read'
    };
    return this.http.post(
      `${this.BASE_NOTIFICATION_URL}/status/update`,
      body,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(err => {
        console.error('Mark as read failed', err);
        return of(err);
      })
    );
  }

  /** 🔹 Create / Send notification */
createNotification(payload: any): Observable<any> {
  return this.http.post(
    `${this.BASE_NOTIFICATION_URL}/create`,
    payload,
    { headers: this.getAuthHeaders() }
  ).pipe(
    catchError(err => {
      console.error('Create notification failed', err);
      return of(err);
    })
  );
}

}
