import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor() { }

  formatDateForBackend(dateString: string): string {
    if (!dateString) {
      return '';
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {        // invalid date guard
      return '';
    }

    // Expected browser `<input type="date">` value => "YYYY-MM-DD"
    const parts = dateString.split('-');
    if (parts.length !== 3) {
      return ''; // invalid format
    }

    const [year, month, day] = parts;
    if (!year || !month || !day) {
      return '';
    }
    // Always return plain DD/MM/YYYY, no timezone involved
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
}
