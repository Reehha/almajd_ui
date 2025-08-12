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
  extraEmployeeCount = 0;
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

exportToExcel(): void {
  // Map the data for Excel (no Short Hours column)
  const exportData = this.filteredData.map(entry => {
    // Punch In comparison with arrow
    let punchInDisplay = entry.punchIn || '-';
    if (entry.punchInUpdated) {
      punchInDisplay = `${entry.punchInUpdated} ↑ [${entry.updatedDeduction || '0'}]`;
    }

    // Punch Out comparison with arrow
    let punchOutDisplay = entry.punchOut || '-';
    if (entry.punchOutUpdated) {
      punchOutDisplay = `${entry.punchOutUpdated} ↓ [${entry.updatedDeduction || '0'}]`;
    }

    // Overtime / Short Time columns
    let overtimeHours = '';

    if (entry.status === 'Overtime') {
      overtimeHours = entry.overtime || '';
    } 

    return {
      Date: entry.date,
      'Employee ID': entry.employeeId,
      Name: `${entry.firstName} ${entry.lastName}`,
      Department: entry.department,
      Organization: entry.organization,
      'Punch In': punchInDisplay,
      'Punch Out': punchOutDisplay,
      Status: entry.status,
      'Overtime Hours': overtimeHours,
    };
  });

  // Create worksheet
  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // Date
    { wch: 15 }, // Employee ID
    { wch: 25 }, // Name
    { wch: 20 }, // Punch In
    { wch: 20 }, // Punch Out
    { wch: 15 }, // Status
    { wch: 18 }  // Overtime
  ];

  // Create workbook and add worksheet
  const workbook: XLSX.WorkBook = {
    Sheets: { 'Attendance': worksheet },
    SheetNames: ['Attendance']
  };

  // Save Excel file
  XLSX.writeFile(workbook, `Attendance_${new Date().toISOString().split('T')[0]}.xlsx`);
}
  
  onDateFilter() {
    this.attendanceService.getAttendanceData(this.startDate, this.endDate).subscribe({
      next: (resp) => {
        const data = (resp as any).data ?? resp;
        this.rawData = data;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Failed to fetch attendance data:', err);
      },
    });
  }

  applyFilters() {
    this.filteredData = this.rawData.filter((entry) => {
      return (
        (!this.employeeName || (
          (entry.firstName + ' ' + entry.lastName).toLowerCase().includes(this.employeeName.toLowerCase())
        ))
         &&
        (!this.department || entry.department === this.department) &&
        (!this.organization || entry.organization === this.organization)
      );
    });

    this.departments = Array.from(
      new Set(this.rawData.map((e) => e.department).filter((d) => !!d))
    );
    this.organizations = Array.from(
      new Set(this.rawData.map((e) => e.organization).filter((o) => !!o))
    );

    this.initialCounts = this.calculateCounts(this.filteredData);
    this.currentPage = 1;
  }

  calculateAbsenteesAndTotal(uniqueEmpIds: Set<string>, counts: { absent: number }) {
    this.attendanceService.getAllEmployeeIds().subscribe({
      next: (apiEmployeeIds: string[]) => {
        const extraIds = apiEmployeeIds.filter(id => !uniqueEmpIds.has(id));
        counts.absent = extraIds.length;
        this.totalEmployees = apiEmployeeIds.length;
        
      },
      error: (err) => {
        console.error('Failed to fetch employee names:', err);
      }
    });
  }

  calculateCounts(data: any[]): { onTime: number; shortTime: number; overTime: number; absent: number } {
    const counts = { onTime: 0, shortTime: 0, overTime: 0, absent: 0 };
    const uniqueEmpIds = new Set<string>();

    data.forEach((entry) => {
      if (!entry.status || !entry.employeeId) return;
      const status = entry.status.toLowerCase();
      switch (status) {
        case 'on time':
          counts.onTime++;
          break;
        case 'shortTime':
          counts.shortTime++;
          break;
        case 'over time':
          counts.overTime++;
          break;
      }
      uniqueEmpIds.add(entry.employeeId);
    });

    this.calculateAbsenteesAndTotal(uniqueEmpIds, counts);
    return counts;
  }

  get paginatedData(): any[] {
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

  isNumber(value: any): value is number {
    return typeof value === 'number';
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
  
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = d.getFullYear();
  
    return `${day}/${month}/${year}`;
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

  scanQR() {
    this.router.navigate(['/scan-qr']);
  }
}