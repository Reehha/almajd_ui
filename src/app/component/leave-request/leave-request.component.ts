import { Component,NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-leave-request',
  imports: [FormsModule],
  templateUrl: './leave-request.component.html',
  styleUrls: ['./leave-request.component.css'],
})

export class LeaveRequestComponent {
  startDate: string = '';
  endDate: string = '';
  reason: any;

  onSubmit() {
    alert(`Leave requested from ${this.startDate} to ${this.endDate}\nReason: ${this.reason}`);
  }
}