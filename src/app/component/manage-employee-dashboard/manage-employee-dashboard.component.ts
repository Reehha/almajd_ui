import { Component } from '@angular/core';
import { LeaveRequestComponent } from '../leave-request/leave-request.component';
import { AttendanceChartComponent } from '../attendance-chart/attendance-chart.component';
import { AttendanceTableComponent } from '../attendance-table/attendance-table.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  templateUrl: './manage-employee-dashboard.component.html',
  imports:[LeaveRequestComponent,AttendanceChartComponent,AttendanceTableComponent,FormsModule,CommonModule],
  styleUrls: ['./manage-employee-dashboard.component.css'],
})

export class EmployeeDashboardComponent {
  startDate: string = '';
  endDate: string = '';
  isLeaveRequestOpen: boolean = false;

  // Sample data
  attendanceData = [
    { date: '2023-10-01', checkIn: '09:00', checkOut: '18:00', status: 'Present' },
    { date: '2023-10-02', checkIn: '09:15', checkOut: '18:00', status: 'Late' },
    { date: '2023-10-03', checkIn: '', checkOut: '', status: 'Absent' },
  ];

  filteredData = this.attendanceData;

  filterData() {
    this.filteredData = this.attendanceData.filter((entry) => {
      const date = new Date(entry.date);
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      return date >= start && date <= end;
    });
  }

  toggleLeaveRequest() {
    this.isLeaveRequestOpen = !this.isLeaveRequestOpen;
  }
}