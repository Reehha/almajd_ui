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

  initialCounts = { Present: 0, Late: 0, Absent: 0, Total: 0 };

  currentPage = 1;
  itemsPerPage = 5;
  maxVisiblePages = 4; // max number of page buttons to show

  get paginatedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredData.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  /**
   * Returns an array of visible page numbers to display in pagination
   * Shows maxVisiblePages centered around currentPage
   */
  // getVisiblePages(): number[] {
  //   const pages = [];
  //   let startPage = Math.max(1, this.currentPage - Math.floor(this.maxVisiblePages / 2));
  //   let endPage = startPage + this.maxVisiblePages - 1;

  //   if (endPage > this.totalPages) {
  //     endPage = this.totalPages;
  //     startPage = Math.max(1, endPage - this.maxVisiblePages + 1);
  //   }

  //   for (let i = startPage; i <= endPage; i++) {
  //     pages.push(i);
  //   }

  //   return pages;
  // }

  get paginationRange(): (number | string)[] {
    const totalPages = this.totalPages;
    const current = this.currentPage;
    const delta = 1; // how many pages to show around current
    const range: (number | string)[] = [];
  
    const left = Math.max(2, current - delta);
    const right = Math.min(totalPages - 1, current + delta);
  
    range.push(1); // always show first page
  
    if (left > 2) {
      range.push('...');
    }
  
    for (let i = left; i <= right; i++) {
      range.push(i);
    }
  
    if (right < totalPages - 1) {
      range.push('...');
    }
  
    if (totalPages > 1) {
      range.push(totalPages); // always show last page
    }
  
    return range;
  }
  

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  isNumber(value: any): value is number {
    return typeof value === 'number';
  }
  

  constructor(private router: Router, private attendanceService: AttendanceService) {
    this.loadInitialData();
  }

  loadInitialData() {
    this.attendanceService
      .getAttendanceData(this.startDate, this.endDate) // today only, no empId filter
      .subscribe((resp) => {
        // service may wrap the array inside a `data` property; fall back to resp itself
        const dataArray = (resp as any)?.data ?? resp;
        this.filteredData = dataArray;
        this.initialCounts = this.calculateCounts(dataArray);
      });
  }

  filterData() {
    this.attendanceService
      .getAttendanceData(this.startDate, this.endDate)
      .subscribe((resp) => {
        const full = (resp as any)?.data ?? resp;
        this.filteredData = full.filter((entry: any) => {
          return (
            (!this.department || entry.department === this.department) &&
            (!this.subsidiary || entry.subsidiary === this.subsidiary)
          );
        });
      });
  }

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
