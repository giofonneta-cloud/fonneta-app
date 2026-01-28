export interface Transaction {
    id: string;
    project_id?: string;
    amount: number;
    currency: 'USD' | 'COP';
    trm: number;
    type: 'income' | 'expense';
    category: string;
    status: 'pending' | 'completed';
    date: string;
}

export interface FinanceSummary {
    total_income_usd: number;
    total_expense_usd: number;
    net_cash_flow_usd: number;
    projected_income_30d: number;
    projected_expense_30d: number;
}
