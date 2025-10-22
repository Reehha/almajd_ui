import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizationService, Location } from '../../services/organization.service';

// Form-only shape that allows blank travel time for placeholder UX
interface NewLocation {
  locationName: string;
  travelTime: number | null;
}

@Component({
  selector: 'app-manage-location',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-location.component.html',
  styleUrls: ['./manage-location.component.css']
})
export class ManageLocationComponent implements OnInit {
  locations: (Location & { isEditing?: boolean })[] = [];
  newLocation: NewLocation = { locationName: '', travelTime: null };
  showAddLocation = false;
  error = '';
  loading = false;
  filters = { locationName: '', locationId: '' };
  filteredLocations: (Location & { isEditing?: boolean })[] = [];
  private readonly TRIP_PREFIX = 'TRIP_';
  driverLocationMessage: string | null = null;

  addTouchedName = false;
  addTouchedTravel = false;
  isDriverLocation = false;
  editingIsDriverLocation: { [id: string]: boolean } = {};

  // Pagination
  currentPage = 1;
  pageSize = 10;
  paginatedLocations: (Location & { isEditing?: boolean })[] = [];

  constructor(private orgService: OrganizationService) {}

  ngOnInit(): void {
    this.loadLocations();
  }

  private showSuccess(msg: string): void {
    alert(msg);
  }

  // ---------- Toggle Add Location ----------
  toggleAddLocation(): void {
    this.showAddLocation = !this.showAddLocation;
    if (!this.showAddLocation) {
      this.newLocation = { locationName: '', travelTime: null }; // reset to placeholder state
      this.error = '';
      this.addTouchedName = this.addTouchedTravel = false;
    }
  }

  // ---------- Reusable Driver Location Logic ----------
  private enforceDriverLocation(input: any, loc: { locationName: string; travelTime: number | null }): void {
    // Ensure prefix
    if (!loc.locationName.startsWith(this.TRIP_PREFIX)) loc.locationName = this.TRIP_PREFIX;

    // Keep only digits after prefix
    // const digits = loc.locationName.replace(/^TRIP_/, '').replace(/\D/g, '');
    // loc.locationName = this.TRIP_PREFIX + digits;

    // Travel time = 0
    loc.travelTime = 0;

    // Cursor after prefix
    setTimeout(() => {
      const inputEl: HTMLInputElement = input;
      inputEl.setSelectionRange(loc.locationName.length, loc.locationName.length);
    });
  }

  // ---------- Add Location Handlers ----------
  onDriverLocationFocus(event: any): void {
    if (this.isDriverLocation) this.enforceDriverLocation(event.target, this.newLocation);
  }

  onDriverLocationInput(event: any): void {
    if (this.isDriverLocation) this.enforceDriverLocation(event.target, this.newLocation);
    this.updateAddError();
  }

  onDriverLocationKeydown(event: KeyboardEvent): void {
    if (!this.isDriverLocation) return;
    const inputEl = event.target as HTMLInputElement;
    if (
      (event.key === 'Backspace' && inputEl.selectionStart! <= this.TRIP_PREFIX.length) ||
      (event.key === 'Delete' && inputEl.selectionStart! < this.TRIP_PREFIX.length)
    ) {
      event.preventDefault();
    }
  }

  // allowOnlyNumbers(event: KeyboardEvent): void {
  //   if (!this.isDriverLocation) return;
  //   const isDigit = /\d/.test(event.key);
  //   if (!isDigit && event.key !== 'Backspace' && event.key !== 'Delete') event.preventDefault();
  // }

  onDriverCheckboxChange(): void {
    if (this.isDriverLocation) {
      this.driverLocationMessage = 
        `For driver locations: The location name must start with '<b><i>${this.TRIP_PREFIX}</i></b>' and travel time will be 0.`;
      this.newLocation.travelTime = 0;
      if (!this.newLocation.locationName.startsWith(this.TRIP_PREFIX)) 
        this.newLocation.locationName = this.TRIP_PREFIX;
    } else {
      this.driverLocationMessage = null;
    }
  }
  
