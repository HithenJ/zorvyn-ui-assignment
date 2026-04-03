import { Component, Input, OnChanges, SimpleChanges, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { Transaction } from '../../models/transaction.model';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-balance-chart',
  templateUrl: './balance-chart.component.html',
  styleUrls: ['./balance-chart.component.css'],
  standalone: true,
  imports: [CommonModule, BaseChartDirective]
})
export class BalanceChartComponent implements OnChanges {
  @Input() transactions: Transaction[] = [];
  @Input() timeframe: 'weekly' | 'monthly' | 'all' = 'monthly';
  @Input() height: number = 300;

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  public lineChartData: ChartConfiguration<'line'>['data'] = {
    datasets: [
      {
        data: [],
        label: 'Balance Trend',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderColor: '#4f46e5',
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#4f46e5',
        fill: 'origin',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 2,
        pointHoverRadius: 5
      }
    ],
    labels: []
  };

  constructor(private themeService: ThemeService) {
    // Force chart re-render when theme changes so options (colors/grid) are re-evaluated
    effect(() => {
      this.themeService.isDarkMode();
      if (this.chart) {
        this.chart.update();
      }
    });
  }

  public get lineChartOptions(): ChartOptions<'line'> {
    const isDark = this.themeService.isDarkMode();
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.5)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: gridColor },
          border: { display: false },
          ticks: { 
            color: textColor,
            font: { size: 10, weight: 'bold' },
            callback: (value) => '₹' + Number(value).toLocaleString()
          }
        },
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { 
            color: textColor,
            font: { size: 10, weight: 'bold' },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: isDark ? '#fff' : '#0f172a',
          bodyColor: isDark ? '#fff' : '#0f172a',
          borderColor: '#4f46e5',
          borderWidth: 2,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: (context) => `Balance: ₹${context.parsed.y?.toLocaleString() ?? 0}`
          }
        }
      }
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactions'] || changes['timeframe']) {
      this.updateChartData();
    }
  }

  private updateChartData(): void {
    if (!this.transactions.length) {
      this.lineChartData.labels = [];
      this.lineChartData.datasets[0].data = [];
      if (this.chart) this.chart.update();
      return;
    }

    // 1. Group by day and calculate daily net change
    const dailyChanges: Map<string, number> = new Map();
    
    // Sort all transactions to calculate a true running balance
    const allSorted = [...this.transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    allSorted.forEach(tx => {
      const dateStr = new Date(tx.date).toISOString().split('T')[0];
      const change = tx.type === 'income' ? tx.amount : -tx.amount;
      dailyChanges.set(dateStr, (dailyChanges.get(dateStr) || 0) + change);
    });

    // 2. Determine unique sorted dates
    const uniqueDates = Array.from(dailyChanges.keys()).sort();
    
    // 3. Calculate running balance for each unique date
    let runningBalance = 0;
    const labels: string[] = [];
    const data: number[] = [];

    uniqueDates.forEach(date => {
      runningBalance += dailyChanges.get(date) || 0;
      const d = new Date(date);
      labels.push(d.toLocaleDateString([], { month: 'short', day: 'numeric' }));
      data.push(runningBalance);
    });

    this.lineChartData.labels = labels;
    this.lineChartData.datasets[0].data = data;

    if (this.chart) {
      this.chart.update();
    }
  }
}
