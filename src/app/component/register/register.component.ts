import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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


ngOnInit() {
  this.getReportingManagers();
  this.getDepartments()
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

  // Format with spaces: 971 55 1234567
  let formatted = '';
  if (digits.length >= 3) {
    formatted = digits.substring(0, 3); // 971
  }
  if (digits.length >= 5) {
    formatted += ' ' + digits.substring(3, 5); // 55
  }
  if (digits.length > 5) {
    formatted += ' ' + digits.substring(5); // 1234567
  }

  this.employee.phone = formatted;

  // Revalidate
  const isValid = /^\s*971\s\d{2}\s\d{7}\s*$/.test(this.employee.phone);
  if (!isValid) {
    control.control.setErrors({ invalidPhone: true });
  } else {
    control.control.setErrors(null); // ✅ Clear error
  }
}



allowOnlyNumbers(event: KeyboardEvent): void {
  const isDigit = /\d/.test(event.key);
  if (!isDigit) {
    event.preventDefault();
  }
}


getReportingManagers() {
  this.http.get<any>('http://localhost:8081/auth/employee/managers')
    .subscribe({
      next: (response) => {
        this.reportingManagers = response.data.map((manager: any) => ({
          id: manager.employeeId,
          name: `${manager.firstName} ${manager.lastName}`
        }));
      },
      error: (err) => console.error('Failed to load managers', err)
    });
}

getDepartments() {
  this.http.get<any>('http://localhost:8081/dept/all')
    .subscribe({
      next: (response) => {
        this.departments = response.data.map((dept: any) => ({
          id: dept.departmentId,
          name: dept.name
        }));
      },
      error: (err) => console.error('Failed to load departments', err)
    });
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

  constructor(private http: HttpClient, private router: Router) {}


 
  formatDateForBackend(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    // Format as DD/MM/YYYY with leading zeros
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }

  onRegister() {
    this.submitted = true;
    const { contactNumber, ...backendData } = this.employee;
  
    const formattedData = {
      ...backendData,
      dob: this.formatDateForBackend(this.employee.dob),
      joiningDate: this.formatDateForBackend(this.employee.joiningDate),
      visaExpiry: this.formatDateForBackend(this.employee.visaExpiry)
    };
  
    this.http.post<any>('http://localhost:8081/auth/register', formattedData).subscribe({
      next: (response) => {
        if (response.status === 200 && response.data) {
          const employeeId = response.data.employeeId;
          const password = response.data.password;
  
          alert(
            `✅ Registration Successful!\n\n` +
            `🆔 Username (Employee ID): ${employeeId}\n` +
            `🔐 Password: ${password}\n\n` +
            `⚠️ Please save these credentials securely. You won't be able to view them again.`
          );
        } else {
          alert("Registration succeeded but unexpected response format.");
        }
      },
      error: (error) => {
        console.error('Registration failed:', error);
        alert("❌ Registration failed. Please try again.");
      }
    });
  }
  
  
}
