import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { RegistrationService } from '../../services/registration.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { IdCardService } from '../../services/id-card.service';

@Component({
  selector: 'app-organization-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './organization-settings.component.html',
  styleUrl: './organization-settings.component.css'
})
export class OrganizationSettingsComponent implements OnInit {
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
    if (!this.nameInput.trim() && this.actionType === 'add') {
      alert('Organization name is required!');
      return;
    }
  
    const token = localStorage.getItem('accessToken'); // get JWT
  
    if (!token) {
      alert('User is not authenticated.');
      return;
    }
  
    if (this.actionType === 'add') {
      this.regService.addOrganization(this.nameInput).subscribe({
        next: () => {
          alert('Organization added successfully!');
          this.organizations.push({ name: this.nameInput, departments: {} });
          this.resetForm();
        },
        error: (err) => {
          console.error('Error creating organization', err);
          alert('Failed to add organization.');
        }
      });
    } 
    // else if (this.actionType === 'update') {
    //   if (!this.selectedOrg) {
    //     alert('Please select an organization to update.');
    //     return;
    //   }
  
    //   this.regService.updateOrganization(this.selectedOrg.name, this.nameInput, token).subscribe({
    //     next: () => {
    //       alert('Organization updated successfully!');
    //       this.selectedOrg.name = this.nameInput;
    //       this.resetForm();
    //     },
    //     error: (err) => {
    //       console.error('Error updating organization', err);
    //       alert('Failed to update organization.');
    //     }
    //   });
    // } 
    else if (this.actionType === 'delete') {
      if (!this.selectedOrg) {
        alert('Please select an organization to delete.');
        return;
      }
  
      if (!confirm(`Are you sure you want to delete "${this.selectedOrg.name}"?`)) return;
  
      this.regService.deleteOrganization(this.selectedOrg.name).subscribe({
        next: () => {
          alert('Organization deleted successfully!');
          // Remove from local array
          this.organizations = this.organizations.filter(org => org !== this.selectedOrg);
          this.resetForm();
        },
        error: (err) => {
          console.error('Error deleting organization', err);
          alert('Failed to delete organization.');
        }
      });
    }
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
