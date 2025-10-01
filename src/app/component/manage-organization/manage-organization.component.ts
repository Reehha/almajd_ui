import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InfoTooltipComponent } from '../info-tooltip/info-tooltip.component';
import { OrganizationService, EmployeeAllocation } from '../../services/organization.service';

@Component({
  selector: 'app-dashboard',
  standalone:true,
  imports: [FormsModule, CommonModule,InfoTooltipComponent],
  templateUrl: './manage-organization.component.html',
  styleUrls: ['./manage-organization.component.css'],
})
export class ManageOrganizationComponent {
  employees: any[] = []; // will be populated from API
  filteredEmployees: any[] = [];
  departments: string[] = [];
  designations: string[] = [];
  selectedEmployees: any[] = [];
  selectAllChecked = false;

  selectedDepartment = '';
  selectedDesignation = '';
  filters = { name: '', startTime: '', department: '', designation: '' };

  constructor(private router: Router, private allocationService: OrganizationService) {}

  ngOnInit() {
    this.loadEmployees();
  }

  modalData = {
    scheduleId: '',
    locationId: '',
    travelTime: '',
    startDate: '',
    endDate: '',
  };

  schedules: any[] = [];
  siteLocations: any[] = [];
  

  loadEmployees() {
    this.allocationService.getAllocations().subscribe({
      next: (res) => {
        // Map API response
        this.employees = res.data.map((emp: EmployeeAllocation) => ({
          employeeId: emp.employeeId,
          name: `${emp.firstName} ${emp.lastName}`,
          projectStartTime: emp.startDate ? new Date(emp.startDate) : new Date(),
          projectEndTime: emp.endDate ? new Date(emp.endDate) : new Date(),
          siteLocation: emp.locationName,
          department: emp.department,
          designation: emp.designation,
          schedule: `${this.formatTime12Hr(emp.startTime ?? '')}-${this.formatTime12Hr(emp.endTime ?? '')}`
          }))
          // ✅ Exclude Test_admin records
          .filter((emp: { designation: string; }) => emp.designation !== 'Test_admin');
  
        // ✅ Sort by employeeId, then by projectStartTime (latest first)
        this.employees.sort((a, b) => {
          if (a.employeeId === b.employeeId) {
            return b.projectStartTime.getTime() - a.projectStartTime.getTime();
          }
          return a.employeeId.localeCompare(b.employeeId);
        });
  
        // ✅ Find latest projectStartTime for each employeeId
        const latestMap = new Map<string, Date>();
        this.employees.forEach(emp => {
          if (
            !latestMap.has(emp.employeeId) || 
            emp.projectStartTime > (latestMap.get(emp.employeeId) as Date)
          ) {
            latestMap.set(emp.employeeId, emp.projectStartTime);
          }
        });
  
        // ✅ Mark only latest record as selectable
        this.employees.forEach(emp => {
          emp.isLatest = emp.projectStartTime.getTime() === latestMap.get(emp.employeeId)?.getTime();
        });
  
        this.filteredEmployees = [...this.employees];
        this.generateFilterLists();
      },
      error: (err) => {
        console.error('Error loading employee allocations', err);
      },
    });
  }

  get endDateWarning(): string | null {
    if (!this.modalData.startDate || this.selectedEmployees.length === 0) return null;

    const newStart = new Date(this.modalData.startDate).getTime();
  
    const conflict = this.selectedEmployees.some(emp => 
      emp.projectEndTime && newStart < new Date(emp.projectEndTime).getTime()
    );
  
    return conflict ? '⚠ Warning: New start date is before current project end date. Proceeding will overwrite the current end date to a day before new start date for chosen employee(s).' : null;
  }
  

  loadModalData() {
    this.allocationService.getSchedules().subscribe({
      next: (res) => {
        this.schedules = res.map(sched => ({
          ...sched,
          displayName: `${this.formatTime12Hr(sched.startTime)} - ${this.formatTime12Hr(sched.endTime)}`
        }));
      },
      error: (err) => console.error('Error fetching schedules', err)
    });
  
    this.allocationService.getLocations().subscribe({
      next: (res: any) => {
        this.siteLocations = res.data; // <-- use res.data, not res
      },
      error: (err) => console.error('Error fetching locations', err)
    });
    
  }
  

