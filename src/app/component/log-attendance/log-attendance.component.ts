import { Component } from '@angular/core';
import { QrService } from '../../services/qr.service';
import { LoginService } from '../../services/login.service';


@Component({
  selector: 'app-log-attendance',
  standalone: true,
  templateUrl: './log-attendance.component.html',
  styleUrls: ['./log-attendance.component.css'],
})
export class LogAttendanceComponent {
  qrCodeDataUrl = '';

  constructor(
    private qr: QrService,
    private login: LoginService
  ) { }

  async ngOnInit(): Promise<void> {
    await this.loadQr(false);
  }

  /** (click)="refreshQr()" */
  async refreshQr(): Promise<void> {
    await this.loadQr(true);
  }

  /* -------------------------------------------------- */
  private async loadQr(forceRefresh: boolean): Promise<void> {
    const empId = this.login.getEmployeeId();
    if (!empId) { return; }

    this.qrCodeDataUrl = await this.qr.generateQRCode(empId, forceRefresh);
  }


}