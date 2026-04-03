import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, combineLatest } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Transaction, FinancialSummary, SpendingInsight, UserRole, Timeframe } from '../models/transaction.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  private lastFilteredTransactions: Transaction[] = []; // Track filtered state for context-aware exports
  private currentRoleSubject = new BehaviorSubject<UserRole>('viewer');
  private timeframeSubject = new BehaviorSubject<Timeframe>('monthly');
  private filtersSubject = new BehaviorSubject<{
    category: string;
    type: string;
    search: string;
    dateRange: { start: Date | string | null; end: Date | string | null } | null;
  }>({
    category: '',
    type: '',
    search: '',
    dateRange: null
  });

  private summarySubject = new BehaviorSubject<FinancialSummary>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    monthlyChange: 5.2,
    healthScore: 78
  });

  private insightsSubject = new BehaviorSubject<SpendingInsight[]>([]);

  constructor(private apiService: ApiService) {
    this.loadInitialData();
  }

  // Public methods
  getTransactions(): Observable<Transaction[]> {
    return this.transactionsSubject.asObservable();
  }

  getCurrentRole(): Observable<UserRole> {
    return this.currentRoleSubject.asObservable();
  }

  getTimeframe(): Observable<Timeframe> {
    return this.timeframeSubject.asObservable();
  }

  setTimeframe(timeframe: Timeframe): void {
    this.timeframeSubject.next(timeframe);
  }

  getFilters(): Observable<any> {
    return this.filtersSubject.asObservable();
  }

  getSummary(): Observable<FinancialSummary> {
    return this.summarySubject.asObservable();
  }

  getInsights(): Observable<SpendingInsight[]> {
    return this.insightsSubject.asObservable();
  }

  getFilteredTransactions(): Observable<Transaction[]> {
    return combineLatest([
      this.transactionsSubject,
      this.filtersSubject,
      this.timeframeSubject
    ]).pipe(
      map(([transactions, filters, timeframe]) => {
        let filtered = transactions;

        // Smart Timeframe Logic: Determine the dynamic anchor (latest available data or today)
        const latestTxDate = transactions.length > 0 
          ? new Date(Math.max(...transactions.map(t => new Date(t.date).getTime())))
          : new Date();
        const anchorDate = new Date(Math.max(latestTxDate.getTime(), new Date().getTime()));
        
        // 1. Primary Filter: Custom Date Range / Timeframe (Bypassed if searching globally)
        if (!filters.search) {
          if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
            const start = new Date(filters.dateRange.start as string | Date);
            start.setHours(0, 0, 0, 0); 
            const end = new Date(filters.dateRange.end as string | Date);
            end.setHours(23, 59, 59, 999);
            
            filtered = filtered.filter(t => {
              const d = new Date(t.date);
              return d >= start && d <= end;
            });
          } 
          else if (timeframe === 'weekly') {
            const weekAgo = new Date(anchorDate);
            weekAgo.setDate(weekAgo.getDate() - 7);
            filtered = filtered.filter(t => new Date(t.date) >= weekAgo);
          } else if (timeframe === 'monthly') {
            const monthAgo = new Date(anchorDate);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            filtered = filtered.filter(t => new Date(t.date) >= monthAgo);
          }
        }

        if (filters.category && filters.category !== '' && filters.category !== 'All') {
          filtered = filtered.filter(t => t.category === filters.category);
        }

        if (filters.type && filters.type !== '' && filters.type !== 'all') {
          filtered = filtered.filter(t => t.type === filters.type);
        }

        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter(t => 
            t.description.toLowerCase().includes(searchLower) ||
            t.category.toLowerCase().includes(searchLower)
          );
        }

        this.lastFilteredTransactions = filtered; // Update the export state
        
        // Trigger summary and insights update based on this specific filtered set
        this.updateSummaryAndInsights(filtered);

        return filtered;
      })
    );
  }

  setRole(role: UserRole): void {
    this.currentRoleSubject.next(role);
  }

  updateFilters(filters: any): void {
    this.filtersSubject.next({ ...this.filtersSubject.value, ...filters });
  }

  // CRUD operations using real API
  addTransaction(transaction: Omit<Transaction, 'id'>): Observable<Transaction> {
    return this.apiService.addTransaction(transaction).pipe(
      tap(newTransaction => {
        const currentTransactions = this.transactionsSubject.value;
        this.transactionsSubject.next([...currentTransactions, newTransaction]);
      }),
      catchError(error => {
        console.error('Error adding transaction:', error);
        throw error;
      })
    );
  }

  updateTransaction(id: string, updates: Partial<Transaction>): Observable<Transaction> {
    return this.apiService.updateTransaction(id, updates).pipe(
      tap(updatedTransaction => {
        const currentTransactions = this.transactionsSubject.value;
        const updatedTransactions = currentTransactions.map(t => 
          t.id === id ? updatedTransaction : t
        );
        this.transactionsSubject.next(updatedTransactions);
      }),
      catchError(error => {
        console.error('Error updating transaction:', error);
        throw error;
      })
    );
  }

  deleteTransaction(id: string): Observable<void> {
    return this.apiService.deleteTransaction(id).pipe(
      tap(() => {
        const currentTransactions = this.transactionsSubject.value;
        const filteredTransactions = currentTransactions.filter(t => t.id !== id);
        this.transactionsSubject.next(filteredTransactions);
      }),
      catchError(error => {
        console.error('Error deleting transaction:', error);
        throw error;
      })
    );
  }

  exportToCSV(): void {
    const transactions = this.lastFilteredTransactions;
    if (transactions.length === 0) {
      alert('No records found in the current audit selection to export.');
      return;
    }

    const headers = ['Date', 'Description', 'Amount', 'Category', 'Type'];
    const csvRows = [
      headers.join(','),
      ...transactions.map(t => [
        t.date,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount,
        t.category,
        t.type
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Private methods
  private loadInitialData(): void {
    this.apiService.getTransactions().subscribe({
      next: (transactions) => {
        this.transactionsSubject.next(transactions);
        
        // Auto-detect dynamic initial date range if dataset exists
        if (transactions.length > 0) {
          const latestDate = new Date(Math.max(...transactions.map(t => new Date(t.date).getTime())));
          const startDate = new Date(latestDate);
          startDate.setMonth(startDate.getMonth() - 1); // Default to latest month
          startDate.setDate(1); // Start of month

          this.updateFilters({
            dateRange: { 
              start: startDate, 
              end: latestDate 
            }
          });
        }
      },
      error: (error) => {
        console.error('Failed to load initial data:', error);
        this.transactionsSubject.next([]);
      }
    });
  }

  private updateSummaryAndInsights(filteredTxs: Transaction[]): void {
    // Calculate summary from filtered transactions
    const income = filteredTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;
    
    const savingsRatio = income > 0 ? (balance / income) : 0;
    const healthScore = Math.min(Math.max(Math.round(savingsRatio * 100 + 15), 0), 100);

    this.summarySubject.next({
      totalBalance: balance,
      totalIncome: income,
      totalExpenses: expenses,
      monthlyChange: 5.2, // Mock change
      healthScore
    });

    // Calculate insights from filtered expenses
    const expenseTransactions = filteredTxs.filter(t => t.type === 'expense');
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const categoryMap = expenseTransactions.reduce((acc, t: any) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const insights: SpendingInsight[] = Object.keys(categoryMap).map(category => ({
      category,
      amount: categoryMap[category],
      percentage: totalExpenses > 0 ? (categoryMap[category] / totalExpenses) * 100 : 0,
      trend: 'stable' as const
    })).sort((a, b) => b.amount - a.amount);

    this.insightsSubject.next(insights);
  }

  getSearchSuggestions(): Observable<string[]> {
    return this.transactionsSubject.pipe(
      map(transactions => {
        const categories = transactions.map(t => t.category);
        const descriptions = transactions.map(t => t.description);
        
        // Clean descriptions: length > 3 and not just numbers
        const cleanDescriptions = descriptions.filter(d => d && d.length > 3 && !/^\d+$/.test(d));
        
        // Unique set from both
        const combined = Array.from(new Set([...categories, ...cleanDescriptions]));
        return combined.sort();
      })
    );
  }
}
