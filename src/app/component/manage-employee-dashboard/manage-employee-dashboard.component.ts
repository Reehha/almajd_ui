import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-manage-employee-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-employee-dashboard.component.html',
  styleUrls: ['./manage-employee-dashboard.component.css']
})
export class ManageEmployeeDashboardComponent implements OnInit {
  employees: any[] = [];
  filteredEmployees: any[] = [];
  paginatedEmployees: any[] = [];

  currentPage = 1;
  pageSize = 10;

  departments: any[] = [];
  roles: any[] = [];
  filters = {
    name: '',
    employeeId: '',
    department: '',
    designation: ''
  };

  constructor(private employeeService: EmployeeService, private router: Router) {}

  ngOnInit(): void {
    this.employeeService.getAllEmployees().subscribe((res) => {
      this.employees = res.data;
      this.filterDepartment();
      this.filterRoles();
      this.filteredEmployees = [...this.employees];
      this.updatePaginatedData();
    });
  }

  filterDepartment(){
    this.departments = [...new Set(this.employees.map(emp => emp.department).filter(Boolean))];
  }

  filterRoles(){
    this.roles = [...new Set(this.employees.map(emp => emp.designation).filter(Boolean))];
  }

  exportToExcel(): void {
    const exportData = this.filteredEmployees.map(emp => ({
      'Employee ID': emp.employeeId,
      'Name': `${emp.firstName} ${emp.lastName}`,
      'Department': emp.department,
      'Designation': emp.designation
    }));
  
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    XLSX.writeFile(workbook, 'employees.xlsx');
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.filteredEmployees = this.employees.filter(emp => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const role = emp.designation;

      return (
        (!this.filters.name || fullName.includes(this.filters.name.toLowerCase())) &&
        (!this.filters.employeeId || emp.employeeId.includes(this.filters.employeeId)) &&
        (!this.filters.department || emp.department === this.filters.department) &&
        (!this.filters.designation || role === this.filters.designation)
      );
    });
    this.updatePaginatedData();
    this.filterDepartment();
    this.filterRoles();
  }

  updatePaginatedData(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedEmployees = this.filteredEmployees.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredEmployees.length / this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
    }
  }

  // ✅ FIX: Must return a value!
  get paginationRange(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 1;
    const range: (number | string)[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) range.push(i);
      return range;
    }

    range.push(1);
    if (current > 3) range.push('...');

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) range.push(i);

    if (current < total - 2) range.push('...');
    range.push(total);

    return range;
  }

  // ✅ FIX: This method is missing
  isNumber(value: any): value is number {
    return typeof value === 'number';
  }

  // ✅ FIX: This method is missing
  viewEmployee(employeeId: string): void {
    this.router.navigate(['/under-construction']);
    // this.router.navigate(['/employee-view', employeeId]);
  }
}
