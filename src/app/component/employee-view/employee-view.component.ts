import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-view',
  imports:[CommonModule,FormsModule],
  templateUrl: './employee-view.component.html',
  styleUrls: ['./employee-view.component.css']
})
export class EmployeeViewComponent implements OnInit {
  employee: any;
  isEditMode = false;

  constructor(
    private route: ActivatedRoute,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    const empId = this.route.snapshot.paramMap.get('id');
    this.employeeService.getAllEmployees().subscribe((res) => {
      this.employee = res.data.find((e: any) => e.employeeId === empId);
    });
  }

  toggleEdit(): void {
    this.isEditMode = true;
  }

  save(): void {
    this.isEditMode = false;
    alert('Saved successfully');
    // Implement update API logic here
  }

  cancel(): void {
    this.isEditMode = false;
    this.ngOnInit(); // reload employee data
  }
}
