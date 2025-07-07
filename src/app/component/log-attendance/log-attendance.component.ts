import { Component, OnDestroy } from '@angular/core';
import { QrService } from '../../services/qr.service';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-log-attendance',
  standalone: true,
  templateUrl: './log-attendance.component.html',
  styleUrls: ['./log-attendance.component.css'],
})
export class LogAttendanceComponent implements OnDestroy {
  qrCodeDataUrl = '';
  private refreshInterval: any;

  constructor(
    private qr: QrService,
    private login: LoginService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadQr(false);

    // Auto-refresh every 5 minutes (300,000 ms)
    this.refreshInterval = setInterval(() => {
      this.loadQr(true);
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  async refreshQr(): Promise<void> {
    await this.loadQr(true);
  }

  private async loadQr(forceRefresh: boolean): Promise<void> {
    const empId = this.login.getEmployeeId();
    if (!empId) { return; }

    this.qrCodeDataUrl = await this.qr.generateQRCode(empId, forceRefresh);
  }
}
