import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceChartComponent } from '../attendance-chart/attendance-chart.component';
// import * as XLSX from 'xlsx';
// import * as XLSXStyle from 'xlsx-js-style';
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

  statusClassMap: Record<string, string> = {
    'On Time': 'ontime',
    'Overtime': 'overtime',
    'Short Time': 'shorttime'
  };

  activeTab: 'present' | 'absent' | 'all' = 'present';
  
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
  
  toggleBreaks(entry: any) {
    const key = this.uniqueKey(entry);
    this.expandedEntryKey = this.expandedEntryKey === key ? null : key;
  }
  
  // helper to iterate object keys in template
  getBreakKeys(breaks: any): string[] {
    return breaks ? Object.keys(breaks) : [];
  }
  

  async exportToExcel(): Promise<void> {
    const XLSXStyleModule = await import('xlsx-js-style');
    const XLSX = XLSXStyleModule.default || XLSXStyleModule;
  
    const exportData = this.filteredData.map(entry => {
      const punchIn = entry.punchInUpdated || entry.punchIn || '-';
      const punchOut = entry.punchOutUpdated || entry.punchOut || '-';
      const dayName = new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long' });
  
      const status = (entry.status || '').toLowerCase();
      const minutes =
        parseFloat((entry.statusValue || '0').toString().replace(/\D/g, '')) || 0;
  
      let shortTimeHr = '';
      let overtimeHr = '';
  
      if (status === 'overtime') {
        overtimeHr = (minutes / 60).toFixed(2);
      } else if (status === 'short time') {
        shortTimeHr = (minutes / 60).toFixed(2);
      }
  
      return {
        Date: entry.date,
        'Day Name': dayName,
        'Employee ID': entry.employeeId,
        Name: `${entry.firstName} ${entry.lastName}`,
        Department: entry.department,
        Designation: entry.designation || '-',
        Organization: entry.organization,
        'Punch In': punchIn,
        'Punch Out': punchOut,
        'Updated Deduction (mins)': entry.updatedDeduction
          ? `${
              (parseInt(entry.updatedDeduction.replace(/\D/g, ''), 10) || 0) * 2
            } mins`
          : '0',
        'Work Hours': entry.workHours || '-',
        'Short Time (hr)': shortTimeHr,
        Status: entry.status,
        'Overtime (hr)': overtimeHr,
        'Site Location': entry.locationName || '-',
      };
    });
  
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet['!cols'] = [
      { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 20 },
      { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 20 }
    ];
  
    const range = XLSX.utils.decode_range(worksheet['!ref']!);
    for (let R = range.s.r + 1; R <= range.e.r; R++) {
      const dayCellRef = XLSX.utils.encode_cell({ r: R, c: 1 });
      if (worksheet[dayCellRef]?.v === 'Sunday') {
        for (let C = 0; C < worksheet['!cols']!.length; C++) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (worksheet[cellRef]) {
            worksheet[cellRef].s = {
              fill: { fgColor: { rgb: 'FFFF00' } },
              font: { bold: true }
            };
          }
        }
      }
    }
  
    const workbook: any = {
      Sheets: { Attendance: worksheet },
      SheetNames: ['Attendance'],
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
    this.attendanceService.getAttendanceData(this.startDate, this.endDate)
      .subscribe({
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
      const matchesFilters =
        (!this.employeeName || fullName.includes(this.employeeName.toLowerCase())) &&
        (!this.department || entry.department === this.department) &&
        (!this.organization || entry.organization === this.organization) &&
        (!this.locationName || entry.locationName === this.locationName);
  
      // Filter based on active tab
      if (this.activeTab === 'present') {
        return matchesFilters && entry.status && entry.status.toLowerCase() !== 'absent';
      } else if (this.activeTab === 'absent') {
        return matchesFilters && (!entry.status || entry.status.toLowerCase() === 'absent');
      } else {
        return matchesFilters; // 'all' tab
      }
    })];
  
    this.departments = Array.from(new Set(this.rawData.map(e => e.department).filter(Boolean)));
    this.organizations = Array.from(new Set(this.rawData.map(e => e.organization).filter(Boolean)));
    this.locations = Array.from(new Set(this.rawData.map(e => e.locationName).filter(Boolean)));
  
    this.calculateCounts(this.filteredData);
    this.currentPage = 1;
  }
  
  switchTab(tab: 'present' | 'absent' | 'all') {
    this.activeTab = tab;
    this.applyFilters();
  }
  

  // CALCULATE COUNTS INCLUDING ABSENTEES
  calculateCounts(data: any[]) {
    const counts = { onTime: 0, shortTime: 0, overTime: 0, absent: 0, present: 0 };

    data.forEach(entry => {
      const status = (entry.status || '').toLowerCase();
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
        case 'absent':
          counts.absent++;
          break;
      }
    });

    this.totalEmployees = this.allEmployeeIds.length;
    this.initialCounts = { ...counts };
  }

  canExpand(entry: any): boolean {
    return !!entry.breaks && Object.keys(entry.breaks).length > 0;
  }
  
  canUpdateLocation(): boolean {
    return !this.showAbsentOnly;
  }
  

  openLocationDialog(entry: any) {
    this.selectedEmployee = entry;
    this.selectedLocation = entry.locationName; // default preselected
    this.showLocationDialog = true;
  
    // Fetch locations
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
      error: () => this.errorMessage = 'Failed to fetch locations'
    });
  }

  onLocationChange(event: any) {
    const loc = this.filteredLocations.find(l => l.locationName === this.selectedLocation);
    this.travelTime = loc?.travelTime || '0';
  }
  
  closeDialog() {
    this.showLocationDialog = false;
    this.selectedEmployee = null;
  }
  
  confirmLocation() {
    this.showConfirmDialog = true;
  }
  
  submitLocation() {
    if (!this.selectedEmployee) return;
  
    const confirmed = window.confirm(
      `Are you sure you want to update the location for ${this.selectedEmployee.firstName} ${this.selectedEmployee.lastName} to ${this.selectedLocation}?`
    );
    
    if (!confirmed) return;
  
    // Find the selected location object
    const selectedLocObj = this.filteredLocations.find(
      loc => loc.locationName === this.selectedLocation
    );
  
    const locationId = selectedLocObj?.locationId || ''; // ensure correct ID
  
    // Send the request with full data
    this.attendanceService.updateEmployeeLocation(
      this.selectedEmployee,
      this.selectedLocation,
      locationId
    ).subscribe({
      next: () => {
        this.selectedEmployee.locationName = this.selectedLocation;
        this.successMessage = `Location updated successfully for ${this.selectedEmployee.firstName}`;
        this.showLocationDialog = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => {
        this.errorMessage = 'Failed to update location';
        setTimeout(() => this.errorMessage = '', 3000);
      }
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