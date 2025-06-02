import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule,FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {
  startDate: string = new Date().toISOString().split('T')[0];
  endDate: string = new Date().toISOString().split('T')[0];

  // Sample data
  attendanceData = [
    { date: '2023-10-01', empId: 'EMP001', name: 'John Doe', checkIn: '08:55', checkOut: '17:05', status: 'Present' },
    { date: '2023-10-01', empId: 'EMP002', name: 'Jane Smith', checkIn: '09:15', checkOut: '17:00', status: 'Late' },
    { date: '2023-10-02', empId: 'EMP001', name: 'John Doe', checkIn: '08:50', checkOut: '17:10', status: 'Present' },
    { date: '2023-10-02', empId: 'EMP002', name: 'Jane Smith', checkIn: '', checkOut: '', status: 'Absent' },
  ];

  filteredData = this.attendanceData;

  constructor(private router: Router) {}

  filterData() {
    this.filteredData = this.attendanceData.filter(entry => {
      const date = new Date(entry.date);
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      return date >= start && date <= end;
    });
  }

  scanQR() {
    this.router.navigate(['/scan-qr']);
  }
}