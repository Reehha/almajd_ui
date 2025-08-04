import { Injectable, NgZone } from '@angular/core';
import { LoginService } from './login.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SessionMonitorService {
  private lastActivityTime: number = Date.now();
  private intervalId: any = null;
  private readonly REFRESH_INTERVAL = 8 * 60 * 1000; // 7 minutes (set to 7min, not 1min)
  private excludedRoutes = ['/scan-qr'];

  constructor(
    private loginService: LoginService,
    private router: Router,
    private zone: NgZone
  ) {}

  startMonitoring() {
    this.lastActivityTime = Date.now();
    this.setupListeners();

    this.zone.runOutsideAngular(() => {
      if (this.intervalId) clearInterval(this.intervalId);
      this.intervalId = setInterval(() => this.checkAndRefreshOrLogout(), this.REFRESH_INTERVAL);
    });
  }

  private setupListeners() {
    const resetActivity = () => this.lastActivityTime = Date.now();
    ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event =>
      window.addEventListener(event, resetActivity)
    );
  }

  private checkAndRefreshOrLogout() {
    const now = Date.now();
    const currentRoute = this.router.url;
    const inactiveDuration = now - this.lastActivityTime;

    if (this.excludedRoutes.includes(currentRoute)) {
      // Skip refresh/logout on excluded routes
      return;
    }

    if (inactiveDuration >= this.REFRESH_INTERVAL) {
      // No activity detected during interval → logout
      this.zone.run(() => {
        alert('Session timed out!');
        this.loginService.logout().subscribe(() => {
          this.stopMonitoring();
          this.router.navigateByUrl('/login');
        });
      });
    } else {
      // User was active → refresh token
      this.loginService.refreshToken().subscribe({
        next: () => {
          // reset timer after successful refresh
          this.lastActivityTime = Date.now();
        },
        error: (err) => {
          console.error('Error refreshing token', err);
          // Optional: logout if refresh fails
          this.zone.run(() => {
            this.loginService.logout().subscribe(() => {
              this.stopMonitoring();
              this.router.navigateByUrl('/login');
            });
          });
        }
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
