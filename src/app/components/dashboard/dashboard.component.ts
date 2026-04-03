import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';

import { FinanceService } from '../../services/finance.service';
import { UserRole, FinancialSummary, Transaction, SpendingInsight, Timeframe } from '../../models/transaction.model';

import { SummaryCardComponent } from '../summary-card/summary-card.component';
import { TransactionListComponent } from '../transaction-list/transaction-list.component';
import { BalanceChartComponent } from '../balance-chart/balance-chart.component';
import { SpendingChartComponent } from '../spending-chart/spending-chart.component';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    SummaryCardComponent,
    TransactionListComponent,
    BalanceChartComponent,
    SpendingChartComponent,
    TransactionFormComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @Input() currentRole: UserRole = 'viewer';
  
  summary: FinancialSummary = {
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    monthlyChange: 5.7,
    healthScore: 65
  };
  
  Math = Math;
  allTransactions: Transaction[] = [];
  displayTransactions: Transaction[] = [];
  insights: SpendingInsight[] = [];
  currentTimeframe: Timeframe = 'monthly';
  timeframeOptions: Timeframe[] = ['weekly', 'monthly', 'all'];
  startDateStr: string = '';
  endDateStr: string = '';
  loading = true;
  isModalOpen = false;
  currentSearchTerm: string = '';
  selectedTransaction?: Transaction;

  private subscriptions: Subscription[] = [];

  constructor(
    private financeService: FinanceService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initializeDashboardData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private initializeDashboardData(): void {
    this.loading = true;
    
    // Subscribe to timeframe changes
    const tfSub = this.financeService.getTimeframe().subscribe(tf => {
      this.currentTimeframe = tf;
    });
    this.subscriptions.push(tfSub);

    // Subscribe to all transactions for historical benchmarking
    const tsSub = this.financeService.getTransactions().subscribe(txs => {
      this.allTransactions = txs;
    });
    this.subscriptions.push(tsSub);
    
    // Subscribe to filtered transactions for the active ledger view
    const ftsSub = this.financeService.getFilteredTransactions().subscribe(ftxs => {
      this.displayTransactions = ftxs;
    });
    this.subscriptions.push(ftsSub);

    // Subscribe to summary
    const sumSub = this.financeService.getSummary().subscribe(sum => {
      this.summary = sum;
    });
    this.subscriptions.push(sumSub);

    // Subscribe to insights
    const insSub = this.financeService.getInsights().subscribe(ins => {
      this.insights = ins;
    });
    this.subscriptions.push(insSub);

    // Subscribe to filters for UI state (e.g. date inputs + search banner)
    const filterSub = this.financeService.getFilters().subscribe(filters => {
      this.currentSearchTerm = filters.search;
      if (filters.dateRange) {
        this.startDateStr = this.formatDateForInput(filters.dateRange.start);
        this.endDateStr = this.formatDateForInput(filters.dateRange.end);
      }
    });
    this.subscriptions.push(filterSub);

    // Initial timeout to hide loading spinner
    setTimeout(() => {
      this.loading = false;
    }, 800);
  }

  onTimeframeChange(tf: Timeframe): void {
    this.financeService.setTimeframe(tf);
    // When a relative timeframe (Weekly/Monthly) is chosen, clear the manual date range filter
    // If 'all' is chosen, we preserve the range to allow custom drilling
    if (tf !== 'all') {
      this.financeService.updateFilters({ dateRange: null });
    }
  }

  // Dashboard Interaction Handlers
  handleCardClick(type: 'all' | 'income' | 'expense'): void {
    this.financeService.updateFilters({ type });
    const ledgerElement = document.getElementById('ledger');
    if (ledgerElement) {
      ledgerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onAddTransaction(): void {
    this.selectedTransaction = undefined;
    this.isModalOpen = true;
  }

  onEditTransaction(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.isModalOpen = true;
  }

  onDeleteTransaction(id: string): void {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.financeService.deleteTransaction(id).subscribe(() => {
        this.notificationService.success('Audit record successfully purged.');
      });
    }
  }

  onSearch(term: string): void {
    this.financeService.updateFilters({ search: term });
  }

  onCategoryFilter(category: string): void {
    const value = category === 'All Categories' ? '' : category;
    this.financeService.updateFilters({ category: value });
  }

  onTypeFilter(type: string): void {
    const value = type === 'all' ? '' : type;
    this.financeService.updateFilters({ type: value });
  }

  onDateRangeFilter(range: {start: string, end: string}): void {
    const startDate = new Date(range.start);
    const endDate = new Date(range.end);
    
    // Update filters first
    this.financeService.updateFilters({ 
      dateRange: { start: startDate, end: endDate } 
    });

    // Switch to 'all' timeframe so the custom range takes effect in the service logic
    this.onTimeframeChange('all');
  }

  onExport(): void {
    this.financeService.exportToCSV();
  }

  get totalDateRange(): string {
    if (!this.allTransactions.length) return 'Digital Ledger';
    
    const dates = this.allTransactions.map(t => new Date(t.date).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
    const minStr = minDate.toLocaleDateString('en-US', options);
    const maxStr = maxDate.toLocaleDateString('en-US', options);
    
    return minStr === maxStr ? minStr : `${minStr} – ${maxStr}`;
  }


  handleSaveTransaction(transactionData: Omit<Transaction, 'id'>): void {
    if (this.selectedTransaction) {
      this.financeService.updateTransaction(this.selectedTransaction.id, transactionData).subscribe(() => {
        this.notificationService.success('Audit record successfully updated.');
      });
    } else {
      this.financeService.addTransaction(transactionData).subscribe(() => {
        this.notificationService.success('New transaction committed to ledger.');
      });
    }
    this.isModalOpen = false;
  }

  private formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();
    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }
}


