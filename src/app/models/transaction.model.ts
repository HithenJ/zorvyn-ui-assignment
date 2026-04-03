export interface Transaction {
  id: string;
  date: string | Date;
  amount: number;
  category: string;
  description: string;
  type: 'income' | 'expense';
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  monthlyChange: number;
  healthScore: number;
}

export interface SpendingInsight {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export type UserRole = 'viewer' | 'admin';
export type Timeframe = 'weekly' | 'monthly' | 'all';

export interface AppState {
  transactions: Transaction[];
  summary: FinancialSummary;
  insights: SpendingInsight[];
  currentRole: UserRole;
  filters: {
    category: string;
    type: string;
    search: string;
    dateRange: {
      start: Date;
      end: Date;
    };
  };
}
