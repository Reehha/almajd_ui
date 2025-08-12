import { Component, OnInit } from '@angular/core';
import { RegistrationService } from '../../services/registration.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-manage-organization',
  imports:[CommonModule,FormsModule],
  templateUrl: './manage-organization.component.html',
  styleUrls: ['./manage-organization.component.css']
})
export class ManageOrganizationComponent implements OnInit {
  organizations: any[] = [];
  selectedOrg: any = null;
  selectedDept: string = '';
  selectedRole: string = '';
  actionType: string = 'add';
  nameInput: string = '';
  activeTab: 'org' | 'dept' | 'role' | 'schedule' | 'location' = 'org';
   // -------- Schedule Vars --------
   schedules: any[] = [];
   selectedSchedule: any = null;
   startTime: string = '';
   endTime: string = '';
 
   // -------- Location Vars --------
   locations: any[] = [];
   selectedLocation: any = null;
   siteLocation: string = '';
   travelTimes: any[] = [30, 60, 90, 120, 'custom'];
   travelTime: any = '';
   customTravelTime: number | null = null;
   showCustomTravel: boolean = false;

// onTravelTimeChange() {
//   if (this.selectedTravelTime !== 'custom') {
//     this.customTravelTime = 0;
//   }
// }


  constructor(private regService: RegistrationService) {}

  ngOnInit(): void {
    this.regService.getOrganizations().subscribe({
      next: (response: { data: any[] }) => {
        this.organizations = response.data; // keep full object
      },
      error: (err) => console.error('Failed to load organizations', err),
    });
    
  }

  getDepartments(): string[] {
    return this.selectedOrg ? Object.keys(this.selectedOrg.departments || {}) : [];
  }

  getRoles(): string[] {
    if (!this.selectedOrg || !this.selectedDept) return [];
    return this.selectedOrg.departments?.[this.selectedDept] || [];
  }

  getLocations() {
    this.regService.getAllLocations().subscribe({
      next: (res) => this.locations = res,
      error: (err) => console.error('Error loading locations', err)
    });
  }
  

  resetForm() {
    this.nameInput = '';
    this.startTime = '';
    this.endTime = '';
    this.siteLocation = '';
    this.travelTime = '';
    this.customTravelTime = null;
    this.showCustomTravel = false;
    this.selectedDept = '';
    this.selectedRole = '';
    this.selectedSchedule = null;
    this.selectedLocation = null;
  }

  submitOrg() {
    console.log('Add Org:', this.nameInput);
  }

  submitDept() {
    console.log(`${this.actionType} Dept under`, this.selectedOrg.name, ':', this.nameInput || this.selectedDept);
  }

  submitRole() {
    console.log(`${this.actionType} Role under`, this.selectedOrg.name, '>', this.selectedDept, ':', this.nameInput || this.selectedRole);
  }

  submitLocation() {
    console.log(`${this.actionType} Role under`, this.selectedOrg.name, '>', this.selectedDept, ':', this.nameInput || this.selectedRole);
  }

  submitSchedule() {
    if (this.actionType === 'add') {
      if (this.schedules.some(s => s.startTime === this.startTime && s.endTime === this.endTime)) {
        alert('This schedule already exists.');
        return;
      }
      // POST add schedule
    } else if (this.actionType === 'update') {
      if (!this.selectedSchedule) {
        alert('Please select a schedule to update.');
        return;
      }
      // PUT update schedule
    } else if (this.actionType === 'delete') {
      if (!this.selectedSchedule) {
        alert('Please select a schedule to delete.');
        return;
      }
      // DELETE schedule
    }
  }

}
