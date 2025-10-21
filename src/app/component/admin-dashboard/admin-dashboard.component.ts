import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceChartComponent } from '../attendance-chart/attendance-chart.component';
import * as XLSX from 'xlsx';
import { OrganizationService } from '../../services/organization.service';

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

  locationName: string = '';
  locations: string[] = [];
  allEmployeeIds: string[] = [];

  initialCounts = { onTime: 0, shortTime: 0, overTime: 0, absent: 0 ,present: 0};
  currentPage = 1;
  itemsPerPage = 10;

  showLocationDialog = false;
  showConfirmDialog = false;
  selectedEmployee: any = null;
  selectedLocation: string = '';
  filteredLocations: any[] = [];
  travelTime: string = '';

  successMessage = '';
  errorMessage = '';

  expandedEntryKey: string | null = null;
  expandedBox: string | null = null;
  showAbsentOnly: boolean = false;

  openMenuIndex: number | null = null;
  showScheduleDialog = false;
  selectedScheduleId: string = '';
  schedules: any[] = []; 

  statusClassMap: Record<string, string> = {
    'On Time': 'ontime',
    'Overtime': 'overtime',
    'Short Time': 'shorttime'
  };
  
  getStatusClass(status: string): string {
    return this.statusClassMap[status] || 'unknown';
  }  

  get totalPresent(): number {
    return (this.initialCounts.onTime || 0) +
           (this.initialCounts.shortTime || 0) +
           (this.initialCounts.overTime || 0)+
           (this.initialCounts.present || 0);
  }
  

  toggleExpand(box: string) {
    this.expandedBox = this.expandedBox === box ? null : box;
  }

  constructor(
    private router: Router,
    private attendanceService: AttendanceService,
    private organizationService: OrganizationService,
  ) {}

  ngOnInit() {
    this.attendanceService.getAllEmployeeIds().subscribe((employees: any[]) => {
      this.allEmployeeIds = employees
        .filter(e => (e.designation?.toLowerCase() !== 'test_admin'))
        .map(e => e.employeeId);
  
      this.onDateFilter();
    });
  }
  uniqueKey(entry: any): string {
    return `${entry.employeeId}_${entry.date}`;
  }
  
  employeeDateKey(entry: any): string {
    return `${entry.employeeId}_${entry.date}`;
  }
  
  // Instead of using employeeDateKey, use the object reference itself
