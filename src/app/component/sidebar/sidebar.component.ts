import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { filter } from 'rxjs/operators';
import { NotificationService } from '../../services/notification.service';

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
  menuOpen = false;
  unreadCount: number = 0; // Example, can be updated via API

  constructor(
    public readonly router: Router,
    private readonly loginService: LoginService,
    private readonly cd: ChangeDetectorRef,
    private readonly notificationService: NotificationService,
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

  ngOnInit(): void {
    if (this.loginService.isLoggedIn()) {
      this.fetchUnreadNotificationsCount();
    }
  }
  
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
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
        { label: 'Manage location',link: '/manage-location'},
        { label: 'Manage schedule',link: '/manage-schedule'},
        { label: 'Configure holidays', link: '/under-construction' },
      ]
     },
    { icon: 'calendar-minus', label: 'Leave', link: '/under-construction', visible: () => this.loginService.hasAnyRole(['employee']) && !this.isfirstTimeLogIn },
    { icon: 'calendar-check', label: 'Mark attendance', link: '/log-attendance', visible: () => this.loginService.hasAnyRole(['employee']) && !this.isfirstTimeLogIn },
    // { icon: 'sign-out-alt', label: 'Logout', action: () => this.logout(), visible: () => true }
  ];

  public get visibleNavItems(): NavItem[] {
    return this.navItems.filter(i => !i.visible || i.visible());
  }

  navigateTo(link: string): void {
    const cleanLink = link.startsWith('/') ? link.slice(1) : link;
    this.router.navigate([cleanLink]);
  }

  // Add at the top of the class
openSubmenus = new Set<number>();

toggleSubmenu(index: number, hasSubItems: number | undefined, item: NavItem) {
  if (hasSubItems) {
    // toggle submenu for mobile
    if (this.openSubmenus.has(index)) {
      this.openSubmenus.delete(index);
    } else {
      this.openSubmenus.clear(); // close others
      this.openSubmenus.add(index);
    }
  } else if (item.link) {
    // if no subItems, navigate directly
    this.navigateTo(item.link);
  } else if (item.action) {
    item.action();
  }
}

  public logout(): void {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (!confirmed) {
      return; // Cancel logout
    }
    this.loginService.logout().subscribe(() => {
      this.router.navigate(['/login']).then(() => this.cd.markForCheck());
    });
  }
  onSubmenuClick(link: string) {
    this.navigateTo(link);       // navigate to link
    this.menuOpen = false;       // close the mobile menu
    this.openSubmenus.clear();   // close all submenus
  }

  fetchUnreadNotificationsCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (count: number) => {
        this.unreadCount = count;
        this.cd.markForCheck(); // if using OnPush
      },
      error: (err) => {
        console.error('Failed to fetch unread notifications', err);
        this.unreadCount = 0;
        this.cd.markForCheck();
      }
    });
  }   

  get isLoggedIn(): boolean {
    return this.loginService.isLoggedIn();
  }
  
}
