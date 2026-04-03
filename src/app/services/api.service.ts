import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { delay, map, catchError, switchMap, tap } from 'rxjs/operators';
import { Transaction, FinancialSummary, SpendingInsight } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly STORAGE_KEY = 'zorvyn_finance_data_v4'; // Incremented version for unified persistence
  private readonly MOCK_API_URL = 'assets/data/transactions.json';
  private readonly API_DELAY = 400;

  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  private isInitialized = false;

  constructor(private http: HttpClient) {}

  /**
   * Unified Data Source: Remote JSON + Generated Mock -> Persistent LocalStorage
   */
  getTransactions(): Observable<Transaction[]> {
    if (this.isInitialized) {
      return of(this.getLocalTransactions()).pipe(delay(this.API_DELAY));
    }

    const localData = this.getLocalTransactions();
    if (localData.length > 0) {
      this.isInitialized = true;
      return of(localData).pipe(delay(this.API_DELAY));
    }

    // First-time Hydration: Pull from JSON and Hydrate Local Storage
    return this.http.get<Transaction[]>(this.MOCK_API_URL).pipe(
      map(remoteRecords => {
        const generatedRecords = this.generateComprehensiveMockData();
        
        // Merge Remote JSON + Generated Historical Data
        const combined = [...remoteRecords];
        const remoteIds = new Set(remoteRecords.map(r => r.id));
        
        generatedRecords.forEach(mock => {
          if (!remoteIds.has(mock.id)) {
            combined.push(mock);
          }
        });

        const sorted = combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.saveLocalTransactions(sorted);
        this.isInitialized = true;
        return sorted;
      }),
      delay(this.API_DELAY),
      catchError(err => {
        console.error('Hydration failed, using only generated data:', err);
        const generated = this.generateComprehensiveMockData();
        this.saveLocalTransactions(generated);
        this.isInitialized = true;
        return of(generated);
      })
    );
  }

  addTransaction(transaction: Omit<Transaction, 'id'>): Observable<Transaction> {
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.random().toString(36).substring(2, 9),
      date: transaction.date || new Date().toISOString()
    };

    const transactions = this.getLocalTransactions();
    transactions.unshift(newTransaction);
    this.saveLocalTransactions(transactions);

    return of(newTransaction).pipe(delay(this.API_DELAY));
  }

  updateTransaction(id: string, updates: Partial<Transaction>): Observable<Transaction> {
    const transactions = this.getLocalTransactions();
    const index = transactions.findIndex(t => t.id === id);
    
    if (index === -1) {
      return throwError(() => new Error('Transaction not found in Audit Ledger'));
    }

    const updated = { ...transactions[index], ...updates };
    transactions[index] = updated;
    this.saveLocalTransactions(transactions);

    return of(updated).pipe(delay(this.API_DELAY));
  }

  deleteTransaction(id: string): Observable<void> {
    const transactions = this.getLocalTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    this.saveLocalTransactions(filtered);
    return of(void 0).pipe(delay(this.API_DELAY));
  }

  // --- Private Helpers ---

  private generateComprehensiveMockData(): Transaction[] {
    const transactions: Transaction[] = [];
    const categories: Record<string, string[]> = {
      income: ['Salary', 'Freelance', 'Dividends', 'Gift'],
      expense: ['Food', 'Rent', 'Utilities', 'Shopping', 'Transport', 'Healthcare', 'Entertainment', 'Education']
    };

    const descriptions: Record<string, string[]> = {
      'Salary': ['Monthly Payroll', 'Zorvyn Corp Salary', 'Base Compensation'],
      'Freelance': ['UI Design Project', 'API Development', 'Logo Branding'],
      'Food': ['Whole Foods Market', 'Starbucks Coffee', 'Dinner with Friends', 'Local Bakery', 'Swiggy Delivery'],
      'Rent': ['Monthly Apartment Rent', 'Standard Maintenance Fee'],
      'Utilities': ['Electricity Bill', 'Water Services', 'High-speed Internet', 'Mobile Recharge'],
      'Shopping': ['Amazon Purchase', 'Clothing Store', 'Home Decor', 'New Tech Gadget'],
      'Transport': ['Uber Ride', 'Petrol Refill', 'Parking Charges', 'Public Transit Pass'],
      'Healthcare': ['Pharmacy Purchase', 'Dental Checkup', 'Fitness Club Membership'],
      'Entertainment': ['Netflix Subscription', 'Cinema Tickets', 'Gaming Store', 'Spotify Premium'],
      'Education': ['Online Course Fee', 'Bookstore Purchase', 'Skill Workshop']
    };

    // Keep the core 2024 historical dataset density
    for (let month = 0; month < 3; month++) {
      const year = 2024;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const entriesToGenerate = Math.floor(Math.random() * 11) + 20;

      transactions.push({
        id: `hist-${month}-sal`,
        date: new Date(year, month, 1, 9).toISOString(),
        amount: 85000 + (Math.random() * 5000),
        category: 'Salary',
        description: 'Historical Payroll',
        type: 'income'
      });

      for (let i = 0; i < entriesToGenerate; i++) {
        const day = Math.floor(Math.random() * daysInMonth) + 1;
        const type = Math.random() > 0.15 ? 'expense' : 'income';
        const categoryList = categories[type];
        const category = categoryList[Math.floor(Math.random() * categoryList.length)];
        const descriptionList = descriptions[category] || ['General Audit Entry'];
        const amount = type === 'income' ? 5000 + (Math.random() * 20000) : 200 + (Math.random() * 5000);

        transactions.push({
          id: `tx-hist-${month}-${i}`,
          date: new Date(year, month, day, Math.floor(Math.random() * 24)).toISOString(),
          amount: Math.round(amount),
          category,
          description: descriptionList[Math.floor(Math.random() * descriptionList.length)],
          type
        });
      }
    }

    return transactions;
  }

  private getLocalTransactions(): Transaction[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveLocalTransactions(transactions: Transaction[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions));
  }
}
