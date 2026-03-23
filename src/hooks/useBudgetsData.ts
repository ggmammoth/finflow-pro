import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { startOfMonth, format } from 'date-fns';
import { useTranslation } from 'react-i18next';

/* ── Savings Goals ── */

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export function useSavingsGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['savings_goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SavingsGoal[];
    },
    enabled: !!user,
  });
}

export function useCreateSavingsGoal() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (d: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('savings_goals').insert({ ...d, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['savings_goals'] }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateSavingsGoal() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...d }: Partial<SavingsGoal> & { id: string }) => {
      const { error } = await supabase.from('savings_goals').update(d).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['savings_goals'] }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteSavingsGoal() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['savings_goals'] }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

/* ── Category Budgets ── */

export interface CategoryBudget {
  id: string;
  user_id: string;
  category_id: string;
  budget_amount: number;
  month: string;
  created_at: string;
  updated_at: string;
}

export function useCategoryBudgets() {
  const { user } = useAuth();
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  return useQuery({
    queryKey: ['category_budgets', user?.id, currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category_budgets')
        .select('*, categories(name, icon, color)')
        .eq('month', currentMonth)
        .order('created_at');
      if (error) throw error;
      return data as (CategoryBudget & { categories: { name: string; icon: string | null; color: string | null } | null })[];
    },
    enabled: !!user,
  });
}

export function useUpsertCategoryBudget() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (d: { category_id: string; budget_amount: number }) => {
      const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const { error } = await supabase
        .from('category_budgets')
        .upsert(
          { ...d, user_id: user!.id, month: currentMonth },
          { onConflict: 'user_id,category_id,month' }
        );
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['category_budgets'] }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteCategoryBudget() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('category_budgets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['category_budgets'] }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}
