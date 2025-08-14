import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, CommonModule],
  templateUrl: './manage-organization.component.html',
  styleUrls: ['./manage-organization.component.css'],
})
export class ManageOrganizationComponent {
  constructor(private router: Router) {}
  employees = [
    {
      name: 'John Doe',
      projectStartTime: new Date('2025-08-10'),
      siteLocation: 'Site A',
      department: 'IT',
      designation: 'Engineer',
    },
    {
      name: 'Jane Smith',
      projectStartTime: new Date('2025-08-10'),
      siteLocation: 'Site B',
      department: 'HR',
      designation: 'Manager',
    },
    {
      name: 'Alex Lee',
      projectStartTime: new Date('2025-08-12'),
      siteLocation: 'Site C',
      department: 'Finance',
      designation: 'Analyst',
    },
    {
      name: 'John Doe',
      projectStartTime: new Date('2025-08-10'),
      siteLocation: 'Site A',
      department: 'IT',
      designation: 'Engineer',
    },
    {
      name: 'Jane Smith',
      projectStartTime: new Date('2025-08-10'),
      siteLocation: 'Site B',
      department: 'HR',
      designation: 'Manager',
    },
    {
      name: 'Alex Lee',
      projectStartTime: new Date('2025-08-12'),
      siteLocation: 'Site C',
      department: 'Finance',
      designation: 'Analyst',
    },
    {
      name: 'John Doe',
      projectStartTime: new Date('2025-08-10'),
      siteLocation: 'Site A',
      department: 'IT',
      designation: 'Engineer',
    },
    {
      name: 'Jane Smith',
      projectStartTime: new Date('2025-08-10'),
      siteLocation: 'Site B',
      department: 'HR',
      designation: 'Manager',
    },
    {
      name: 'Alex Lee',
      projectStartTime: new Date('2025-08-12'),
      siteLocation: 'Site C',
      department: 'Finance',
      designation: 'Analyst',
    },
    {
      name: 'John Doe',
      projectStartTime: new Date('2025-08-10'),
      siteLocation: 'Site A',
      department: 'IT',
      designation: 'Engineer',
    },
    {
      name: 'Jane Smith',
      projectStartTime: new Date('2025-08-10'),
      siteLocation: 'Site B',
      department: 'HR',
      designation: 'Manager',
    },
    {
      name: 'Alex Lee',
      projectStartTime: new Date('2025-08-12'),
      siteLocation: 'Site C',
      department: 'Finance',
      designation: 'Analyst',
    },
    
  ];

  filters = { name: '', startTime: '', department: '', designation: '' };
  filteredEmployees = [...this.employees];

  selectedEmployees: any[] = [];
  selectAllChecked = false;
  departments: string[] = [];
  designations: string[] = [];

  selectedDepartment = '';
  selectedDesignation = '';

  schedules = [
    { id: 1, name: 'Morning Shift' },
    { id: 2, name: 'Evening Shift' },
  ];
  siteLocations = [
    { id: 1, name: 'Site A', travelTime: '30 mins' },
    { id: 2, name: 'Site B', travelTime: '60 mins' },
  ];

  modalData = {
    scheduleId: '',
    siteLocationId: '',
    travelTime: '',
    startDate: '',
    endDate: '',
  };
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
  return this.touched.siteLocationId && !this.modalData.siteLocationId;
}

isStartDateInvalid(): boolean {
  if (!this.modalData.startDate) return false;
    return this.touched.startDate && new Date(this.modalData.startDate) < new Date(this.minStartDate);
}

isEndDateInvalid(): boolean {
  if (!this.modalData.endDate || !this.modalData.startDate) return false;
  return this.touched.endDate && new Date(this.modalData.endDate) < new Date(this.modalData.startDate);
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

// isStartDateInvalid(): boolean {
//   if (!this.modalData.startDate) return false;
//   return new Date(this.modalData.startDate) < new Date(this.minStartDate);
// }

// isEndDateInvalid(): boolean {
//   if (!this.modalData.endDate || !this.modalData.startDate) return false;
//   return new Date(this.modalData.endDate) < new Date(this.modalData.startDate);
// }


isFormValid(): boolean {
  if (!this.modalData.scheduleId || !this.modalData.startDate || !this.modalData.endDate || !this.modalData.siteLocationId) {
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


  ngOnInit() {
    // Assuming you already have this.employees loaded from your table
    this.generateFilterLists();
  }

  generateFilterLists() {
    this.departments = [
      ...new Set(this.employees.map((e) => e.department)),
    ].sort();
    this.designations = [
      ...new Set(this.employees.map((e) => e.designation)),
    ].sort();
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
    return (
      this.selectedEmployees.length > 0 &&
      emp.projectStartTime.getTime() !==
        this.selectedEmployees[0].projectStartTime.getTime()
    );
  }

  openScheduleModal() {
    if (this.selectedEmployees.length > 0) {
      const today = new Date();
      const earliestStart = new Date(
        Math.min(...this.selectedEmployees.map(e => new Date(e.projectStartTime).getTime()))
      );
      // Set minStartDate to the later of today or earliest employee projectStartTime
      this.minStartDate = new Date(Math.min(today.getTime(), earliestStart.getTime()))
        .toISOString()
        .split('T')[0];
  
      this.showModal = true;
    }
  }
  

  updateTravelTime() {
    const site = this.siteLocations.find(
      (s) => s.id === +this.modalData.siteLocationId
    );
    this.modalData.travelTime = site ? site.travelTime : '';
  }

  saveSchedule() {
    // TODO: Save to backend
    this.closeModal();
  }

  closeModal() {
    this.showModal = false;
  }
  goToSettings() {
    this.router.navigate(['/org-settings']);
  }
}
