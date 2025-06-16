import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  imports: [CommonModule],
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  notificationCount: number = 3;
  showNotifications: boolean = false;
  showProfileMenu: boolean = false;
  
  notifications = [
    { id: 1, message: 'New leave request from Sarah' },
    { id: 2, message: 'System maintenance scheduled' }
  ];

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    // Close profile menu if notifications open
    if (this.showNotifications) this.showProfileMenu = false;
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
    // Close notifications if profile menu open
    if (this.showProfileMenu) this.showNotifications = false;
  }

  logout() {
    // Implement your logout logic here
    console.log('Logging out...');
    this.showProfileMenu = false;
  }
}