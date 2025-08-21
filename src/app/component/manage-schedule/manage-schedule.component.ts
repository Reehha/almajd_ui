import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizationService } from '../../services/organization.service';
import { HttpErrorResponse } from '@angular/common/http';

export interface Schedule {
  scheduleId: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  isEditing?: boolean;
}

@Component({
  selector: 'app-manage-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-schedule.component.html',
  styleUrls: ['./manage-schedule.component.css']
})

export class ManageScheduleComponent implements OnInit {
  schedules: Schedule[] = [];
  newSchedule: Partial<Schedule> = { startTime: '', endTime: '' };

  // simple, single error banner (as in your HTML)
  error = '';

  // track add form open/close
  showAddSchedule = false;

  // track whether add fields have been focused then blurred (for required msg)
  addTouchedStart = false;
  addTouchedEnd = false;

  // ---------- Pagination ----------
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  pagedSchedules: Schedule[] = [];
  pagesArray: number[] = [];
  
  filteredSchedules: Schedule[] = [];
    // Filters
  filters = { scheduleId: '', startTime: '', endTime: '' };


  constructor(private orgService: OrganizationService) {}

  ngOnInit(): void {
    this.loadSchedules();
  }

  // loadSchedules(): void {
  //   this.orgService.getSchedules().subscribe({
  //     next: (res) => {
  //       this.schedules = res.map(s => ({ ...s, isEditing: false }));
  //       this.setupPagination();
  //     },
  //     error: () => this.error = 'Failed to fetch schedules'
  //   });
  // }

  toggleAddSchedule(): void {
    this.showAddSchedule = !this.showAddSchedule;
    if (!this.showAddSchedule) {
      this.newSchedule = { startTime: '', endTime: '' };
      this.addTouchedStart = this.addTouchedEnd = false;
      this.error = '';
    }
  }

