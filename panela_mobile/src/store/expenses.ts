import { create } from 'zustand';
import { api } from '../services/api';

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  date: string;
  payerId: string;
  payerName?: string;
  splits: Split[];
}

export interface Split {
  id: string;
  expenseId: string;
  memberId: string;
  memberName?: string;
  shareValue: number;
  mode: 'Equal' | 'Percentage' | 'FixedAmount';
}

interface ExpensesState {
  expenses: Expense[];
  currentExpense: Expense | null;
  isLoading: boolean;
  
  fetchExpenses: (groupId: string) => Promise<void>;
  createExpense: (expense: Omit<Expense, 'id' | 'date'>) => Promise<void>;
  getExpense: (id: string) => Promise<Expense>;
  setCurrentExpense: (expense: Expense | null) => void;
}

export const useExpensesStore = create<ExpensesState>((set) => ({
  expenses: [],
  currentExpense: null,
  isLoading: false,
  
  fetchExpenses: async (groupId: string) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/expenses/group/${groupId}`);
      set({ expenses: response.data });
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  createExpense: async (expense: Omit<Expense, 'id' | 'date'>) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/expenses', expense);
      const newExpense = response.data;
      set((state) => ({ expenses: [...state.expenses, newExpense] }));
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  getExpense: async (id: string) => {
    try {
      const response = await api.get(`/expenses/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting expense:', error);
      throw error;
    }
  },
  
  setCurrentExpense: (expense: Expense | null) => {
    set({ currentExpense: expense });
  },
}));