import { Component, Input, OnChanges, SimpleChanges, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, Chart } from 'chart.js';
import { SpendingInsight } from '../../models/transaction.model';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-spending-chart',
  templateUrl: './spending-chart.component.html',
  styleUrls: ['./spending-chart.component.css'],
  standalone: true,
  imports: [CommonModule, BaseChartDirective]
})
export class SpendingChartComponent implements OnChanges {
  @Input() insights: SpendingInsight[] = [];
  @Input() size: number = 300;
  
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  private readonly colorMap: Record<string, string> = {
    'Food': '#e11d48',        // Deep Rose (Critical Spend)
    'Salary': '#059669',      // Deep Emerald (Net Positive)
    'Rent': '#4f46e5',        // Deep Indigo (Primary Overhead)
    'Utilities': '#d97706',   // Deep Amber (Fixed Cost)
    'Shopping': '#db2777',    // Deep Pink (Lifestyle)
    'Transport': '#7c3aed',   // Deep Violet (Travel)
    'Healthcare': '#0d9488',  // Deep Teal (Vitals)
    'Entertainment': '#ea580c',// Deep Orange (Discretionary)
    'Other': '#64748b'         // Deep Slate (Residual)
  };

  // Stable options object to avoid "hover breaking"
  public doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '82%',
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#0f172a',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 16,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        boxPadding: 6,
        usePointStyle: true,
        cornerRadius: 16,
        caretSize: 0,
        callbacks: {
          label: (context) => ` ${context.label}: ₹${Number(context.parsed).toLocaleString('en-IN')}`
        }
      }
    }
  };

  public doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      hoverOffset: 12,
      borderWidth: 0,
      borderRadius: 4
    }]
  };

  constructor(private themeService: ThemeService) {
    // Reactive theme adjustment using Angular Signals effect
    effect(() => {
      const isDark = this.themeService.isDarkMode();
      this.updateThemeSettings(isDark);
    });
  }

  private updateThemeSettings(isDark: boolean): void {
    if (this.doughnutChartOptions.plugins?.tooltip) {
      const tooltip = this.doughnutChartOptions.plugins.tooltip;
      tooltip.backgroundColor = isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)';
      tooltip.titleColor = isDark ? '#ffffff' : '#0f172a';
      tooltip.bodyColor = isDark ? '#94a3b8' : '#475569';
      tooltip.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    }

    if (this.chart) {
      this.updateChartData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['insights']) {
      this.updateChartData();
    }
  }

  private updateChartData(): void {
    if (!this.insights || this.insights.length === 0) {
      this.doughnutChartData.labels = [];
      this.doughnutChartData.datasets[0].data = [];
      this.doughnutChartData.datasets[0].backgroundColor = [];
      if (this.chart) this.chart.update();
      return;
    }

    const labels = this.insights.map(i => i.category);
    const data = this.insights.map(i => i.amount);
    const colors = this.insights.map(i => this.getCategoryColor(i.category));

    this.doughnutChartData.labels = labels;
    this.doughnutChartData.datasets[0].data = data;
    this.doughnutChartData.datasets[0].backgroundColor = colors;

    if (this.chart) {
      this.chart.update();
    }
  }

  public getCategoryColor(category: string): string {
    return this.colorMap[category] || this.colorMap['Other'];
  }

  get totalSpending(): number {
    return this.insights.reduce((sum, item) => sum + item.amount, 0);
  }
}
