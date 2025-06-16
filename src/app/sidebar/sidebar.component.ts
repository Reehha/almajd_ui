import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NavItem {
  icon: string;
  label: string;
  link: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  navItems: NavItem[] = [
    { icon: 'users', label: 'Employee', link: '/employee-dashboard' },
    { icon: 'building', label: 'Department', link: '/department-dashboard' },
    { icon: 'calendar-minus', label: 'Leave', link: '/leave' },
    { icon: 'calendar-check', label: 'Attendance', link: '/attendance' },
    { icon: 'calendar-alt', label: 'Calendar', link: '/calendar' },
  ];
}