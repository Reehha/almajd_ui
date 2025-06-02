import { Component } from '@angular/core';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-log-attendance',
  standalone:true,
  templateUrl: './log-attendance.component.html',
  styleUrls: ['./log-attendance.component.css'],
})
export class LogAttendanceComponent {
  qrCodeDataUrl: string = '';

  constructor() {
    this.generateQRCode();
  }

  generateQRCode() {
    const data = {
      userId: '12345', // Replace with actual user ID
      timestamp: new Date().toISOString(), // Add a timestamp
    };

    // Convert data to JSON string
    const jsonData = JSON.stringify(data);

    // Generate QR code
    QRCode.toDataURL(jsonData, (err: any, url: string) => {
      if (err) {
        console.error('Error generating QR code:', err);
        return;
      }
      this.qrCodeDataUrl = url;
    });
  }
}