  generateFilterLists() {
    this.departments = [...new Set(this.employees.map(e => e.department))].sort();
    this.designations = [...new Set(this.employees.map(e => e.designation))].sort();
  }
  minStartDate = '';
  showModal = false;
  currentPage = 1;
pageSize = 10;

touched = {
  scheduleId: false,
  startDate: false,
  endDate: false,
  siteLocationId: false
};

markTouched(field: keyof typeof this.touched) {
  this.touched[field] = true;
}

isScheduleInvalid() {
  return this.touched.scheduleId && !this.modalData.scheduleId;
}

isLocationInvalid() {
  return this.touched.siteLocationId && !this.modalData.locationId;
}

isStartDateInvalid(): boolean {
  if (!this.modalData.startDate) return this.touched.startDate;
  const selectedStart = new Date(this.modalData.startDate).getTime();
  const minStart = new Date(this.minStartDate).getTime();
  return this.touched.startDate && selectedStart < minStart;
}

isEndDateInvalid(): boolean {
  if (!this.modalData.endDate || !this.modalData.startDate) return this.touched.endDate;
  const start = new Date(this.modalData.startDate).getTime();
  const end = new Date(this.modalData.endDate).getTime();
  return this.touched.endDate && end < start;
}

filterTable() {
  this.filteredEmployees = this.employees.filter(
    (e) =>
      (this.selectedDepartment ? e.department === this.selectedDepartment : true) &&
      (this.selectedDesignation ? e.designation === this.selectedDesignation : true)
  );
  this.currentPage = 1; // reset pagination
}

onDepartmentChange() {
  this.filterTable();
}

onDesignationChange() {
  this.filterTable();
}

get paginationRange(): (number | string)[] {
  const total = this.totalPages;
  const current = this.currentPage;
  const delta = 2; // number of pages to show around current page
  const range: (number | string)[] = [];

  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  range.push(1);
  if (left > 2) range.push('...');
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push('...');
  range.push(total);

  return range;
}

isNumber(value: any): value is number {
  return typeof value === 'number';
}



isFormValid(): boolean {
  if (!this.modalData.scheduleId || !this.modalData.startDate || !this.modalData.endDate || !this.modalData.locationId) {
    return false;
  }

  const earliestStart = new Date(
    Math.min(...this.selectedEmployees.map(e => new Date(e.projectStartTime).getTime()))
  );
  const start = new Date(this.modalData.startDate);
  const end = new Date(this.modalData.endDate);
  return start >= earliestStart && end >= start;
}


get totalPages() {
  return Math.ceil(this.filteredEmployees.length / this.pageSize);
}

get pagedEmployees() {
  const start = (this.currentPage - 1) * this.pageSize;
  return this.filteredEmployees.slice(start, start + this.pageSize);
}

goToPage(page: number) {
  this.currentPage = page;
}

prevPage() {
  if (this.currentPage > 1) this.currentPage--;
}

nextPage() {
  if (this.currentPage < this.totalPages) this.currentPage++;
}

get pageNumbers(): number[] {
  return Array.from({ length: this.totalPages }, (_, i) => i + 1);
}
  
  resetFilters() {
    this.selectedDepartment = '';
    this.selectedDesignation = '';
    this.filteredEmployees = [...this.employees];
  }

  applyFilters() {
    this.filteredEmployees = this.employees.filter(
      (emp) =>
        (!this.filters.name ||
          emp.name.toLowerCase().includes(this.filters.name.toLowerCase())) &&
        (!this.filters.startTime ||
          new Date(emp.projectStartTime).toISOString().slice(0, 10) ===
            this.filters.startTime) &&
        (!this.filters.department ||
          emp.department
            .toLowerCase()
            .includes(this.filters.department.toLowerCase())) &&
        (!this.filters.designation ||
          emp.designation
            .toLowerCase()
            .includes(this.filters.designation.toLowerCase()))
    );
    this.selectAllChecked = false;
    this.selectedEmployees = [];
  }

