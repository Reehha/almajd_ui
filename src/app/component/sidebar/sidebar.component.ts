import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { filter } from 'rxjs/operators';

interface NavItem {
  icon: string;
  label: string;
  link?: string;
  subItems?: { label: string; link: string }[];
  action?: () => void;
  visible?: () => boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {

  isfirstTimeLogIn: boolean = false;

  constructor(
    public readonly router: Router,
    private readonly loginService: LoginService,
    private readonly cd: ChangeDetectorRef
  ) {
    const store = typeof window !== 'undefined' ? window.localStorage : null;
    this.isfirstTimeLogIn = store?.getItem('mustResetPassword') === 'true';

    this.loginService.authChanged.subscribe(() => {
      this.cd.markForCheck();
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => this.cd.markForCheck());
  }

  navItems: NavItem[] = [
    { icon: 'home', label: 'Home', link: '/admin-dashboard', visible: () => this.loginService.hasAnyRole(['admin']) },
    { icon: 'home', label: 'Home', link: '/employee-dashboard', visible: () => this.loginService.hasAnyRole(['employee']) },

    {
      icon: 'users',
      label: 'Employee',
      visible: () => this.loginService.hasAnyRole(['admin']) && !this.isfirstTimeLogIn,
      subItems: [
        { label: 'Add new employee', link: '/register' },
        { label: 'Manage employees', link: '/manage' },
        { label: 'Manage leave requests', link: '/under-construction' },
      ]
    },

    { icon: 'search', label: 'Scan QR', link: '/scan-qr', visible: () => this.loginService.hasAnyRole(['qrScanner']) && !this.isfirstTimeLogIn },
    { icon: 'building', label: 'Organization', link: '/department-dashboard', visible: () => this.loginService.hasAnyRole(['admin']) && !this.isfirstTimeLogIn,
      subItems:[
        { label: 'Manage organization', link: '/manage-org' },
        { label: 'Configure holidays', link: '/under-construction' },
      ]
     },
    { icon: 'calendar-minus', label: 'Leave', link: '/under-construction', visible: () => this.loginService.hasAnyRole(['employee']) && !this.isfirstTimeLogIn },
    { icon: 'calendar-check', label: 'Mark attendance', link: '/log-attendance', visible: () => this.loginService.hasAnyRole(['employee']) && !this.isfirstTimeLogIn },
    { icon: 'sign-out-alt', label: 'Logout', action: () => this.logout(), visible: () => true }
  ];

  public get visibleNavItems(): NavItem[] {
    return this.navItems.filter(i => !i.visible || i.visible());
  }

  navigateTo(link: string): void {
    const cleanLink = link.startsWith('/') ? link.slice(1) : link;
    this.router.navigate([cleanLink]);
  }

  private logout(): void {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (!confirmed) {
      return; // Cancel logout
    }
    this.loginService.logout().subscribe(() => {
      this.router.navigate(['/login']).then(() => this.cd.markForCheck());
    });
  }
}
