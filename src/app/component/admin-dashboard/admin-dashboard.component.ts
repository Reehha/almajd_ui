import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';
import { RegistrationService } from '../../services/registration.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceChartComponent } from '../attendance-chart/attendance-chart.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AttendanceChartComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  startDate: string = new Date().toISOString().split('T')[0];
  endDate: string = new Date().toISOString().split('T')[0];
  employeeName: string = '';
  department: string = '';
  organization: string = '';

  rawData: any[] = [];
  filteredData: any[] = [];
  departments: string[] = [];
  organizations: string[] = [];
  totalEmployees = 0;

  initialCounts = { onTime: 0, shortTime: 0, overTime: 0, absent: 0 };
  currentPage = 1;
  itemsPerPage = 10;

  constructor(
    private router: Router,
    private attendanceService: AttendanceService,
    private registrationService: RegistrationService
  ) {}

  ngOnInit() {
    this.onDateFilter();
  }

  // EXPORT TO EXCEL
  exportToExcel(): void {
    const exportData = this.filteredData.map(entry => {
      const punchIn = entry.punchInUpdated || entry.punchIn || '-';
      const punchOut = entry.punchOutUpdated || entry.punchOut || '-';
      const overtimeHours = entry.status == 'Overtime' ? entry.statusValue || '' : '';

      return {
        Date: entry.date,
        'Employee ID': entry.employeeId,
        Name: `${entry.firstName} ${entry.lastName}`,
        Department: entry.department,
        Organization: entry.organization,
        'Punch In': punchIn,
        'Punch Out': punchOut,
        'Updated Deduction (mins)': entry.updatedDeduction || '0',
        Status: entry.status,
        'Overtime Hours': overtimeHours,
      };
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    worksheet['!cols'] = [
      { wch: 15 }, // Date
      { wch: 15 }, // Employee ID
      { wch: 25 }, // Name
      { wch: 20 }, // Punch In
      { wch: 20 }, // Punch Out
      { wch: 15 }, // Status
      { wch: 18 }  // Overtime
    ];

    const workbook: XLSX.WorkBook = {
      Sheets: { 'Attendance': worksheet },
      SheetNames: ['Attendance']
    };

    XLSX.writeFile(workbook, `Attendance_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  // FETCH DATA
  onDateFilter() {
    this.attendanceService.getAttendanceData(this.startDate, this.endDate).subscribe({
      next: (resp) => {
        const data = (resp as any).data ?? resp;
        this.rawData = data;
        this.applyFilters();
      },
      error: (err) => console.error('Failed to fetch attendance data:', err),
    });
  }

  // APPLY FILTERS
  applyFilters() {
    this.filteredData = [...this.rawData.filter((entry) => {
      const fullName = `${entry.firstName} ${entry.lastName}`.toLowerCase();
      return (
        (!this.employeeName || fullName.includes(this.employeeName.toLowerCase())) &&
        (!this.department || entry.department === this.department) &&
        (!this.organization || entry.organization === this.organization)
      );
    })];

    // Update available filters
    this.departments = Array.from(new Set(this.rawData.map(e => e.department).filter(d => !!d)));
    this.organizations = Array.from(new Set(this.rawData.map(e => e.organization).filter(o => !!o)));

    // Calculate summary counts
    this.calculateCounts(this.filteredData);

    this.currentPage = 1;
  }

  // CALCULATE COUNTS INCLUDING ABSENTEES
  calculateCounts(data: any[]) {
    const counts = { onTime: 0, shortTime: 0, overTime: 0, absent: 0 };
    const uniqueEmpIds = new Set<string>();

    data.forEach(entry => {
      if (!entry.status || !entry.employeeId) return;
      const status = entry.status.toLowerCase();
      switch (status) {
        case 'on time': counts.onTime++; break;
        case 'short time': counts.shortTime++; break;
        case 'overtime': counts.overTime++; break;
      }
      uniqueEmpIds.add(entry.employeeId);
    });

    // Fetch all employees to calculate absent count
    this.attendanceService.getAllEmployeeIds().subscribe({
      next: (allIds: string[]) => {
        counts.absent = allIds.filter(id => !uniqueEmpIds.has(id)).length;
        this.totalEmployees = allIds.length;

        // Trigger Angular change detection
        this.initialCounts = { ...counts };
      },
      error: (err) => console.error('Failed to fetch employee IDs:', err)
    });
  }

  // PAGINATION
  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredData.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  isNumber(value: any): value is number {
    return typeof value === 'number';
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  get paginationRange(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 1;
    const range: (number | string)[] = [];

    const left = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);

    range.push(1);
    if (left > 2) range.push('...');
    for (let i = left; i <= right; i++) range.push(i);
    if (right < total - 1) range.push('...');
    if (total > 1) range.push(total);

    return range;
  }

  scanQR() {
    this.router.navigate(['/scan-qr']);
  }
}