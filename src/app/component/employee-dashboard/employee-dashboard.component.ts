import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../../services/attendance.service';
import { BrowserModule } from '@angular/platform-browser';
import Chart from 'chart.js/auto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceData } from '../../models/types';
import * as XLSX from 'xlsx';


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
  noData: boolean = false;

  startDate!: string;
  endDate!: string;
  currentPage = 1;
  pageSize = 10;
  maxVisiblePages = 4;
  chart: any;
  today: string = '';
  dateError: string = '';
  expandedRow: number | null = null;

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

  statusClassMap: Record<string, string> = {
    'On Time': 'ontime',
    'Overtime': 'overtime',
    'Short Time': 'shorttime'
  };

  ngOnInit() {
    this.userInfo.firstName = localStorage.getItem('firstName') || '';
    this.userInfo.lastName = localStorage.getItem('lastName') || '';

    this.attendanceService.getScheduleInfo().subscribe(schedule => {
      this.todaySchedule.time = `${this.formatTime(schedule?.data.startTime)} - ${this.formatTime(schedule?.data.endTime)}`;
      this.todaySchedule.location = schedule.data.locationName;
    });

    const today = new Date();
    this.today = today.toISOString().split('T')[0];
    this.startDate = this.today;
    this.endDate = this.today;

    this.fetchData();
  }

  exportToExcel(): void {
    const exportData = this.attendanceData.map(entry => {
      // Punch In display
      let punchInDisplay = entry.punchIn || '-';
      if (entry.punchInUpdated) {
        punchInDisplay = `${entry.punchInUpdated}`;
      }
  
      // Punch Out display
      let punchOutDisplay = entry.punchOut || '-';
      if (entry.punchOutUpdated) {
        punchOutDisplay = `${entry.punchOutUpdated}`;
      }
  
      // Convert Updated Deduction (min)
      let updatedDeductionDisplay = '0';
      if (entry.updatedDeduction) {
        const minutes = parseInt(entry.updatedDeduction.replace(/\D/g, ''), 10) || 0;
        updatedDeductionDisplay = `${minutes * 2} mins`;
      }
  
      // Convert Overtime / Short Time minutes to hours
      let overtimeHr = '';
      let shortTimeHr = '';
  
      if (entry.status?.toLowerCase() === 'overtime' && entry.statusValue) {
        const minutes = parseFloat(entry.statusValue.replace(/\D/g, '')) || 0;
        overtimeHr = (minutes / 60).toFixed(2);
      } else if (entry.status?.toLowerCase() === 'short time' && entry.statusValue) {
        const minutes = parseFloat(entry.statusValue.replace(/\D/g, '')) || 0;
        shortTimeHr = (minutes / 60).toFixed(2);
      }
  
      return {
        Date: entry.date,
        'Punch In': punchInDisplay,
        'Punch Out': punchOutDisplay,
        'Updated Deduction (mins)': updatedDeductionDisplay,
        'Work Hours': entry.workHours || '-',
        'Short Time (hr)': shortTimeHr,
        'Overtime (hr)': overtimeHr,
        Status: entry.status,
        'Site Location': entry.locationName
      };
    });
  
    // Create worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  
    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Date
      { wch: 20 }, // Punch In
      { wch: 20 }, // Punch Out
      { wch: 25 }, // Updated Deduction (mins)
      { wch: 18 }, // Work Hours
      { wch: 18 }, // Short Time (hr)
      { wch: 18 }, // Overtime (hr)
      { wch: 15 }, // Status
      { wch: 20 }  // Site Location
    ];
  
    // Create workbook and add worksheet
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Attendance': worksheet },
      SheetNames: ['Attendance']
    };
  
    // Save Excel file
    XLSX.writeFile(workbook, `Attendance_${new Date().toISOString().split('T')[0]}.xlsx`);
  }  


  toggleExpand(i: number) {
    this.expandedRow = this.expandedRow === i ? null : i;
  }

  getBreakKeys(breaks: any): string[] {
    return breaks ? Object.keys(breaks) : [];
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

  formatDate(date: string): string {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  formatTime(time24: string): string {
    if (!time24) return '';
    
    const [hoursStr, minutes] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
  
    if (isNaN(hours)) return '';
  
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12; // midnight or noon case
  
    return `${hours}:${minutes} ${ampm}`;
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
    if (status === 'On Time') {
      return { color: '#4caf50' }; // green
    } else if (status === 'Overtime') {
      return { color: '#ffb300' }; // yellow
    } else if (status === 'Short Time') {
      return { color: '#e53935' }; // red
    } else {
      return { color: '#6c757d' }; // fallback gray
    }
  }

  buildChart() {
    const counts: Record<string, { count: number; color: string }> = {
      'On Time': { count: 0, color: '#4caf50' },
      'Short Time': { count: 0, color: '#e53935' },
      'Overtime': { count: 0, color: '#ffb300' },
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

    if (data.length === 0) {
      this.noData = true;
      return;
    }
  
    this.noData = false;
    
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
  
  getStatusClass(status: string): string {
    return this.statusClassMap[status] || 'unknown';
  }
}
