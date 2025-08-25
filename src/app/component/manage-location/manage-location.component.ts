import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizationService, Location } from '../../services/organization.service';

@Component({
  selector: 'app-manage-location',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-location.component.html',
  styleUrls: ['./manage-location.component.css']
})
export class ManageLocationComponent implements OnInit {
  locations: (Location & { isEditing?: boolean })[] = [];
  newLocation = { locationName: '', travelTime: 0 };
  showAddLocation = false;  // expandable form
  error = '';
  loading = false;
  filters = { locationName: '', locationId: '' };
  filteredLocations: (Location & { isEditing?: boolean })[] = [];

  addTouchedName = false;
  addTouchedTravel = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  paginatedLocations: (Location & { isEditing?: boolean })[] = [];

  constructor(private orgService: OrganizationService) {}

  ngOnInit(): void {
    this.loadLocations();
  }


  // ---------- Toggle Add Location ----------
  toggleAddLocation(): void {
    this.showAddLocation = !this.showAddLocation;
    if (!this.showAddLocation) {
      this.newLocation = { locationName: '', travelTime: 0 };
      this.error = '';
      this.addTouchedName = this.addTouchedTravel = false;
    }
  }

  // ---------- Add Location ----------
  onAddBlur(field: 'name' | 'travel'): void {
    if (field === 'name') this.addTouchedName = true;
    if (field === 'travel') this.addTouchedTravel = true;
    this.updateAddError();
  }

  onAddInput(): void {
    this.updateAddError();
  }

  private updateAddError(): void {
    const name = this.newLocation.locationName.trim();

    if (this.addTouchedName && !name) { this.error = 'Location name cannot be empty'; return; }
    if (this.addTouchedTravel && (this.newLocation.travelTime === null || this.newLocation.travelTime < 0)) { 
      this.error = 'Travel time must be positive'; return; 
    }
    if (name && this.locations.some(l => l.locationName.toLowerCase() === name.toLowerCase())) {
      this.error = 'Location name already exists';
      return;
    }

    this.error = '';
  }

  canAddLocation(): boolean {
    const name = this.newLocation.locationName.trim();
    return this.showAddLocation &&
           !!name &&
           this.newLocation.travelTime >= 0 &&
           !this.locations.some(l => l.locationName.toLowerCase() === name.toLowerCase());
  }

  addLocation(): void {
    if (!this.canAddLocation()) { this.onAddBlur('name'); return; }

    if (!confirm(`Are you sure you want to add location "${this.newLocation.locationName}"?`)) {
      return;
    }

    const payload = {
      locationName: this.newLocation.locationName.trim(),
      travelTime: this.newLocation.travelTime
    };
  
    this.orgService.createLocation(payload).subscribe({
      next: (res) => {
        this.locations.push({ ...res, isEditing: false });
        this.newLocation = { locationName: '', travelTime: 0 };
        this.addTouchedName = this.addTouchedTravel = false;
        this.error = '';
        this.showAddLocation = false;
        this.applyFilters(false); // 🔹 refresh filter + pagination
      },
      error: () => {
        this.error = 'Failed to add location';
      }
    });
  }

  // ---------- Edit Location ----------
  editLocation(loc: Location & { isEditing?: boolean }): void {
    loc.isEditing = true;
    (loc as any).originalName = loc.locationName;
    (loc as any).originalTravel = loc.travelTime;
    this.error = '';
  }

  onEditBlur(loc: Location & { isEditing?: boolean }): void {
    const name = loc.locationName.trim();

    if (!name) { this.error = 'Location name cannot be empty'; return; }
    if (loc.travelTime === null || loc.travelTime < 0) { this.error = 'Travel time must be positive'; return; }
    if (this.locations.some(l => l.locationId !== loc.locationId && l.locationName.toLowerCase() === name.toLowerCase())) {
      this.error = 'Location name already exists';
      return;
    }

    this.error = '';
  }

  saveLocation(loc: Location & { isEditing?: boolean }): void {
    this.onEditBlur(loc);
    if (this.error) return;
  
    const name = loc.locationName.trim();
  
    // ✅ check if no changes were made
    if (
      name === (loc as any).originalName &&
      loc.travelTime === (loc as any).originalTravel
    ) {
      loc.isEditing = false; // exit edit mode without saving
      return;
    }
  
    // ✅ confirm only if changes exist
    if (!confirm(`Save changes to "${name}"?`)) return;
  
    this.orgService.updateLocation(loc.locationId, { locationName: name, travelTime: loc.travelTime }).subscribe({
      next: () => {
        loc.isEditing = false;
        loc.locationName = name;
        this.error = '';
        this.updatePaginatedData();
      },
      error: () => this.error = 'Failed to update location'
    });
  }

  deleteLocation(locationId: string): void {
    const loc = this.locations.find(l => l.locationId === locationId);
    if (!loc) return;
  
    if (!confirm(`Are you sure you want to delete location "${loc.locationName}"?`)) return;
  
    // ✅ Optimistic UI update (reflect immediately like Add)
    const originalLocations = [...this.locations];
    this.locations = this.locations.filter(l => l.locationId !== locationId);
    this.applyFilters(false); // keep pagination + filters consistent
  
    this.orgService.deleteLocation(locationId).subscribe({
      next: () => {
        this.error = '';
      },
      error: () => {
        this.error = 'Failed to delete location';
        // ❌ rollback if API fails
        this.locations = originalLocations;
        this.applyFilters(false);
      }
    });
  }  

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
    }
  }

  get paginationRange(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const range: (number | string)[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) range.push(i);
    } else {
      range.push(1);
      if (current > 3) range.push('...');
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) range.push(i);
      if (current < total - 2) range.push('...');
      range.push(total);
    }

    return range;
  }

  isNumber(value: any): value is number {
    return typeof value === 'number';
  }

  loadLocations(): void {
    this.loading = true;
    this.orgService.getLocations().subscribe({
      next: (res) => {
        this.locations = res.map(l => ({ ...l, isEditing: false }));
        this.applyFilters(false); // initialize with all data
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to fetch locations';
        this.loading = false;
      }
    });
  }

  // ---------- 🔹 Apply Filters ----------
  applyFilters(resetPage = true): void {
    if (resetPage) this.currentPage = 1;

    this.filteredLocations = this.locations.filter(loc =>
      (!this.filters.locationName || loc.locationName.toLowerCase().includes(this.filters.locationName.toLowerCase())) &&
      (!this.filters.locationId || String(loc.locationId).includes(this.filters.locationId))
    );

    this.updatePaginatedData();
  }

  // ---------- Pagination Helpers ----------
  updatePaginatedData(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedLocations = this.filteredLocations.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredLocations.length / this.pageSize);
  }
}
