import { Component, OnInit, HostListener } from '@angular/core';
import { RegistrationService } from '../../services/registration.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Role {
  name: string;
  isEditing?: boolean;
  isNew?: boolean;
  error?: string;
  touched?: boolean;
}

interface Department {
  name: string;
  roles: Role[];
  expanded?: boolean;
  isEditing?: boolean;
  isNew?: boolean;
  error?: string;
  touched?: boolean;
}

interface Organization {
  name: string;
  departments: Department[];
  expanded?: boolean;
  isEditing?: boolean;
  isNew?: boolean;
  error?: string;
  touched?: boolean;
}

@Component({
  selector: 'app-organization-settings',
  imports: [FormsModule, CommonModule],
  templateUrl: './organization-settings.component.html',
  styleUrls: ['./organization-settings.component.css']
})
export class OrganizationSettingsComponent implements OnInit {
  organizations: Organization[] = [];
  loading: boolean = true;
  deletedItems: {
    orgs: Organization[];
    depts: Department[];
    roles: Role[];
  } = { orgs: [], depts: [], roles: [] };
  
  // ---------- Delete ----------
  deleteItem(item: Organization | Department | Role, list: any[], type: 'org' | 'dept' | 'role') {
    const index = list.indexOf(item);
    if (index >= 0) list.splice(index, 1);
  
    // Track deleted items
    if (type === 'org') this.deletedItems.orgs.push(item as Organization);
    if (type === 'dept') this.deletedItems.depts.push(item as Department);
    if (type === 'role') this.deletedItems.roles.push(item as Role);
  }
  
  // ---------- Unsaved Changes ----------
  get hasUnsavedChanges(): boolean {
    const edits = this.organizations.some(org =>
      org.isEditing || org.isNew || org.touched ||
      org.departments.some(dept =>
        dept.isEditing || dept.isNew || dept.touched ||
        dept.roles.some(role => role.isEditing || role.isNew || role.touched)
      )
    );
    const deletions = this.deletedItems.orgs.length > 0 ||
                      this.deletedItems.depts.length > 0 ||
                      this.deletedItems.roles.length > 0;
    return edits || deletions;
  }
  
  
  // ---------- Discard ----------
  confirmDiscard() {
    if (!this.hasUnsavedChanges) return;
  
    const confirmDiscard = window.confirm(
      'You have unsaved changes. Are you sure you want to discard them?'
    );
    if (confirmDiscard) {
      this.deletedItems = { orgs: [], depts: [], roles: [] };
      this.loadOrganizations();
    }
  }
  

  constructor(private regService: RegistrationService) {}

  ngOnInit(): void {
    this.loadOrganizations();
  }

  // ---------- Load Data ----------
  loadOrganizations() {
    this.regService.getOrganizations().subscribe({
      next: (res: any) => {
        this.organizations = res.data.map((org: any) => ({
          name: org.name,
          expanded: false,
          isEditing: false,
          isNew: false,
          error: '',
          touched: false,
          departments: org.departments
            ? Object.keys(org.departments).map(depName => ({
                name: depName,
                expanded: false,
                isEditing: false,
                isNew: false,
                error: '',
                touched: false,
                roles: org.departments[depName].map((role: string) => ({
                  name: role,
                  error: '',
                  touched: false
                }))
              }))
            : []
        }));
        this.loading = false;
      },
      error: err => {
        console.error('Failed to load organizations', err);
        this.loading = false;
      }
    });
  }

  // ---------- Validation ----------
  isDuplicateName(item: Organization | Department | Role, list: any[]): boolean {
    return list
      .filter(i => i !== item)
      .some(i => i.name.trim().toLowerCase() === item.name.trim().toLowerCase());
  }

  validateItem(item: Organization | Department | Role, list?: any[]): boolean {
    if (!item.name || !item.name.trim()) {
      item.error = 'Name cannot be empty';
      return false;
    }
    if (list && this.isDuplicateName(item, list)) {
      item.error = 'Duplicate name not allowed at this level';
      return false;
    }
    item.error = '';
    return true;
  }

  markTouchedAndValidate(item: Organization | Department | Role, list?: any[]) {
    item.touched = true;
    this.validateItem(item, list);
  }

  hasValidationErrors(): boolean {
    return this.organizations.some(org => {
      if (!this.validateItem(org, this.organizations)) return true;
      return org.departments.some(dept => {
        if (!this.validateItem(dept, org.departments)) return true;
        return dept.roles.some(role => !this.validateItem(role, dept.roles));
      });
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: Event) {
    if (this.hasUnsavedChanges) {
      event.preventDefault();
      (event as any).returnValue = '';
    }
  }

  // ---------- Edit / Save ----------
  editItem(item: Organization | Department | Role) {
    item.isEditing = true;
  }

  saveItem(item: Organization | Department | Role, list?: any[]) {
    item.touched = true;
    if (!this.validateItem(item, list)) return;
    item.isEditing = false;
    item.isNew = false;
  }

  cancelEdit(item: Organization | Department | Role, list: any[]) {
    if (item.isNew) {
      const index = list.indexOf(item);
      if (index >= 0) list.splice(index, 1);
    } else {
      item.isEditing = false;
      item.error = '';
      item.touched = false;
    }
  }


  // ---------- Expand / Collapse ----------
  toggleExpand(item: Organization | Department) {
    item.expanded = !item.expanded;
  }

  // ---------- Add Items ----------
  addOrganization() {
    this.organizations.push({
      name: '',
      departments: [],
      expanded: true,
      isEditing: true,
      isNew: true,
      error: '',
      touched: false
    });
  }

  addDepartment(org: Organization) {
    org.departments.push({
      name: '',
      roles: [],
      expanded: true,
      isEditing: true,
      isNew: true,
      error: '',
      touched: false
    });
    org.expanded = true;
  }

  addRole(dept: Department) {
    dept.roles.push({
      name: '',
      isEditing: true,
      isNew: true,
      error: '',
      touched: false
    });
    dept.expanded = true;
  }

  // Function to prepare JSON for backend
// Transform organizations to backend JSON format
prepareSavePayload(): any[] {
  return this.organizations.map(org => ({
    name: org.name.trim(),
    departments: org.departments.reduce((acc: any, dept) => {
      acc[dept.name.trim()] = dept.roles.map(role => role.name.trim());
      return acc;
    }, {})
  }));
}

// Save All Changes with API call
saveAllChanges() {
  if (this.hasValidationErrors()) {
    alert('Please fix all errors before saving.');
    return;
  }

  const payload = this.prepareSavePayload();
  console.log('Payload to send:', payload);

  this.regService.saveOrganizations(payload).subscribe({
    next: res => {
      alert('All changes saved successfully!');
      // Reset states
      this.organizations.forEach(org => {
        org.isEditing = false;
        org.isNew = false;
        org.touched = false;
        org.departments.forEach(dept => {
          dept.isEditing = false;
          dept.isNew = false;
          dept.touched = false;
          dept.roles.forEach(role => {
            role.isEditing = false;
            role.isNew = false;
            role.touched = false;
          });
        });
      });
      this.deletedItems = { orgs: [], depts: [], roles: [] };
    },
    error: err => {
      console.error('Failed to save organizations', err);
      alert('Failed to save changes. Please try again.');
    }
  });
}

}
