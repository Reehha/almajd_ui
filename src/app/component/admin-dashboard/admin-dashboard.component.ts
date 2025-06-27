import { Component } from '@angular/core';
import { AttendanceService } from '../../services/attendance.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AttendanceChartComponent } from '../attendance-chart/attendance-chart.component';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule, AttendanceChartComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent {
  startDate: string = new Date().toISOString().split('T')[0];
  endDate: string = new Date().toISOString().split('T')[0];
  employeeId: string = '';
  filteredData: any[] = [];
  department: string = '';
  subsidiary: string = '';

  departments: string[] = ['HR', 'Finance', 'Engineering', 'Marketing'];
  subsidiaries: string[] = ['AlMajd Intl', 'AlMajd UAE', 'AlMajd India'];

  // Counts for the initial current day (do NOT change on filtering)
  initialCounts = { Present: 0, Late: 0, Absent: 0, Total: 0 };
  currentPage = 1;
  itemsPerPage = 20;

get paginatedData() {
  const start = (this.currentPage - 1) * this.itemsPerPage;
  return this.filteredData.slice(start, start + this.itemsPerPage);
}

get totalPages(): number {
  return Math.ceil(this.filteredData.length / this.itemsPerPage);
}

goToPage(page: number) {
  if (page >= 1 && page <= this.totalPages) {
    this.currentPage = page;
  }
}


  constructor(private router: Router, private attendanceService: AttendanceService) {
    this.loadInitialData();
  }

  // Load data for today and set initialCounts
  loadInitialData() {
    this.attendanceService
      .getAttendanceData(this.startDate, this.startDate, '') // only today, no empId filter
      .subscribe((data) => {
        this.filteredData = data; // show all today data initially

        // Calculate counts only once for today data
        this.initialCounts = this.calculateCounts(data);
      });
  }

  // Filter data for user-selected filters (dates, empId, dept, subsidiary)
  filterData() {
    this.attendanceService
      .getAttendanceData(this.startDate, this.endDate, this.employeeId)
      .subscribe((data) => {
        // Filter based on department and subsidiary if selected
        this.filteredData = data.filter((entry: any) => {
          return (
            (!this.department || entry.department === this.department) &&
            (!this.subsidiary || entry.subsidiary === this.subsidiary)
          );
        });

        // DO NOT update counts here — keep showing initialCounts
      });
  }

  // Calculate counts helper function
  calculateCounts(data: any[]): { Present: number; Late: number; Absent: number; Total: number } {
    const counts = { Present: 0, Late: 0, Absent: 0, Total: 0 };
    const uniqueEmpIds = new Set<string>();

    data.forEach((entry) => {
      if (['Present', 'Late', 'Absent'].includes(entry.status)) {
        counts[entry.status as 'Present' | 'Late' | 'Absent']++;
        uniqueEmpIds.add(entry.empId);
      }
    });

    counts.Total = uniqueEmpIds.size;
    return counts;
  }

  scanQR() {
    this.router.navigate(['/scan-qr']);
  }
}
