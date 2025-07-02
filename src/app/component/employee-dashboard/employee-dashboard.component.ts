import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../../services/attendance.service';
import { BrowserModule } from '@angular/platform-browser';
import Chart from 'chart.js/auto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceData } from '../../models/types';

@Component({
  selector: 'app-employee-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-dashboard.component.html',
  styleUrls: ['./employee-dashboard.component.css'],
})
export class MainEmployeeDashboardComponent implements OnInit {
  employeeId: string | null;
  attendanceData: AttendanceData[] = [];
  filteredData: AttendanceData[] = [];

  startDate!: string;
  endDate!: string;
  currentPage = 1;
  pageSize = 10;
  maxVisiblePages = 4;
  chart: any;
  today: string = '';
  dateError: string = '';

  userInfo = {
    firstName: '',
    lastName: '',
  };

  todaySchedule = {
    time: '',
    location: ''
  };

  constructor(private attendanceService: AttendanceService) {
    this.employeeId = localStorage.getItem('employeeId');
  }

  ngOnInit() {
    this.userInfo.firstName = localStorage.getItem('firstName') || '';
    this.userInfo.lastName = localStorage.getItem('lastName') || '';

    this.attendanceService.getScheduleInfo().subscribe(schedule => {
      this.todaySchedule.time = `${schedule?.data.startTime} - ${schedule.data.endTime}`;
      this.todaySchedule.location = schedule.data.site;
    });

    const today = new Date();
    this.today = today.toISOString().split('T')[0];
    this.startDate = this.today;
    this.endDate = this.today;

    this.fetchData();
  }

  exportPDF() {
    const doc = new jsPDF();
    const tableData = this.attendanceData.map((row) => [
      row.date,
      row.punchIn || '-',
      row.punchOut || '-',
      row.status,
    ]);

    autoTable(doc, {
      head: [['Date', 'Punch In', 'Punch Out', 'Status']],
      body: tableData,
      startY: 20,
    });

    doc.save('attendance.pdf');
  }

  hasDateError(): boolean {
    if (!this.startDate || !this.endDate) {
      this.dateError = 'Both start and end dates are required.';
      return true;
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    if (start > end) {
      this.dateError = 'Start date cannot be after end date.';
      return true;
    }

    this.dateError = '';
    return false;
  }

  fetchData() {
    if (this.hasDateError()) return;

    this.attendanceService
      .getMyAttendanceForDate(this.startDate, this.endDate)
      .subscribe((res: any) => {
        const rows: AttendanceData[] = Array.isArray(res)
          ? res
          : res?.data ?? [];

        this.attendanceData = [...rows];
        this.currentPage = 1;
        this.applyPagination();
        this.buildChart();
      });
  }

  applyPagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.filteredData = this.attendanceData.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.attendanceData.length / this.pageSize);
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyPagination();
    }
  }

  get paginationRange(): (number | string)[] {
    const totalPages = this.totalPages;
    const current = this.currentPage;
    const delta = 1;
    const range: (number | string)[] = [];

    const left = Math.max(2, current - delta);
    const right = Math.min(totalPages - 1, current + delta);

    range.push(1);
    if (left > 2) range.push('...');
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push('...');
    if (totalPages > 1) range.push(totalPages);

    return range;
  }

  isNumber(value: any): value is number {
    return typeof value === 'number';
  }

  getColor(status: string): { color: string } {
    if (status == 'On Time') {
      return { color: '#4caf50' };
    } else if (status == 'Over Time') {
      return { color: '#e53935' };
    } else {
      return { color: '#ffb300' };
    }
  }

  buildChart() {
    const counts: Record<string, { count: number; color: string }> = {
      'On Time': { count: 0, color: '#4caf50' },
      Late: { count: 0, color: '#ffb300' },
      'Over Time': { count: 0, color: '#e53935' },
    };

    this.attendanceData.forEach((entry) => {
      const status = entry.status;
      if (!counts[status]) {
        counts[status] = { count: 1, color: '#6c757d' };
      } else {
        counts[status].count++;
      }
    });

    const labels = Object.keys(counts).filter(
      (status) => counts[status].count > 0
    );
    const data = labels.map((label) => counts[label].count);
    const colors = labels.map((label) => counts[label].color);

    if (this.chart) this.chart.destroy();

    const canvas = document.getElementById(
      'attendanceChart'
    ) as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            align: 'center',
            labels: {
              color: '#ccc',
              boxWidth: 16,
              padding: 15,
            },
          },
          tooltip: {
            backgroundColor: '#333',
            titleColor: '#fff',
            bodyColor: '#eee',
          },
        },
      },
    });
  }
}
