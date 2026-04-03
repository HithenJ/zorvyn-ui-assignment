import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-card.component.html',
  styleUrls: ['./summary-card.component.css']
})
export class SummaryCardComponent {
  @Input() title: string = '';
  @Input() amount: number = 0;
  @Input() change: number = 0;
  @Input() type: 'income' | 'expense' | 'balance' | 'neutral' | 'success' | 'danger' = 'balance';
  @Input() icon: string = '';
  @Output() cardClick = new EventEmitter<void>();

  get formattedAmount(): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(this.amount);
  }

  get formattedChange(): string {
    const prefix = this.change >= 0 ? '+' : '';
    return `${prefix}${Math.abs(this.change)}%`;
  }

  get changeColor(): string {
    if (this.type === 'expense' || this.type === 'danger') {
      return this.change > 0 ? 'text-rose-500' : 'text-emerald-500';
    }
    return this.change >= 0 ? 'text-emerald-500' : 'text-rose-500';
  }

  get cardColor(): string {
    switch (this.type) {
      case 'success':
      case 'income':
        return 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-100/50 dark:border-emerald-500/20';
      case 'danger':
      case 'expense':
        return 'bg-rose-50/50 dark:bg-rose-500/10 border-rose-100/50 dark:border-rose-500/20';
      case 'neutral':
        return 'bg-rose-50/50 dark:bg-rose-500/10 border-rose-100/50 dark:border-rose-500/20';
      default:
        return 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-white/5';
    }
  }

  get iconClassName(): string {
    switch (this.type) {
      case 'success':
      case 'income':
        return 'bi-graph-up-arrow';
      case 'danger':
      case 'expense':
        return 'bi-graph-down-arrow';
      case 'neutral':
        return 'bi-wallet2';
      default:
        return 'bi-wallet2';
    }
  }

  get iconColor(): string {
    switch (this.type) {
      case 'success':
      case 'income':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'danger':
      case 'expense':
        return 'text-rose-600 dark:text-rose-400';
      case 'neutral':
        return 'text-rose-600 dark:text-rose-400';
      default:
        return 'text-rose-600 dark:text-rose-400';
    }
  }

  get hoverShadowColor(): string {
    switch (this.type) {
      case 'success':
      case 'income':
        return 'hover:shadow-emerald-500/20 dark:hover:shadow-emerald-500/10';
      case 'danger':
      case 'expense':
        return 'hover:shadow-rose-500/20 dark:hover:shadow-rose-500/10';
      case 'neutral':
        return 'hover:shadow-indigo-500/20 dark:hover:shadow-indigo-500/10';
      default:
        return 'hover:shadow-indigo-500/20 dark:hover:shadow-indigo-500/10';
    }
  }
}
