import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Payday {
  id: string;
  user_id: string;
  day_of_month: number;
  label: string;
  created_at: string;
}

export function usePaydays() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['paydays', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('paydays')
        .select('*')
        .order('day_of_month');
      if (error) throw error;
      return data as Payday[];
    },
    enabled: !!user,
  });
}

export function useCreatePayday() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (d: { day_of_month: number; label: string }) => {
      const { error } = await supabase.from('paydays').insert({ ...d, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['paydays'] }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeletePayday() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('paydays').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['paydays'] }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}
