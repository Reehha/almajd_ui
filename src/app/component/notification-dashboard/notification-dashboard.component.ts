import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { Router } from '@angular/router';
import { NotificationsApiResponse, NotificationReceivedItem, NotificationSentItem } from '../../models/types';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type DashboardNotification =
  | (NotificationReceivedItem & { type: 'received' })
  | (NotificationSentItem & { type: 'sent' });

@Component({
  selector: 'app-notification-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './notification-dashboard.component.html',
  styleUrls: ['./notification-dashboard.component.css']
})
export class NotificationDashboardComponent implements OnInit {
  activeTab: 'all' | 'read' | 'unread' | 'sent' = 'all';
  searchQuery: string = '';
  isAdmin: boolean = false;
  notifications: DashboardNotification[] = [];
  expandedId: string | null = null;
  loading = false;
  employeeId: string | null = null;
  keepInUnread: string[] = [];


  filters = {
    type: '',
    organization: '',
    department: '',
    designation: ''
  };

  dropdowns = {
    types: [] as string[],
    organizations: [] as string[],
    departments: [] as string[],
    designations: [] as string[]
  };

  pageSize: number = 10;
  currentPage: number = 1;

  constructor(private notificationService: NotificationService, private router: Router) {}

  ngOnInit(): void {
    const roles = (localStorage.getItem('roles') || '').toLowerCase();
    this.isAdmin = roles.includes('admin');

    this.employeeId = localStorage.getItem('employeeId');
    this.fetchNotifications();
  }

  goToCreateNotification() {
    this.router.navigate(['/create-notification']);
  }