toggleBreaks(entry: any) {
  // If this row is already expanded, collapse it
  this.expandedEntryKey = this.expandedEntryKey === entry ? null : entry;
}

  
  // helper to iterate object keys in template
  getBreakKeys(breaks: any): string[] {
    return breaks ? Object.keys(breaks) : [];
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
        Designation: entry.designation || '-',
        Organization: entry.organization,
        'Punch In': punchIn,
        'Punch Out': punchOut,
        'Work Hours': entry.workHours || '-',
        'Updated Deduction (mins)': entry.updatedDeduction
          ? `${
              (parseInt(entry.updatedDeduction.replace(/\D/g, ''), 10) || 0) * 2
            } mins`
          : '0',
        Status: entry.status,
        'Overtime Hours': overtimeHours,
        'Site Location': entry.locationName || '-',
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

  onAbsentToggle() {
    const fetch$ = this.showAbsentOnly
      ? this.attendanceService.getAbsentData(this.startDate, this.endDate)
      : this.attendanceService.getAttendanceData(this.startDate, this.endDate);
  
    fetch$.subscribe({
      next: (resp: any) => {
        // Normalize response
        const data = resp?.data ?? resp ?? [];
        this.rawData = data.filter((entry: any) => (entry.designation || '').toLowerCase() !== 'test_admin');
        this.applyFilters(); // reapply filters after data load
      },
      error: (err) => console.error('Failed to fetch attendance data:', err)
    });
  }
  

  // FETCH DATA
  onDateFilter() {
    const fetch$ = this.showAbsentOnly
      ? this.attendanceService.getAbsentData(this.startDate, this.endDate)  // <-- call absent API
      : this.attendanceService.getAttendanceData(this.startDate, this.endDate); // normal

    fetch$.subscribe({
      next: (resp: any) => {
        const data = (resp as any).data ?? resp;

        this.rawData = data.filter(
          (entry: any) => (entry.designation || '').toLowerCase() !== 'test_admin'
        );

        this.applyFilters();
      },
      error: (err: any) => console.error('Failed to fetch attendance data:', err),
    });
  }  

  // APPLY FILTERS
  applyFilters() {
    this.filteredData = [...this.rawData.filter((entry) => {
      const fullName = `${entry.firstName} ${entry.lastName}`.toLowerCase();
      return (
        (!this.employeeName || fullName.includes(this.employeeName.toLowerCase())) &&
        (!this.department || entry.department === this.department) &&
        (!this.organization || entry.organization === this.organization) &&
        (!this.locationName || entry.locationName === this.locationName)
      );
    })];

    // Update available filters
    this.departments = Array.from(new Set(this.rawData.map(e => e.department).filter(d => !!d)));
    this.organizations = Array.from(new Set(this.rawData.map(e => e.organization).filter(o => !!o)));
    this.locations = Array.from(new Set(this.rawData.map(e => e.locationName).filter(l => !!l)));

    // Calculate summary counts
    this.calculateCounts(this.filteredData);

    this.currentPage = 1;
  }

  // CALCULATE COUNTS INCLUDING ABSENTEES
  calculateCounts(data: any[]) {
    const counts = { onTime: 0, shortTime: 0, overTime: 0, absent: 0, present: 0 };
  
    if (this.showAbsentOnly) {
      // When showing absent data only, count all records as absent
      counts.absent = data.length;
      counts.onTime = 0;
      counts.shortTime = 0;
      counts.overTime = 0;
      counts.present = 0;
    } else {
      const empStatusMap = new Map<string, string>();
  
      // Aggregate latest status per employee, ignoring test_admin
      data.forEach(entry => {
        if (!entry.employeeId) return;
  
        const designation = (entry.designation || '').toLowerCase();
        if (designation === 'test_admin') return; // skip test_admin
  
        if (entry.status) {
          empStatusMap.set(entry.employeeId, entry.status.toLowerCase());
        }
      });
  
      // Count attendance categories
      empStatusMap.forEach(status => {
        switch (status) {
          case 'on time':
            counts.onTime++;
            break;
          case 'short time':
            counts.shortTime++;
            break;
          case 'overtime':
            counts.overTime++;
            break;
          case 'present':
            counts.present++;
            break;
        }
      });
  
      // Absent = allEmployeeIds minus employees who have any attendance
      counts.absent = this.allEmployeeIds.filter(id => !empStatusMap.has(id)).length;
    }
  
    this.totalEmployees = this.allEmployeeIds.length;
    this.initialCounts = { ...counts };
  }  

  canExpand(entry: any): boolean {
    return !!entry.breaks && Object.keys(entry.breaks).length > 0;
  }
  
  canUpdateLocation(): boolean {
    return !this.showAbsentOnly;
  }
  

  
  closeDialog() {
    this.showLocationDialog = false;
    this.showScheduleDialog = false;
    this.selectedEmployee = null;
  }
  
  confirmLocation() {
    this.showConfirmDialog = true;
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
  openLocationDialog(entry: any) {
    this.selectedEmployee = { ...entry }; // make a copy
    this.selectedLocation = entry.locationName; 
    this.showLocationDialog = true;
  
    this.organizationService.getLocations().subscribe({
      next: (locations: any[]) => {
        if (entry.designation?.toLowerCase() === 'driver') {
          this.filteredLocations = locations.filter(
            loc => loc.locationName.startsWith('TRIP_') || loc.locationId === 'default'
          );
        } else {
          this.filteredLocations = locations.filter(
            loc => !loc.locationName.startsWith('TRIP_')
          );
        }
      },
      error: () => (this.errorMessage = 'Failed to fetch locations')
    });
  }
  
  onLocationChange(event: any) {
    const loc = this.filteredLocations.find(l => l.locationName === this.selectedLocation);
    this.travelTime = loc?.travelTime || '0';
  }
  
  hasLocationChanged(): boolean {
    return (
      this.selectedEmployee &&
      this.selectedLocation &&
      this.selectedLocation !== this.selectedEmployee.locationName
    );
  }
  
  submitLocation() {
    if (!this.selectedEmployee || !this.selectedLocation) return;
  
    const selectedLocObj = this.filteredLocations.find(
      loc => loc.locationName === this.selectedLocation
    );
  
    const locationId = this.hasLocationChanged() ? selectedLocObj?.locationId : undefined;
  
    const payload = {
      ...this.selectedEmployee,
      punches: this.selectedEmployee.punches || {},
      locationId: locationId ?? this.selectedEmployee.locationId,
      locationName: this.selectedLocation,
    };
  
    this.attendanceService.updateEmployeeLocationOrScheduleData(payload, locationId).subscribe({
      next: () => {
        this.selectedEmployee.locationName = this.selectedLocation;
        this.successMessage = `Location updated successfully for ${this.selectedEmployee.firstName}`;
        this.showLocationDialog = false;
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: () => {
        this.errorMessage = 'Failed to update location';
        setTimeout(() => (this.errorMessage = ''), 3000);
      }
    });
  }
  
  // ------------------------- SCHEDULE -------------------------
  
  openScheduleDialog(entry: any) {
    this.selectedEmployee = { ...entry }; // copy
    this.selectedScheduleId = entry.scheduleId || '';
    this.showScheduleDialog = true;
    this.openMenuIndex = null;
  
    this.organizationService.getSchedules().subscribe({
      next: (res: any[]) => {
        // Map schedules with readable display but keep ID intact
        this.schedules = res.map(sch => ({
          scheduleId: sch.scheduleId,
          startTime: sch.startTime,
          endTime: sch.endTime,
          displayTime: this.formatScheduleTime(sch.startTime, sch.endTime)
        }));
  
        // ✅ Match employee’s current schedule by ID (not display text)
        const currentSchedule = this.schedules.find(
          sch => sch.scheduleId === this.selectedScheduleId
        );
  
        this.selectedEmployee.scheduleDisplayTime = currentSchedule
          ? currentSchedule.displayTime
          : '';
      },
      error: () => {
        this.errorMessage = 'Failed to load schedules';
        setTimeout(() => (this.errorMessage = ''), 3000);
      }
    });
  }
  
  formatScheduleTime(startTime: string, endTime: string): string {
    const formatToAmPm = (time: string) => {
      if (!time) return '';
      const [h, m] = time.split(':').map(Number);
      const suffix = h >= 12 ? 'PM' : 'AM';
      const hour = ((h + 11) % 12 + 1);
      return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
    };
    return `${formatToAmPm(startTime)} - ${formatToAmPm(endTime)}`;
  }
  
  hasScheduleChanged(): boolean {
    return (
      this.selectedEmployee &&
      this.selectedScheduleId &&
      this.selectedScheduleId !== this.selectedEmployee.scheduleId
    );
  }
  
  submitSchedule() {
    if (!this.selectedEmployee || !this.selectedScheduleId) {
      this.errorMessage = 'Please select a schedule.';
      setTimeout(() => (this.errorMessage = ''), 2000);
      return;
    }
  
    const payload = {
      ...this.selectedEmployee,
      punches: this.selectedEmployee.punches || {},
      scheduleId: this.selectedScheduleId,
      previousScheduleId: this.selectedEmployee.scheduleId // ✅ old ID before change
    };
  
    this.attendanceService
      .updateEmployeeLocationOrScheduleData(payload, undefined, this.selectedScheduleId)
      .subscribe({
        next: () => {
          const sch = this.schedules.find(s => s.scheduleId === this.selectedScheduleId);
          this.selectedEmployee.scheduleId = this.selectedScheduleId;
          this.selectedEmployee.scheduleDisplayTime = sch ? sch.displayTime : '';
  
          this.successMessage = `Schedule updated successfully for ${this.selectedEmployee.firstName}`;
          this.showScheduleDialog = false;
          setTimeout(() => (this.successMessage = ''), 3000);
        },
        error: () => {
          this.errorMessage = 'Failed to update schedule.';
          setTimeout(() => (this.errorMessage = ''), 3000);
        }
      });
  }  
  
}