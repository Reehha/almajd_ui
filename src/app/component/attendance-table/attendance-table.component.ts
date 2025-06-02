import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-attendance-table',
  imports:[FormsModule,CommonModule],
  templateUrl: './attendance-table.component.html',
  styleUrls: ['./attendance-table.component.css'],
})
export class AttendanceTableComponent {
  @Input() data: any[] = []; // Define the input property
}