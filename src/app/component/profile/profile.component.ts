import { Component } from '@angular/core';
import { LogAttendanceComponent } from "../log-attendance/log-attendance.component";

@Component({
  selector: 'app-profile',
  imports: [LogAttendanceComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {

}