  // ---------- Formatting ----------
  formatTime(time: string): string {
    if (!time) return '';
    const [hour, minute] = time.split(':').map(Number);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${minute.toString().padStart(2, '0')} ${ampm}`;
  }

  // ---------- Add form validation ----------
  onAddBlur(field: 'start' | 'end'): void {
    if (field === 'start') this.addTouchedStart = true;
    if (field === 'end') this.addTouchedEnd = true;
    this.updateAddError();
  }

  onAddInput(): void {
    this.updateAddError();
  }

  private updateAddError(): void {
    if (this.addTouchedStart && !this.newSchedule.startTime) { 
      this.error = 'Start time is required'; 
      return; 
    }
    if (this.addTouchedEnd && !this.newSchedule.endTime) { 
      this.error = 'End time is required'; 
      return; 
    }
  
    if (this.newSchedule.startTime && this.newSchedule.endTime) {
      if (this.newSchedule.endTime <= this.newSchedule.startTime) {
        this.error = 'End time cannot be earlier than Start time';
        return;
      }
  
      if (this.isDuplicate(this.newSchedule.startTime, this.newSchedule.endTime)) {
        this.error = 'A schedule with the same start and end time already exists';
        return;
      }
    }
  
    this.error = '';
  }  

  canAddSchedule(): boolean {
    return !!this.newSchedule.startTime &&
           !!this.newSchedule.endTime &&
           !this.isDuplicate(this.newSchedule.startTime, this.newSchedule.endTime);
  }

  addSchedule(): void {
    if (!this.canAddSchedule()) { this.updateAddError(); return; }
  
    this.orgService.createSchedule({
      startTime: this.newSchedule.startTime!,
      endTime: this.newSchedule.endTime!
    }).subscribe({
      next: (res) => {
        this.schedules.push({ ...res, isEditing: false });
        this.newSchedule = { startTime: '', endTime: '' };
        this.addTouchedStart = this.addTouchedEnd = false;
        this.error = '';
        this.showAddSchedule = false;
        this.applyFilters(false); // 🔹 refresh table
      },
      error: (err) => {
        if (err.error?.message?.includes('same start and end time')) {
          this.error = 'A schedule with the same start and end time already exists';
        } else {
          this.error = 'Failed to add schedule';
        }
      }
    });
  }
  
  // ---------- Edit row ----------
  editSchedule(schedule: Schedule): void {
    (schedule as any).originalStartTime = schedule.startTime;
    (schedule as any).originalEndTime = schedule.endTime;
    schedule.isEditing = true;
    this.error = '';
  }

  hasChanges(schedule: Schedule): boolean {
    return schedule.startTime !== (schedule as any).originalStartTime ||
           schedule.endTime !== (schedule as any).originalEndTime;
  }

  onEditBlur(schedule: Schedule): void {
    if (!schedule.startTime || !schedule.endTime) {
      this.error = 'Start time and End time are required';
      return;
    }
  
    if (schedule.endTime <= schedule.startTime) {
      this.error = 'End time cannot be earlier or same as Start time';
      return;
    }
  
    if (this.isDuplicate(schedule.startTime, schedule.endTime, schedule.scheduleId)) {
      this.error = 'A schedule with the same start and end time already exists';
      return;
    }
  
    this.error = '';
  }
  

  saveSchedule(schedule: Schedule): void {
    if (!schedule.startTime || !schedule.endTime) { this.error = 'Start time and End time are required'; return; }
    if (this.isDuplicate(schedule.startTime, schedule.endTime, schedule.scheduleId)) {
      this.error = 'A schedule with the same start and end time already exists';
      return;
    }

    this.orgService.updateSchedule(schedule.scheduleId, {
      startTime: schedule.startTime,
      endTime: schedule.endTime
    }).subscribe({
      next: () => {
        schedule.isEditing = false;
        this.error = '';
      },
      error: (err: HttpErrorResponse) => {
        if (err.error?.message?.includes('same start and end time')) {
          this.error = 'A schedule with the same start and end time already exists';
        } else {
          this.error = 'Failed to update schedule';
        }
      }
    });
  }

  deleteSchedule(scheduleId: string): void {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    this.orgService.deleteSchedule(scheduleId).subscribe({
      next: () => {
        this.schedules = this.schedules.filter(s => s.scheduleId !== scheduleId);
        this.setupPagination();
      },
      error: () => this.error = 'Failed to delete schedule'
    });
  }

  // ---------- Pagination helpers ----------
  // private setupPagination(): void {
  //   this.totalPages = Math.ceil(this.schedules.length / this.itemsPerPage);
  //   this.pagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  //   this.goToPage(1);
  // }

  // goToPage(page: number): void {
  //   if (page < 1 || page > this.totalPages) return;
  //   this.currentPage = page;
  //   const start = (page - 1) * this.itemsPerPage;
  //   const end = start + this.itemsPerPage;
  //   this.pagedSchedules = this.schedules.slice(start, end);
  // }

  // ---------- Helpers ----------
  private isDuplicate(startTime: string, endTime: string, excludeId?: string): boolean {
    return this.schedules.some(s =>
      s.startTime === startTime &&
      s.endTime === endTime &&
      s.scheduleId !== excludeId
    );
  }

  loadSchedules(): void {
    this.orgService.getSchedules().subscribe({
      next: (res) => {
        this.schedules = res.map(s => ({ ...s, isEditing: false }));
        this.applyFilters(false); // initialize without resetting page
      },
      error: () => this.error = 'Failed to fetch schedules'
    });
  }

  // ---------- 🔹 Filtering ----------
  applyFilters(resetPage = true): void {
    if (resetPage) this.currentPage = 1;

    this.filteredSchedules = this.schedules.filter(s =>
      (!this.filters.scheduleId || String(s.scheduleId).includes(this.filters.scheduleId)) &&
      (!this.filters.startTime || this.formatTime(s.startTime) === this.formatTime(this.filters.startTime)) &&
      (!this.filters.endTime || this.formatTime(s.endTime) === this.formatTime(this.filters.endTime))
    );

    this.setupPagination();
  }

  // ---------- Pagination helpers ----------
  private setupPagination(): void {
    this.totalPages = Math.ceil(this.filteredSchedules.length / this.itemsPerPage) || 1;
    this.pagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.goToPage(this.currentPage);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.pagedSchedules = this.filteredSchedules.slice(start, end);
  }

}
