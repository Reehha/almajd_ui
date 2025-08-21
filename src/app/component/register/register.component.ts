import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { RegistrationService } from '../../services/registration.service'
import { OrganizationService } from '../../services/organization.service';

interface Schedule {
  scheduleId: string;
  startTime: string; // e.g., "10:00:00"
  endTime: string;   // e.g., "17:00:00"
}

interface Location {
  locationId: string;
  locationName: string;
  travelTime?: number;
}


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  employee: any = {};
  submitted = false;
  reportingManagers: any[] = [];
  departments: any[] = [];
  organizationsData: any[] = []; // Full org-dept-role tree
  organizations: string[] = [];  // Just names to show in dropdown
  designations: string[] = [];  
  today: string = new Date().toISOString().split('T')[0]; // 'yyyy-mm-dd' format
  schedules: { id: string, display: string }[] = [];
  workLocations: string[] = [];




  ngOnInit() {
    this.registrationService.getReportingManagers().subscribe({
      next: (response: { data: any[] }) => {
        this.reportingManagers = response.data.map((manager: any) => ({
          id: manager.employeeId,
          name: `${manager.firstName} ${manager.lastName}`,
        }));
      },
      error: (err) => console.error('Failed to load managers', err),
    });
  
    this.registrationService.getOrganizations().subscribe({
      next: (response: { data: any[] }) => {
        this.organizationsData = response.data;
        this.organizations = response.data.map(org => org.name);
      },
      error: (err) => console.error('Failed to load organizations', err),
    });    
// ✅ Schedules
this.orgService.getSchedules().subscribe({
  next: (schedulesData: Schedule[]) => {
    if (Array.isArray(schedulesData)) {
      this.schedules = schedulesData.map(s => ({
        id: s.scheduleId, // value for form
        display: this.formatTime(s.startTime) + ' - ' + this.formatTime(s.endTime) // what user sees
      }));
    } else {
      console.warn('Unexpected schedules response:', schedulesData);
      this.schedules = [];
    }
  },
  error: (err) => {
    console.error('Failed to load schedules', err);
    this.schedules = [];
  }
});

// ✅ Locations
this.orgService.getLocations().subscribe({
  next: (locationsData: Location[]) => {
    if (Array.isArray(locationsData)) {
      // Map to names for dropdown
      this.workLocations = locationsData.map(loc => loc.locationName);
    } else {
      console.warn('Unexpected locations response:', locationsData);
      this.workLocations = [];
    }
  },
  error: (err) => {
    console.error('Failed to load locations', err);
    this.workLocations = [];
  }
});
  }  

  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    const [hourStr, minStr] = timeStr.split(':');
    let hour = parseInt(hourStr, 10);
    const minutes = minStr;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; // 0 becomes 12
    return `${hour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }

isDateExpired(date: string): boolean {
  return !!date && new Date(date) < new Date(this.today);
}

onScheduleChange(event: any) {
  if (event.target.value == 'manage-schedule') {
    // Reset selection so the dropdown doesn’t stay on "manage"
    this.employee.schedule = '';

    // Navigate to Manage Schedule page
    this.router.navigate(['/manage-schedule']);
  }
}

goToManage(type: string) {
  if (type === 'schedule') {
    this.router.navigate(['/manage-schedule']);
  } else if (type === 'location') {
    this.router.navigate(['/manage-location']);
  }
}

onLocationChange(event: any) {
  if (event.target.value === 'manage-location') {
    this.router.navigate(['/manage-location']);
    this.employee.workLocation = null;
  }
}

isEndDateInvalid(): boolean {
  if (!this.employee.scheduleStartDate || !this.employee.scheduleEndDate) {
    return false; // don’t show error if one is missing
  }
  return new Date(this.employee.scheduleEndDate) < new Date(this.employee.scheduleStartDate);
}

isUnder18(dob: string): boolean {
  if (!dob) return false;
  return new Date().getFullYear() - new Date(dob).getFullYear() < 18 ;
}


  onOrganizationChange(): void {
    const selectedOrg = this.organizationsData.find(
      org => org.name === this.employee.organization
    );
  
    if (selectedOrg) {
      this.departments = Object.keys(selectedOrg.departments);
    } else {
      this.departments = [];
    }
  
    // Reset dependent fields
    this.employee.department = '';
    this.employee.designation = '';
    this.designations = [];
  }
  
  onDepartmentChange(): void {
    const selectedOrg = this.organizationsData.find(
      org => org.name === this.employee.organization
    );
  
    if (selectedOrg && selectedOrg.departments[this.employee.department]) {
      this.designations = selectedOrg.departments[this.employee.department];
    } else {
      this.designations = [];
    }
  
    this.employee.designation = '';
  }
  

  onEmiratesIdInput(): void {
    let digits = this.employee.emiratesId.replace(/\D/g, '').slice(0, 15); // Only digits, max 15

    const parts = [];
    if (digits.length > 0) parts.push(digits.substring(0, 3));
    if (digits.length > 3) parts.push(digits.substring(3, 7));
    if (digits.length > 7) parts.push(digits.substring(7, 14));
    if (digits.length > 14) parts.push(digits.substring(14));

    this.employee.emiratesId = parts.join(' ');
  }

  onPhoneInput(control: any): void {
    let digits = this.employee.phone.replace(/\D/g, '');
  
    // Force to start with '971'
    if (!digits.startsWith('971')) {
      digits = '971' + digits;
    }
  
    // Max length = 12 digits (971 + 2 digits + 7 digits)
    digits = digits.slice(0, 12);
  
    // Format with + and spaces: +971 55 1234567
    let formatted = '+';
    if (digits.length >= 3) {
      formatted += digits.substring(0, 3); // +971
    }
    if (digits.length >= 5) {
      formatted += ' ' + digits.substring(3, 5); // 55
    }
    if (digits.length > 5) {
      formatted += ' ' + digits.substring(5); // 1234567
    }
  
    this.employee.phone = formatted;
  
    // Revalidate — now expects +971 format
    const isValid = /^\+971\s\d{2}\s\d{7}$/.test(this.employee.phone);
    if (!isValid) {
      control.control.setErrors({ invalidPhone: true });
    } else {
      control.control.setErrors(null); // ✅ Valid
    }
  }
  



  allowOnlyNumbers(event: KeyboardEvent): void {
    const isDigit = /\d/.test(event.key);
    if (!isDigit) {
      event.preventDefault();
    }
  }

  countries: string[] = [
    'Afghanistan',
    'Albania',
    'Algeria',
    'Andorra',
    'Angola',
    'Argentina',
    'Armenia',
    'Australia',
    'Austria',
    'Azerbaijan',
    'Bahamas',
    'Bahrain',
    'Bangladesh',
    'Barbados',
    'Belarus',
    'Belgium',
    'Belize',
    'Benin',
    'Bhutan',
    'Bolivia',
    'Bosnia and Herzegovina',
    'Botswana',
    'Brazil',
    'Brunei',
    'Bulgaria',
    'Burkina Faso',
    'Burundi',
    'Cambodia',
    'Cameroon',
    'Canada',
    'Cape Verde',
    'Central African Republic',
    'Chad',
    'Chile',
    'China',
    'Colombia',
    'Comoros',
    'Congo',
    'Costa Rica',
    'Croatia',
    'Cuba',
    'Cyprus',
    'Czech Republic',
    'Denmark',
    'Djibouti',
    'Dominica',
    'Dominican Republic',
    'Ecuador',
    'Egypt',
    'El Salvador',
    'Equatorial Guinea',
    'Eritrea',
    'Estonia',
    'Eswatini',
    'Ethiopia',
    'Fiji',
    'Finland',
    'France',
    'Gabon',
    'Gambia',
    'Georgia',
    'Germany',
    'Ghana',
    'Greece',
    'Grenada',
    'Guatemala',
    'Guinea',
    'Guinea-Bissau',
    'Guyana',
    'Haiti',
    'Honduras',
    'Hungary',
    'Iceland',
    'India',
    'Indonesia',
    'Iran',
    'Iraq',
    'Ireland',
    'Israel',
    'Italy',
    'Jamaica',
    'Japan',
    'Jordan',
    'Kazakhstan',
    'Kenya',
    'Kiribati',
    'Kuwait',
    'Kyrgyzstan',
    'Laos',
    'Latvia',
    'Lebanon',
    'Lesotho',
    'Liberia',
    'Libya',
    'Liechtenstein',
    'Lithuania',
    'Luxembourg',
    'Madagascar',
    'Malawi',
    'Malaysia',
    'Maldives',
    'Mali',
    'Malta',
    'Marshall Islands',
    'Mauritania',
    'Mauritius',
    'Mexico',
    'Micronesia',
    'Moldova',
    'Monaco',
    'Mongolia',
    'Montenegro',
    'Morocco',
    'Mozambique',
    'Myanmar',
    'Namibia',
    'Nauru',
    'Nepal',
    'Netherlands',
    'New Zealand',
    'Nicaragua',
    'Niger',
    'Nigeria',
    'North Korea',
    'North Macedonia',
    'Norway',
    'Oman',
    'Pakistan',
    'Palau',
    'Palestine',
    'Panama',
    'Papua New Guinea',
    'Paraguay',
    'Peru',
    'Philippines',
    'Poland',
    'Portugal',
    'Qatar',
    'Romania',
    'Russia',
    'Rwanda',
    'Saint Kitts and Nevis',
    'Saint Lucia',
    'Saint Vincent and the Grenadines',
    'Samoa',
    'San Marino',
    'Sao Tome and Principe',
    'Saudi Arabia',
    'Senegal',
    'Serbia',
    'Seychelles',
    'Sierra Leone',
    'Singapore',
    'Slovakia',
    'Slovenia',
    'Solomon Islands',
    'Somalia',
    'South Africa',
    'South Korea',
    'South Sudan',
    'Spain',
    'Sri Lanka',
    'Sudan',
    'Suriname',
    'Sweden',
    'Switzerland',
    'Syria',
    'Taiwan',
    'Tajikistan',
    'Tanzania',
    'Thailand',
    'Togo',
    'Tonga',
    'Trinidad and Tobago',
    'Tunisia',
    'Turkey',
    'Turkmenistan',
    'Tuvalu',
    'Uganda',
    'Ukraine',
    'United Arab Emirates',
    'United Kingdom',
    'United States',
    'Uruguay',
    'Uzbekistan',
    'Vanuatu',
    'Vatican City',
    'Venezuela',
    'Vietnam',
    'Yemen',
    'Zambia',
    'Zimbabwe',
  ];

  constructor(private http: HttpClient, private router: Router, private registrationService: RegistrationService, private orgService: OrganizationService) { }



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

  onRegister(registerForm: NgForm) {
    this.submitted = true;
    const { contactNumber, ...backendData } = this.employee;
  
    // 🔹 Find the selected schedule and location IDs
    const selectedSchedule = this.schedules.find(s => s.id === this.employee.schedule);
    const selectedLocation = this.workLocations.find(loc => loc === this.employee.workLocation);
  
    const formattedData = {
      ...backendData,
      dob: this.formatDateForBackend(this.employee.dob),
      joiningDate: this.formatDateForBackend(this.employee.joiningDate),
      visaExpiry: this.formatDateForBackend(this.employee.visaExpiry),
      emiratesIdExpiry: this.formatDateForBackend(this.employee.emiratesIdExpiry),
      passportExpiry: this.formatDateForBackend(this.employee.passportExpiry),
  
      // 🔹 Add new fields
      scheduleId: selectedSchedule ? selectedSchedule.id : '',
      locationId: selectedLocation ? selectedLocation : '',
      startDate: this.formatDateForBackend(this.employee.scheduleStartDate),
      endDate: this.formatDateForBackend(this.employee.scheduleEndDate)
    };
  
    this.registrationService.registerEmployee(formattedData).subscribe({
      next: (response) => {
        if (response.status === 200 && response.data) {
          const { employeeId, password } = response.data;
          registerForm.resetForm();
          alert(
            `✅ Registration Successful!\n\n` +
            `🆔 Username (Employee ID): ${employeeId}\n` +
            `🔐 Password: ${password}\n\n` +
            `⚠️ Please save these credentials securely.`
          );
        } else {
          alert('Registration succeeded but unexpected response format.');
        }
      },
      error: (error) => {
        if (error.status == 409) {
          console.error('Registration failed:', error);
          alert('❌ Registration failed. Employee with provided e-mail already exists.');
        } else {
          console.error('Registration failed:', error.message);
          alert('❌ Registration failed. Please try again.');
        }
      }
    });
  }  

}
