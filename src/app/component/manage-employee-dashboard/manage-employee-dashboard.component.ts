// manage-employee-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-manage-employee-dashboard',
  imports:[CommonModule],
  templateUrl: './manage-employee-dashboard.component.html',
  styleUrls: ['./manage-employee-dashboard.component.css']
})
export class ManageEmployeeDashboardComponent implements OnInit {
  employees: any[] = [];
  paginatedEmployees: any[] = [];
  currentPage = 1;
  pageSize = 5;

  constructor(private employeeService: EmployeeService, private router: Router) {}

  ngOnInit(): void {
    this.employeeService.getAllEmployees().subscribe((res) => {
      this.employees = res.data;
      this.updatePaginatedData();
    });
  }

  updatePaginatedData(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedEmployees = this.employees.slice(start, start + this.pageSize);
  }

  nextPage(): void {
    if ((this.currentPage * this.pageSize) < this.employees.length) {
      this.currentPage++;
      this.updatePaginatedData();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedData();
    }
  }

  viewEmployee(employeeId: string): void {
    this.router.navigate(['/employee-view', employeeId]);
  }
}