  clearFilters() {
    this.filters = { name: '', startTime: '', department: '', designation: '' };
    this.filteredEmployees = [...this.employees];
    this.selectedEmployees = [];
    this.selectAllChecked = false;
  }

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.selectedEmployees = [...this.filteredEmployees];
    } else {
      this.selectedEmployees = [];
    }
    this.selectAllChecked = event.target.checked;
  }

  toggleSelection(emp: any) {
    const sameStartTime =
      this.selectedEmployees.length === 0 ||
      emp.projectStartTime.getTime() ===
        this.selectedEmployees[0].projectStartTime.getTime();
    if (this.selectedEmployees.includes(emp)) {
      this.selectedEmployees = this.selectedEmployees.filter((e) => e !== emp);
    } else if (sameStartTime) {
      this.selectedEmployees.push(emp);
    }
  }

  isSelectionDisabled(emp: any) {
    // Disable if not the latest project
    if (!emp.isLatest) return true;
  
    // Disable if already selected employees have a different start date
    return (
      this.selectedEmployees.length > 0 &&
      emp.projectStartTime.getTime() !==
        this.selectedEmployees[0].projectStartTime.getTime()
    );
  }
  

  formatTime12Hr(time24: string): string {
    if (!time24) return '';
    const [hoursStr, minutes] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  
  
  openScheduleModal() {
    if (this.selectedEmployees.length > 0) {
      const today = new Date();
      const earliestStart = new Date(
        Math.min(...this.selectedEmployees.map(e => new Date(e.projectStartTime).getTime()))
      );
      this.minStartDate = new Date(
        Math.min(today.getTime(), earliestStart.getTime()) + 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split('T')[0];
      
  
      // Fetch schedules and locations
      this.allocationService.getSchedules().subscribe({
        next: (res) => {
          this.schedules = res.map(sched => ({
            ...sched,
            schedule: `${this.formatTime12Hr(sched.startTime)} - ${this.formatTime12Hr(sched.endTime)}`
          }));
        },
        error: (err) => console.error('Error fetching schedules', err)
      });
  
      this.allocationService.getLocations().subscribe({
        next: (res) => this.siteLocations = res,
        error: (err) => console.error('Error fetching locations', err)
      });
  
      this.showModal = true;
    }
  }
  
  

  updateTravelTime() {
    const selectedSite = this.siteLocations.find(
      loc => loc.locationId == this.modalData.locationId // match by locationId
    );
    this.modalData.travelTime = selectedSite ? selectedSite.travelTime : '';
  }

  saveSchedule() {
    if (!this.isFormValid()) return;

    if (!confirm(`Assign new schedule to ${this.selectedEmployees.length} employee(s)?`)) {
      return; // cancel if user rejects
    }
  
    // Convert date to dd/MM/yyyy
    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      const day = ('0' + d.getDate()).slice(-2);
      const month = ('0' + (d.getMonth() + 1)).slice(-2);
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };
  
    const payload = this.selectedEmployees.map(emp => ({
      employeeId: emp.employeeId,
      startDate: formatDate(this.modalData.startDate),
      endDate: formatDate(this.modalData.endDate),
      scheduleId: this.modalData.scheduleId,
      locationId: this.modalData.locationId
    }));
  
    this.allocationService.assignSchedules(payload).subscribe({
      next: (res) => {
        console.log('Schedules assigned successfully', res);
        this.closeModal();
        this.loadEmployees(); // refresh table if needed
      },
      error: (err) => {
        console.error('Error assigning schedules', err);
      }
    });
  }
  
  

  closeModal() {
    this.showModal = false;
  }
  goToSettings() {
    this.router.navigate(['/org-settings']);
  }
}
