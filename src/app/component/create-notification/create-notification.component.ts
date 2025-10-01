import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { NotificationService } from '../../services/notification.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-create-notification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-notification.component.html',
  styleUrls: ['./create-notification.component.css'],
})
export class CreateNotificationComponent implements OnInit {
  employees: any[] = [];
  filteredEmployees: any[] = [];
  selectedEmployees: any[] = [];
  selectAllChecked = false;
  today: string = new Date().toISOString().split('T')[0];
  expiryTouched = false;

  filters = {
    id: '',
    name: '',
    department: '',
    organization: '',
    designation: '',
  };

  dropdowns = {
    organizations: [] as string[],
    departments: [] as string[],
    designations: [] as string[],
  };

  currentPage = 1;
  pageSize = 10;

  notificationData = {
    title: '',
    message: '',
    expiry: '',
  };

  errorMessages = {
    title: 'Title is required and must be at most 50 characters.',
    message: 'Message is required and must be at most 180 characters.',
    expiry: 'Expiry date cannot be earlier than today.',
  };

  constructor(
    private employeeService: EmployeeService,
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.employeeService.getAllEmployees().subscribe({
      next: (res: any) => {
        this.employees = res.data
          .filter((emp: any) => emp.designation !== 'Test_admin')
          .map((emp: any) => ({
            id: emp.employeeId,
            name: `${emp.firstName} ${emp.lastName}`.trim(),
            organization: emp.organization || '',
            department: emp.department || '',
            designation: emp.designation || '',
          }));

        this.filteredEmployees = [...this.employees];

        this.dropdowns.organizations = [
          ...new Set(this.employees.map((e) => e.organization)),
        ].sort();
        this.dropdowns.departments = [
          ...new Set(this.employees.map((e) => e.department)),
        ].sort();
        this.dropdowns.designations = [
          ...new Set(this.employees.map((e) => e.designation)),
        ].sort();
      },
      error: (err) => {
        console.error('Error fetching employees:', err);
        this.employees = [];
        this.filteredEmployees = [];
      },
    });
  }

  applyFilters() {
    // Reset selections when filters change
    this.selectedEmployees = [];
    this.selectAllChecked = false;

    this.filteredEmployees = this.employees.filter(
      (emp) =>
        (!this.filters.id || emp.id.includes(this.filters.id)) &&
        (!this.filters.name ||
          emp.name.toLowerCase().includes(this.filters.name.toLowerCase())) &&
        (!this.filters.department ||
          emp.department === this.filters.department) &&
        (!this.filters.organization ||
          emp.organization === this.filters.organization) &&
        (!this.filters.designation ||
          emp.designation === this.filters.designation)
    );

    this.currentPage = 1;
  }

  clearFilters() {
    this.filters = {
      id: '',
      name: '',
      department: '',
      organization: '',
      designation: '',
    };
    this.filteredEmployees = [...this.employees];
    this.selectedEmployees = [];
    this.selectAllChecked = false;
  }

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.filteredEmployees.forEach((emp) => {
        if (!this.selectedEmployees.some((e) => e.id === emp.id)) {
          this.selectedEmployees.push(emp);
        }
      });
    } else {
      this.filteredEmployees.forEach((emp) => {
        const idx = this.selectedEmployees.findIndex((e) => e.id === emp.id);
        if (idx > -1) this.selectedEmployees.splice(idx, 1);
      });
    }
    this.selectAllChecked = event.target.checked;
  }

  toggleSelection(emp: any) {
    const idx = this.selectedEmployees.findIndex((e) => e.id === emp.id);
    if (idx > -1) {
      this.selectedEmployees.splice(idx, 1);
    } else {
      this.selectedEmployees.push(emp);
    }

    this.selectAllChecked = this.filteredEmployees.every((emp) =>
      this.selectedEmployees.some((selected) => selected.id === emp.id)
    );
  }

  canSendNotification(): boolean {
    const { title, message } = this.notificationData;

    if (!title?.trim() || !message?.trim()) return false;
    if (title.length > 50 || message.length > 180) return false;
    if (
      this.notificationData.expiry &&
      this.notificationData.expiry < this.today
    )
      return false;

    return this.selectedEmployees.length > 0;
  }

  sendNotification(notifForm: NgForm) {
    if (!this.canSendNotification()) return;

    const employeeId = localStorage.getItem('employeeId') || '';
    const firstname = localStorage.getItem('firstName') || '';
    const lastname = localStorage.getItem('lastName') || '';
    const name = `${firstname} ${lastname}`.trim();

    const payload = {
      target: this.selectedEmployees.map((e) => e.id),
      title: this.notificationData.title.trim(),
      message: this.notificationData.message.trim(),
      source: { employeeId, name },
      expiry: this.notificationData.expiry
        ? this.formatDate(this.notificationData.expiry)
        : null,
    };

    if (confirm('Are you sure you want to send this notification?')) {
      this.notificationService.createNotification(payload).subscribe({
        next: (res) => {
          alert('✅ Notification sent successfully!');

          // Reset form
          this.notificationData = { title: '', message: '', expiry: '' };
          this.selectedEmployees = [];
          this.selectAllChecked = false;

          // Reset expiry touched flag to clear errors
          this.expiryTouched = false;
          notifForm.resetForm();
        },
        error: (err) => console.error('Error sending notification:', err),
      });
    }
  }

  private formatDate(date: string | Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  isExpiryInvalid(): boolean {
    return (
      !!this.notificationData.expiry &&
      this.notificationData.expiry < this.today
    );
  }

  // Pagination helpers
  // Pagination helpers
  get totalPages(): number {
    return Math.ceil(this.filteredEmployees.length / this.pageSize);
  }

  get paginatedEmployees(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredEmployees.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1) page = 1;
    if (page > this.totalPages) page = this.totalPages;
    this.currentPage = page;
  }

  // Optional: Smart range with ellipses
  get paginationRange(): (number | string)[] {
    const range: (number | string)[] = [];
    const delta = 2; // how many pages around current
    let left = this.currentPage - delta;
    let right = this.currentPage + delta;

    if (left < 1) left = 1;
    if (right > this.totalPages) right = this.totalPages;

    for (let i = left; i <= right; i++) {
      range.push(i);
    }

    if (left > 1) {
      if (left > 2) range.unshift('...');
      range.unshift(1);
    }
    if (right < this.totalPages) {
      if (right < this.totalPages - 1) range.push('...');
      range.push(this.totalPages);
    }
    return range;
  }

  isNumber(value: number | string): value is number {
    return typeof value === 'number';
  }
}