  preventCut(event: ClipboardEvent) {
    event.preventDefault(); // blocks cut
  }

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

    if (this.addTouchedName && !name) {
      this.error = 'Location name cannot be empty';
      return;
    }

    if (this.isDriverLocation) {
      if (!name.startsWith(this.TRIP_PREFIX)) {
        this.error = 'Driver location name must start with TRIP_';
        return;
      }
      const suffix = name.substring(this.TRIP_PREFIX.length);
      if (!suffix.match(/^[a-zA-Z0-9]+$/)) { // allow alphanumeric only
        this.error = 'Driver location name must have alphanumeric characters after TRIP_';
        return;
      }
    }    

    if (!this.isDriverLocation && this.addTouchedTravel && (this.newLocation.travelTime === null || this.newLocation.travelTime < 0)) {
      this.error = 'Travel time must be positive';
      return;
    }

    if (name && this.locations.some(l => l.locationName.toLowerCase() === name.toLowerCase())) {
      this.error = 'Location name already exists';
      return;
    }

    this.error = '';
  }

  canAddLocation(): boolean {
    const name = this.newLocation.locationName.trim();
    if (this.error) return false;

    if (this.isDriverLocation) {
      const suffix = name.substring(this.TRIP_PREFIX.length);
      return this.showAddLocation &&
             name.startsWith(this.TRIP_PREFIX) &&
             !!suffix &&
             /^[a-zA-Z0-9]+$/.test(suffix) &&
             !this.locations.some(l => l.locationName.toLowerCase() === name.toLowerCase());
    }

    // Use ?? 0 to avoid TS error with number|null while keeping previous behavior (blank treated as 0)
    const travelOk = (this.newLocation.travelTime ?? 0) >= 0;
    return this.showAddLocation &&
           !!name &&
           travelOk &&
           !this.locations.some(l => l.locationName.toLowerCase() === name.toLowerCase());
  }

  addLocation(): void {
    if (!this.canAddLocation()) { this.onAddBlur('name'); return; }
    if (!confirm(`Are you sure you want to add location "${this.newLocation.locationName}"?`)) return;

    // Normalize null -> 0 for API contract
    const payload = {
      locationName: this.newLocation.locationName.trim(),
      travelTime: this.newLocation.travelTime ?? 0
    };
    this.orgService.createLocation(payload).subscribe({
      next: (res) => {
        this.locations.push({ ...res, isEditing: false });
        this.newLocation = { locationName: '', travelTime: null }; // reset to placeholder state
        this.addTouchedName = this.addTouchedTravel = false;
        this.error = '';
        this.showAddLocation = false;
        this.applyFilters(false);
        this.showSuccess(`Location "${payload.locationName}" has been successfully added.`);
      },
      error: () => { this.error = 'Failed to add location'; }
    });
  }

  // ---------- Edit Location ----------
  editLocation(loc: Location & { isEditing?: boolean }): void {
    loc.isEditing = true;
    (loc as any).originalName = loc.locationName;
    (loc as any).originalTravel = loc.travelTime;
    this.editingIsDriverLocation[loc.locationId] = loc.locationName.startsWith(this.TRIP_PREFIX);
    if (this.editingIsDriverLocation[loc.locationId]) loc.travelTime = 0;
    this.error = '';
  }

  onEditDriverLocationFocus(event: any, loc: Location & { isEditing?: boolean }): void {
    if (this.editingIsDriverLocation[loc.locationId]) this.enforceDriverLocation(event.target, loc);
  }

  onEditDriverLocationInput(event: any, loc: Location & { isEditing?: boolean }): void {
    if (this.editingIsDriverLocation[loc.locationId]) this.enforceDriverLocation(event.target, loc);
    this.onEditBlur(loc);
  }

  onEditDriverLocationKeydown(event: KeyboardEvent, loc: Location & { isEditing?: boolean }): void {
    if (!this.editingIsDriverLocation[loc.locationId]) return;
    const inputEl = event.target as HTMLInputElement;
    if (
      (event.key === 'Backspace' && inputEl.selectionStart! <= this.TRIP_PREFIX.length) ||
      (event.key === 'Delete' && inputEl.selectionStart! < this.TRIP_PREFIX.length)
    ) {
      event.preventDefault();
    }
  }

  onEditBlur(loc: Location & { isEditing?: boolean }): void {
    const name = loc.locationName.trim();
    const isDriver = this.editingIsDriverLocation[loc.locationId];

    if (!name) { this.error = 'Location name cannot be empty'; return; }
    if (isDriver) {
      const suffix = name.substring(this.TRIP_PREFIX.length);
      if (!suffix.match(/^[a-zA-Z0-9]+$/)) {
        this.error = 'Driver location name must have alphanumeric characters after TRIP_';
        return;
      }
      loc.travelTime = 0;
    }     else {
      if ((loc as any).travelTime === null || loc.travelTime < 0) { this.error = 'Travel time must be positive'; return; }
    }
    if (this.locations.some(l => l.locationId !== loc.locationId && l.locationName.toLowerCase() === name.toLowerCase())) {
      this.error = 'Location name already exists'; return;
    }
    this.error = '';
  }

  saveLocation(loc: Location & { isEditing?: boolean }): void {
    this.onEditBlur(loc);
    if (this.error) return;

    const name = loc.locationName.trim();
    if (name === (loc as any).originalName && loc.travelTime === (loc as any).originalTravel) { loc.isEditing = false; return; }
    if (!confirm(`Are you sure to you want to save changes to this location?`)) return;

    // Normalize in case anything came through as null (defensive)
    this.orgService.updateLocation(loc.locationId, {
      locationName: name,
      travelTime: (loc as any).travelTime ?? 0
    }).subscribe({
      next: () => {
        loc.isEditing = false;
        loc.locationName = name;
        this.error = '';
        this.updatePaginatedData();
        this.showSuccess(`Location "${name}" has been successfully updated.`);
      },
      error: () => this.error = 'Failed to update location'
    });
  }

  checkDefaultLocation(locationId: string): boolean {
    return locationId == 'default';
  }

  deleteLocation(locationId: string): void {
    const loc = this.locations.find(l => l.locationId === locationId);
    if (!loc) return;
    if (!confirm(`Are you sure you want to delete location "${loc.locationName}"?`)) return;

    const originalLocations = [...this.locations];
    this.locations = this.locations.filter(l => l.locationId !== locationId);
    this.applyFilters(false);

    this.orgService.deleteLocation(locationId).subscribe({
      next: () => { this.error = ''; },
      error: () => {
        this.error = 'Failed to delete location';
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

  isNumber(value: any): value is number { return typeof value === 'number'; }

  loadLocations(): void {
    this.loading = true;
    this.orgService.getLocations().subscribe({
      next: (res) => {
        this.locations = res.map(l => ({ ...l, isEditing: false }));
        this.applyFilters(false);
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to fetch locations';
        this.loading = false;
      }
    });
  }

  applyFilters(resetPage = true): void {
    if (resetPage) this.currentPage = 1;
    this.filteredLocations = this.locations.filter(loc =>
      (!this.filters.locationName || loc.locationName.toLowerCase().includes(this.filters.locationName.toLowerCase())) &&
      (!this.filters.locationId || String(loc.locationId).includes(this.filters.locationId))
    );
    this.updatePaginatedData();
  }

  updatePaginatedData(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedLocations = this.filteredLocations.slice(start, start + this.pageSize);
  }

  get totalPages(): number { return Math.ceil(this.filteredLocations.length / this.pageSize); }
}