  fetchNotifications(): void {
    this.loading = true;
    this.notificationService.getNotifications().subscribe({
      next: (res: NotificationsApiResponse) => {
        const received = (res.data.notificationReceived || []).map(
          n => ({ ...n, type: 'received' as const })
        );
        const sent = (res.data.notificationSent || []).map(
          n => ({ ...n, type: 'sent' as const })
        );

        this.notifications = [...received, ...sent];

        // Populate dropdowns dynamically
        this.populateDropdowns();

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private populateDropdowns(): void {
    const types = new Set<string>();
    const orgs = new Set<string>();
    const depts = new Set<string>();
    const desigs = new Set<string>();
  
    this.notifications.forEach(n => {
      if (n.type) types.add(n.type);
  
      if (this.isSent(n) && Array.isArray(n.recipients)) {
        n.recipients.forEach(r => {
          if (r.organization) orgs.add(r.organization);
          if (r.department) depts.add(r.department);
          if (r.designation) desigs.add(r.designation);
        });
      }
    });
  
    this.dropdowns.types = Array.from(types);
    this.dropdowns.organizations = Array.from(orgs);
    this.dropdowns.departments = Array.from(depts);
    this.dropdowns.designations = Array.from(desigs);
  }  

  setTab(tab: 'all' | 'read' | 'unread' | 'sent') {
    if (this.activeTab === 'unread' && tab !== 'unread') {
      this.keepInUnread = []; // remove all temporarily kept notifications
    }
  
    this.activeTab = tab;
    this.currentPage = 1;
    this.expandedId = null;
  }  

  normalizeRead(val: boolean | string | undefined): boolean {
    if (typeof val === 'string') return val.toLowerCase() === 'true';
    return !!val;
  }

  isSent(n: DashboardNotification): n is NotificationSentItem & { type: 'sent' } {
    return n.type === 'sent';
  }

  getRecipientCount(n: NotificationSentItem): number {
    return n.recipients?.length || 0;
  }

  getSourceName(n: DashboardNotification): string {
    return n.source?.name || 'Unknown';
  }

  get filteredNotifications(): DashboardNotification[] {
    let data = [...this.notifications];
  
    // Filter by tab
    if (this.activeTab === 'sent') {
      data = data.filter(n => n.type === 'sent');
    } else if (this.activeTab === 'read') {
      data = data.filter(n => n.type === 'received' && this.normalizeRead(n.read));
    } else if (this.activeTab === 'unread') {
      data = data.filter(n => 
        n.type === 'received' &&
        (!this.normalizeRead(n.read) || this.keepInUnread.includes(n.notificationId))
      );
    }
    
  
    // Filter by type (applies to both received & sent)
    if (this.filters.type) {
      const typeFilter = this.filters.type.toLowerCase();
      data = data.filter(n => n.type === 'sent' || n.type === 'received'
        ? n.type.toLowerCase() === typeFilter
        : false);
    }
  
    // Filters for sent notifications
    if (this.filters.organization) {
      data = data.filter(n => this.isSent(n)
        ? n.recipients?.some(r => r.organization === this.filters.organization)
        : true // ignore for received
      );
    }
  
    if (this.filters.department) {
      data = data.filter(n => this.isSent(n)
        ? n.recipients?.some(r => r.department === this.filters.department)
        : true
      );
    }
  
    if (this.filters.designation) {
      data = data.filter(n => this.isSent(n)
        ? n.recipients?.some(r => r.designation === this.filters.designation)
        : true
      );
    }
  
    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      data = data.filter(
        n => n.title.toLowerCase().includes(query) || n.message.toLowerCase().includes(query)
      );
    }
  
    return data;
  }  

  onExpandNotification(notification: DashboardNotification) {
    this.expandedId = this.expandedId === notification.notificationId ? null : notification.notificationId;
  
    if (!this.employeeId || this.isSent(notification)) return;
  
    if (!this.normalizeRead(notification.read)) {
      this.notificationService.markAsRead(notification.notificationId, this.employeeId).subscribe({
        next: () => {
          notification.read = true;
  
          if (this.activeTab === 'unread') {
            if (!this.keepInUnread.includes(notification.notificationId)) {
              this.keepInUnread.push(notification.notificationId);
  
              // Remove after delay
              setTimeout(() => {
                this.keepInUnread = this.keepInUnread.filter(id => id !== notification.notificationId);
              }, 6000); // 6 seconds
            }
          }
        },
        error: (err) => console.error('Failed to mark as read', err)
      });
    }
  }  
  

  onDeleteNotification(notification: DashboardNotification, event: Event) {
    event.stopPropagation();
    if (!this.employeeId || this.isSent(notification)) return;

    if (confirm("Are you sure you want to delete this notification?")) {
      this.notificationService.deleteNotification(notification.notificationId, this.employeeId).subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => n.notificationId !== notification.notificationId);
          this.populateDropdowns();
        },
        error: (err) => console.error('Failed to delete notification', err)
      });
    }
  }

  refreshNotifications(): void {
    this.fetchNotifications();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredNotifications.length / this.pageSize);
  }

  get paginatedNotifications(): DashboardNotification[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredNotifications.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1) page = 1;
    if (page > this.totalPages) page = this.totalPages;
    this.currentPage = page;
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2;
    const range: number[] = [];

    const left = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);

    range.push(1);

    if (left > 2) range.push(-1);

    for (let i = left; i <= right; i++) range.push(i);

    if (right < total - 1) range.push(-1);
    if (total > 1) range.push(total);

    return range;
  }

  formatMessage(message: string): string {
    if (!message) return '';

    const lines = message.split('\n');
    let formatted = '';
    let inList = false;

    for (const line of lines) {
      if (line.startsWith('*')) {
        if (!inList) {
          formatted += '<ul class="notification-bullets">';
          inList = true;
        }
        formatted += `<li>${line.slice(1).trim()}</li>`;
      } else {
        if (inList) {
          formatted += '</ul>';
          inList = false;
        }
        formatted += `<p class="notification-paragraph">${line}</p>`;
      }
    }

    if (inList) formatted += '</ul>';
    return formatted;
  }
  onFilterChange() {
    this.currentPage = 1; // reset pagination when filters change
  }
  
}
