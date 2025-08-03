import { Injectable } from '@angular/core';

interface ManageEmployeeTableState {
  filters: {
    name: string;
    employeeId: string;
    department: string;
    designation: string;
  };
  currentPage: number;
}

@Injectable({
  providedIn: 'root'
})
export class TableStateService {
  private readonly key = 'employeeDashboardState';

  saveState(state: ManageEmployeeTableState): void {
    sessionStorage.setItem(this.key, JSON.stringify(state));
  }

  getState(): ManageEmployeeTableState | null {
    const state = sessionStorage.getItem(this.key);
    return state ? JSON.parse(state) : null;
  }

  clearState(): void {
    sessionStorage.removeItem(this.key);
  }
}
