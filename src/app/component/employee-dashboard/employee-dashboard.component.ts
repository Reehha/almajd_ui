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
  filteredData: any[] = [];

  startDate!: string;
  endDate!: string;
  currentPage = 1;
  pageSize = 20;
  chart: any;
  today: string = '';
  userInfo = {
    firstName: '',
    lastName: '',
  };

  todaySchedule = {
    time: '',
    location: '',
  };

  constructor(private attendanceService: AttendanceService) {
    this.employeeId = localStorage.getItem('employeeId');
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

  ngOnInit() {
    this.userInfo.firstName = localStorage.getItem('firstName') || '';
    this.userInfo.lastName = localStorage.getItem('lastName') || '';

    // Assuming you already have the employeeId from auth token/user info:
    this.attendanceService.getScheduleInfo().subscribe((schedule) => {
      this.todaySchedule.time = `${schedule.scheduleStart} - ${schedule.scheduleEnd}`;
      this.todaySchedule.location = schedule.location;
    });

    const today = new Date();
    this.today = today.toISOString().split('T')[0];
    this.startDate = this.today;
    this.endDate = this.today;

    this.fetchData();
  }

  fetchData() {
    this.attendanceService
      .getMyAttendanceForDate(this.startDate, this.endDate)
      .subscribe((res: any) => {
        const rows: AttendanceData[] = Array.isArray(res)
          ? res
          : res?.data ?? [];

        // reset then populate
        this.attendanceData = [...rows];

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

  getColor(status: string):{color:string} {
    if (status == 'On Time') {
      return {color:'#4caf50'};
    } else if (status == 'Over Time') {
      return {color:'#e53935'};
    } else {
      return {color:'#ffb300'};
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
            borderWidth: 0, // ✅ removes white outline
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
              color: '#ccc', // ✅ label color for dark background
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
