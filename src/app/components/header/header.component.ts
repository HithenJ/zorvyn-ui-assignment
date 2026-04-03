import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { UserRole } from '../../models/transaction.model';
import { ThemeService } from '../../services/theme.service';
import { FinanceService } from '../../services/finance.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() currentRole: UserRole = 'viewer';
  @Output() roleChange = new EventEmitter<UserRole>();
  @Output() menuToggle = new EventEmitter<void>();

  isMobileMenuOpen = false;
  searchTerm: string = '';
  lastSyncTime: string = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Suggestion Engine
  allSuggestions: string[] = [];
  filteredSuggestions: string[] = [];
  isSuggestionsOpen = false;
  private subscriptions: Subscription[] = [];

  constructor(
    public themeService: ThemeService,
    private financeService: FinanceService
  ) {}

  ngOnInit(): void {
    const suggestSub = this.financeService.getSearchSuggestions().subscribe(s => {
      this.allSuggestions = s;
    });
    this.subscriptions.push(suggestSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  onRoleChange(newRole: UserRole): void {
    this.roleChange.emit(newRole);
  }

  onSearchChange(): void {
    // Show suggestions if typing
    if (this.searchTerm && this.searchTerm.length > 0) {
      const lowerSearch = this.searchTerm.toLowerCase();
      this.filteredSuggestions = this.allSuggestions
        .filter(s => s.toLowerCase().includes(lowerSearch))
        .slice(0, 5); // Limit to top 5 suggestions
      this.isSuggestionsOpen = this.filteredSuggestions.length > 0;
    } else {
      this.isSuggestionsOpen = false;
    }

    this.financeService.updateFilters({ search: this.searchTerm });
  }

  selectSuggestion(suggestion: string): void {
    this.searchTerm = suggestion;
    this.isSuggestionsOpen = false;
    this.financeService.updateFilters({ search: this.searchTerm });
    
    // Smooth jump to the ledger to see the results
    this.scrollToLedger();
  }

  private scrollToLedger(): void {
    const ledger = document.getElementById('ledger');
    if (ledger) {
      ledger.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  hideSuggestionsWithDelay(): void {
    // Delay to allow (click) on suggestion to fire before it's hidden
    setTimeout(() => {
      this.isSuggestionsOpen = false;
    }, 250);
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }
}
