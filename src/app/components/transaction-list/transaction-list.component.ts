import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Transaction, UserRole } from '../../models/transaction.model';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    CurrencyPipe, 
    DatePipe
  ],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.css']
})
export class TransactionListComponent implements OnInit {
  @Input() displayTransactions: Transaction[] = [];
  @Input() currentRole: UserRole = 'viewer';
  @Input() loading = false;

  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Transaction>();
  @Output() delete = new EventEmitter<string>();
  @Output() search = new EventEmitter<string>();
  @Output() categoryChange = new EventEmitter<string>();
  @Output() typeChange = new EventEmitter<'all' | 'income' | 'expense'>();
  @Output() export = new EventEmitter<void>();
  @Output() dateRangeChange = new EventEmitter<{start: string, end: string}>();

  @Input() searchTerm: string = '';
  selectedCategory: string = 'All Categories';
  selectedType: 'all' | 'income' | 'expense' = 'all';
  sortBy: 'date' | 'amount' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  @Input() startDate: string = '';
  @Input() endDate: string = '';
  @Input() dateRangeLabel: string = 'Digital Ledger';

  isCategoryDropdownOpen = false;

  categories: string[] = ['All Categories', 'Food', 'Salary', 'Rent', 'Utilities', 'Shopping', 'Transport', 'Healthcare', 'Entertainment', 'Other'];

  ngOnInit(): void {}

  onSearchChange(): void {
    this.search.emit(this.searchTerm);
  }

  onCategorySelect(category: string): void {
    this.selectedCategory = category;
    this.categoryChange.emit(category);
    this.isCategoryDropdownOpen = false;
  }

  onTypeToggle(type: 'all' | 'income' | 'expense'): void {
    this.selectedType = type;
    this.typeChange.emit(type);
  }

  onDateChange(): void {
    if (this.startDate && this.endDate) {
      this.dateRangeChange.emit({ start: this.startDate, end: this.endDate });
    }
  }

  toggleSort(field: 'date' | 'amount'): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'desc';
    }
  }

  get groupedTransactions(): { date: string, items: Transaction[] }[] {
    const sorted = [...this.displayTransactions].sort((a, b) => {
      const fieldA = this.sortBy === 'date' ? new Date(a.date).getTime() : a.amount;
      const fieldB = this.sortBy === 'date' ? new Date(b.date).getTime() : b.amount;
      return this.sortOrder === 'desc' ? fieldB - fieldA : fieldA - fieldB;
    });

    const groups: { date: string, items: Transaction[] }[] = [];
    const map = new Map<string, Transaction[]>();

    sorted.forEach(t => {
      const dateStr = new Date(t.date).toLocaleDateString('en-IN', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      
      if (!map.has(dateStr)) {
        const newGroup = { date: dateStr, items: [] };
        groups.push(newGroup);
        map.set(dateStr, newGroup.items);
      }
      map.get(dateStr)!.push(t);
    });

    return groups;
  }

  isToday(dateStr: string): boolean {
    const today = new Date().toLocaleDateString('en-IN', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    return dateStr === today;
  }
}
