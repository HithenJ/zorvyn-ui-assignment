import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRole } from '../../models/transaction.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() currentRole: UserRole = 'viewer';
  @Output() roleChange = new EventEmitter<UserRole>();

  navItems = [
    { id: 'dashboard', label: 'Overview', icon: 'bi-grid-fill', active: true },
    { id: 'insights', label: 'Analytics Hub', icon: 'bi-bar-chart-fill', active: false },
    { id: 'ledger', label: 'Audit Ledger', icon: 'bi-list-ul', active: false }
  ];

  setRole(role: UserRole): void {
    this.roleChange.emit(role);
  }

  setActive(item: any): void {
    this.navItems.forEach(i => i.active = false);
    item.active = true;
    
    // Smooth scroll to the corresponding section ID
    const element = document.getElementById(item.id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
