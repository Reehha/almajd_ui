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
    const today = new Date();
    
    const exportData = this.filteredEmployees.map((entry: any) => {
      const warnings: string[] = [];
  
      const checkExpiry = (label: string, dateStr: string) => {
        if (!dateStr) return;
        const parts = dateStr.split('/');
        if (parts.length !== 3) return;
      
        const [day, month, year] = parts;
        const expiryDate = new Date(`${year}-${month}-${day}`);
        const diff = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
        const dayLabel = (n: number) => `${Math.abs(n)} day${Math.abs(n) === 1 ? '' : 's'}`;
      
        if (diff < 0) {
          warnings.push(`${label} expired ${dayLabel(diff)} ago.`);
        } else if (diff <= 90) {
          warnings.push(`${label} expires in ${dayLabel(diff)}.`);
        }
      };      
  
      checkExpiry('Passport', entry.passportExpiry);
      checkExpiry('Visa', entry.visaExpiry);
      checkExpiry('Emirates ID', entry.emiratesIdExpiry);
  
      return {
        'Employee ID': entry.employeeId,
        'First Name': entry.firstName,
        'Last Name': entry.lastName,
        'Email': entry.email,
        'Joining Date': entry.joiningDate,
        'DOB': entry.dob,
        'Phone': entry.phone,
        'Department': entry.department,
        'Designation': entry.designation,
        'Organization': entry.organization,
        'Nationality': entry.nationality,
        'Passport Number': entry.passportNumber,
        'Passport Expiry': entry.passportExpiry,
        'Emirates ID': entry.emiratesId,
        'Emirates ID Expiry': entry.emiratesIdExpiry,
        'Visa Expiry': entry.visaExpiry,
        'Reporting Manager': entry.reportingManager,
        'Manager': entry.manager ? 'Yes' : 'No',
        'Document Status': warnings.join('\n')
      };
    });
  
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  
    // Auto-fit columns based on longest text in each column
    const autoFitColumns = (data: any[]): XLSX.ColInfo[] => {
      const keys = Object.keys(data[0] || {});
      return keys.map(key => {
        const maxLength = Math.max(
          key.length,
          ...data.map(row => String(row[key] ?? '').length)
        );
        return { wch: maxLength + 2 }; // +2 for padding
      });
    };
  
    worksheet['!cols'] = autoFitColumns(exportData);
  
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Employees': worksheet },
      SheetNames: ['Employees']
    };
  
    XLSX.writeFile(workbook, `filtered_employees_${today.toISOString().split('T')[0]}.xlsx`);
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
