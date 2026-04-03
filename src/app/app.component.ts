import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { FinanceService } from './services/finance.service';
import { UserRole } from './models/transaction.model';

import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    SidebarComponent,
    DashboardComponent,
    ToastComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  currentRole: UserRole = 'viewer';
  private subscriptions: Subscription[] = [];

  constructor(private financeService: FinanceService) {}

  ngOnInit(): void {
    // Subscribe to global role changes
    const roleSubscription = this.financeService.getCurrentRole().subscribe(role => {
      this.currentRole = role;
    });
    this.subscriptions.push(roleSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  activeSection: string = 'dashboard';

  onRoleChange(role: UserRole): void {
    this.financeService.setRole(role);
  }

  onMobileNavClick(sectionId: string): void {
    this.activeSection = sectionId;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
