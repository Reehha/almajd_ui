import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoginService } from '../../services/login.service';

interface NavItem {
  icon: string;
  label: string;
  link?: string;
  action?: () => void;
  visible?: () => boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  constructor(
    private readonly loginService: LoginService,
    private readonly router: Router,
    private readonly cd: ChangeDetectorRef
  ) {
    this.loginService.authChanged.subscribe(() => {
      this.cd.markForCheck();
    });
  }

  navItems: NavItem[] = [
    { icon: 'user', label: 'Profile', link: '/profile', visible: () => this.loginService.hasAnyRole(['employee','admin']) },
    { icon: 'users', label: 'Employee', link: '/register', visible: () => this.loginService.hasAnyRole(['admin']) },
    { icon: 'bell', label: 'notifications', link: '/requests', visible: () => this.loginService.hasAnyRole(['admin']) },
    { icon: 'building', label: 'Department', link: '/department-dashboard', visible: () => this.loginService.hasAnyRole(['admin']) },
    { icon: 'calendar-minus', label: 'Leave', link: '/leave', visible: () => this.loginService.hasAnyRole(['employee'])},
    { icon: 'calendar-check', label: 'Attendance', link: '/attendance', visible: () => this.loginService.hasAnyRole(['employee']) },
    { icon: 'calendar-alt', label: 'Calendar', link: '/calendar', visible: () => this.loginService.hasAnyRole(['admin', 'employee']) },
    // { icon: 'user-plus', label: 'Register', link: '/register', visible: () => this.loginService.hasAnyRole(['admin']) },
    { icon: 'sign-out-alt', label: 'Logout', action: () => this.logout(), visible: () => true }
  ];

  public get visibleNavItems(): NavItem[] {
    return this.navItems.filter(i => !i.visible || i.visible());
  }

  private logout(): void {
    this.loginService.logout().subscribe();
    this.router.navigate(['/login']).then(() => {
      this.cd.markForCheck();
    });
  }
}