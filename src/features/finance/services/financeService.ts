import { supabase } from '@/shared/lib/supabase';
import { Transaction, FinanceSummary } from '../types/finance.types';

export const financeService = {
    async getLatestTRM() {
        const { data, error } = await supabase
            .from('trm_historica')
            .select('tasa')
            .order('fecha', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.warn('Could not fetch TRM from DB, using fallback');
            return 4000; // Fallback value
        }
        return data.tasa;
    },

    async getTransactions() {
        const { data, error } = await supabase
            .from('gastos')
            .select('*')
            .order('fecha_emision', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getFinanceSummary(): Promise<FinanceSummary> {
        try {
            const [salesResponse, expensesResponse] = await Promise.all([
                supabase.from('ventas').select('valor_venta_neto'),
                supabase.from('gastos').select('valor_neto')
            ]);

            if (salesResponse.error) throw salesResponse.error;
            if (expensesResponse.error) throw expensesResponse.error;

            const totalIncome = (salesResponse.data || []).reduce((acc, curr) => acc + (Number(curr.valor_venta_neto) || 0), 0);
            const totalExpense = (expensesResponse.data || []).reduce((acc, curr) => acc + (Number(curr.valor_neto) || 0), 0);

            return {
                total_income_usd: totalIncome,
                total_expense_usd: totalExpense,
                net_cash_flow_usd: totalIncome - totalExpense,
                projected_income_30d: totalIncome * 0.1, // Estimación simple para MVP
                projected_expense_30d: totalExpense * 0.05 // Estimación simple para MVP
            };
        } catch (error) {
            console.error('Error fetching finance summary:', error);
            return {
                total_income_usd: 0,
                total_expense_usd: 0,
                net_cash_flow_usd: 0,
                projected_income_30d: 0,
                projected_expense_30d: 0
            };
        }
    }
};
