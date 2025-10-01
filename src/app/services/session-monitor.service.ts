import { Injectable, NgZone } from '@angular/core';
import { LoginService } from './login.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SessionMonitorService {
  private intervalId: any = null;
  private activityDetected: boolean = false;
  private readonly INTERVAL = 8 * 60 * 1000; // 8 minutes
  private excludedRoutes = ['/scan-qr'];

  constructor(
    private loginService: LoginService,
    private router: Router,
    private zone: NgZone
  ) {}

  startMonitoring() {
    this.setupListeners();
    this.startInterval();
  }

  private setupListeners() {
    const markActivity = () => this.activityDetected = true;
    ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event =>
      window.addEventListener(event, markActivity)
    );
  }

  private startInterval() {
    if (this.intervalId) clearInterval(this.intervalId);

    this.zone.runOutsideAngular(() => {
      this.intervalId = setInterval(() => this.checkActivity(), this.INTERVAL);
    });
  }

  private checkActivity() {
    const currentRoute = this.router.url;
    if (this.excludedRoutes.includes(currentRoute)) return;

    if (this.activityDetected) {
      // Activity detected → refresh token and reset for next interval
      this.loginService.refreshToken().subscribe({
        next: () => {
          this.activityDetected = false; // reset for next interval
        },
        error: (err) => {
          console.error('Error refreshing token', err);
          this.zone.run(() => {
            this.loginService.logout().subscribe(() => {
              this.stopMonitoring();
              this.router.navigateByUrl('/login');
            });
          });
        }
      });
    } else {
      // No activity → logout
      this.zone.run(() => {
        alert('Session timed out!');
      });
    }
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
