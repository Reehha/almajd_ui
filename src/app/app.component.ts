import { Component} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './component/sidebar/sidebar.component';
// import { HeaderComponent } from './header/header.component';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,SidebarComponent,CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})


export class AppComponent {
  title = 'attendance-tracker';
  showSidebar = true;
  isCenterPage = false;

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const excludedPaths = ['/login', '/scan-qr', '/reset-password','/register'];
        const currentUrl = event.urlAfterRedirects;
        this.isCenterPage = excludedPaths.some(path => currentUrl.startsWith(path));
      }
    });
  }

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showSidebar = !(this.router.url.includes('/login') || this.router.url.includes('/scan-qr'));
      }
    });
  }
}




 

