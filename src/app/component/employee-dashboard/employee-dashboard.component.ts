import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../../services/attendance.service';
import { BrowserModule } from '@angular/platform-browser';
import Chart from 'chart.js/auto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employee-dashboard',
  imports:[CommonModule,FormsModule],
  templateUrl: './employee-dashboard.component.html',
  styleUrls: ['./employee-dashboard.component.css']
})
export class MainEmployeeDashboardComponent implements OnInit {
  attendanceData: any[] = [];
  filteredData: any[] = [];

  startDate!: string;
  endDate!: string;
  currentPage = 1;
  pageSize = 20;
  chart: any;
  today: string = '';

  todaySchedule = {
    time: '09:00 AM - 05:00 PM',
    location: 'Head Office'
  };

  constructor(private attendanceService: AttendanceService) {}

  ngOnInit() {
    const today = new Date();
    this.today = today.toISOString().split('T')[0];
    this.startDate = this.today;
    this.endDate = this.today;

    this.fetchData();
  }

  fetchData() {
    console.log(this.startDate);
    this.attendanceService.getAttendanceForDate(this.startDate).subscribe(data => {
      this.attendanceData = data;
      this.applyPagination();
      this.buildChart();
    });
  }

  applyPagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.filteredData = this.attendanceData.slice(start, end);
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.applyPagination();
  }

  buildChart() {
    const counts: Record<string, number> = { Present: 0, Late: 0, Absent: 0 };
    this.attendanceData.forEach(entry => {
      if (counts[entry.status] !== undefined) counts[entry.status]++;
    });

    if (this.chart) this.chart.destroy();

    const canvas = document.getElementById('attendanceChart') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    this.chart = new Chart(ctx!, {
      type: 'pie',
      data: {
        labels: ['Present', 'Late', 'Absent'],
        datasets: [{
          label: 'Attendance',
          data: [counts['Present'], counts['Late'], counts['Absent']],
          backgroundColor: ['#28a745', '#ffc107', '#dc3545']
        }]
      }
    });
  }

  exportCSV() {
    const csvData = this.attendanceData.map(row =>
      `${row.date},${row.empId},${row.checkIn},${row.checkOut},${row.status}`
    );
    const csv = ['Date,Employee ID,Punch In,Punch Out,Status', ...csvData].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'attendance.csv';
    link.click();
  }
}
