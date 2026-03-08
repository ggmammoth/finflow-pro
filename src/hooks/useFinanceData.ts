import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  date: string;
  category_id: string | null;
  notes: string | null;
  payment_method: string | null;
  is_recurring: boolean | null;
  recurring_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
  is_default: boolean | null;
  created_at: string;
}

export interface RecurringPayment {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string | null;
  frequency: string;
  next_due_date: string;
  is_active: boolean | null;
  notes: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

export function useCategories(type?: string) {
  return useQuery({
    queryKey: ['categories', type],
    queryFn: async () => {
      let query = supabase.from('categories').select('*');
      if (type) query = query.eq('type', type);
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useTransactions(type?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['transactions', type, user?.id],
    queryFn: async () => {
      let query = supabase.from('transactions').select('*, categories(name, icon, color)');
      if (type) query = query.eq('type', type);
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data as (Transaction & { categories: { name: string; icon: string | null; color: string | null } | null })[];
    },
    enabled: !!user,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('transactions').insert({ ...data, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: 'Transaction added' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Transaction> & { id: string }) => {
      const { error } = await supabase.from('transactions').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: 'Transaction updated' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: 'Transaction deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useRecurringPayments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recurring_payments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_payments')
        .select('*, categories(name, icon, color)')
        .order('next_due_date');
      if (error) throw error;
      return data as (RecurringPayment & { categories: { name: string; icon: string | null; color: string | null } | null })[];
    },
    enabled: !!user,
  });
}

export function useCreateRecurring() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: Omit<RecurringPayment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('recurring_payments').insert({ ...data, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_payments'] });
      toast({ title: 'Recurring payment created' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateRecurring() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<RecurringPayment> & { id: string }) => {
      const { error } = await supabase.from('recurring_payments').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_payments'] });
      toast({ title: 'Recurring payment updated' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteRecurring() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_payments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_payments'] });
      toast({ title: 'Recurring payment deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}
