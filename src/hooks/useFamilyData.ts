import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFamilyRole } from './useFamilyRole';
import { format, startOfMonth } from 'date-fns';

/* ── Family Space ── */

export function useFamilySpace() {
  const { familySpaceId } = useFamilyRole();
  return useQuery({
    queryKey: ['family_space', familySpaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('family_spaces')
        .select('*')
        .eq('id', familySpaceId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!familySpaceId,
  });
}

export function useCreateFamilySpace() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (name: string) => {
      // Create family space
      const { data: space, error: spaceErr } = await supabase
        .from('family_spaces')
        .insert({ name, owner_user_id: user!.id })
        .select()
        .single();
      if (spaceErr) throw spaceErr;

      // Add creator as owner member
      const { error: memberErr } = await supabase
        .from('family_members')
        .insert({
          family_space_id: space.id,
          user_id: user!.id,
          role: 'owner',
          display_name: user!.email?.split('@')[0] ?? 'Owner',
        });
      if (memberErr) throw memberErr;

      return space;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family_membership'] });
      qc.invalidateQueries({ queryKey: ['family_space'] });
      toast({ title: 'Family created successfully!' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

/* ── Family Members ── */

export function useFamilyMembers() {
  const { familySpaceId } = useFamilyRole();
  return useQuery({
    queryKey: ['family_members', familySpaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_space_id', familySpaceId!)
        .eq('is_active', true)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!familySpaceId,
  });
}

/* ── Invitations ── */

export function useFamilyInvitations() {
  const { familySpaceId } = useFamilyRole();
  return useQuery({
    queryKey: ['family_invitations', familySpaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('family_invitations')
        .select('*')
        .eq('family_space_id', familySpaceId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!familySpaceId,
  });
}

export function useInviteFamilyMember() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { familySpaceId } = useFamilyRole();
  const { data: familySpace } = useFamilySpace();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: 'adult' | 'child' }) => {
      const token = crypto.randomUUID();
      const invitationPayload = {
        family_space_id: familySpaceId!,
        invited_email: email,
        role_to_assign: role,
        token,
        invited_by: user!.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      console.info('[FamilyInvite] Creating invitation', {
        invited_email: invitationPayload.invited_email,
        role_to_assign: invitationPayload.role_to_assign,
        family_space_id: invitationPayload.family_space_id,
        invited_by: invitationPayload.invited_by,
        token: invitationPayload.token,
      });

      const { data: invitation, error } = await supabase
        .from('family_invitations')
        .insert(invitationPayload)
        .select('id, invited_email, token, family_space_id, invited_by, expires_at')
        .single();

      if (error || !invitation) {
        console.error('[FamilyInvite] Invitation insert failed', {
          error,
          payload: invitationPayload,
        });
        throw error ?? new Error('Invitation insert failed');
      }

      console.info('[FamilyInvite] Invitation created', invitation);

      const appUrl = import.meta.env.VITE_APP_URL || 'https://moneybloom.me';
      const inviteLink = `${appUrl}/accept-invite?token=${encodeURIComponent(token)}`;
      const emailPayload = {
        templateName: 'family-invitation',
        recipientEmail: invitation.invited_email,
        idempotencyKey: `family-invitation-${invitation.id}`,
        templateData: {
          inviteLink,
          role,
          familyName: familySpace?.name ?? 'Family',
          inviterEmail: user?.email ?? '',
          expiresAt: invitation.expires_at,
        },
      };

      console.info('[FamilyInvite] Triggering invitation email', {
        recipientEmail: emailPayload.recipientEmail,
        templateName: emailPayload.templateName,
        idempotencyKey: emailPayload.idempotencyKey,
      });

      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-transactional-email', {
        body: emailPayload,
      });

      if (emailError) {
        console.error('[FamilyInvite] Email trigger failed', {
          error: emailError,
          recipientEmail: emailPayload.recipientEmail,
          invitationId: invitation.id,
        });
        throw new Error(emailError.message || 'Invitation email sending failed');
      }

      console.info('[FamilyInvite] Email queued successfully', {
        invitationId: invitation.id,
        response: emailData,
      });

      return token;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family_invitations'] });
      toast({ title: 'Invitation sent!' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useAcceptFamilyInvite() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (token: string) => {
      // Find invitation
      const { data: invite, error: findErr } = await supabase
        .from('family_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();
      if (findErr || !invite) throw new Error('Invalid or expired invitation');

      // Add member
      const { error: memberErr } = await supabase
        .from('family_members')
        .insert({
          family_space_id: invite.family_space_id,
          user_id: user!.id,
          role: invite.role_to_assign,
          display_name: user!.email?.split('@')[0] ?? 'Member',
        });
      if (memberErr) throw memberErr;

      // Update invitation status
      const { error: updateErr } = await supabase
        .from('family_invitations')
        .update({ status: 'accepted' })
        .eq('id', invite.id);
      if (updateErr) throw updateErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family_membership'] });
      qc.invalidateQueries({ queryKey: ['family_members'] });
      toast({ title: 'You have joined the family!' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

/* ── Child Allowances ── */

export function useChildAllowances(childMemberId?: string) {
  const { familySpaceId } = useFamilyRole();
  return useQuery({
    queryKey: ['child_allowances', familySpaceId, childMemberId],
    queryFn: async () => {
      let query = supabase
        .from('child_allowances')
        .select('*, family_members(display_name, user_id)')
        .eq('family_space_id', familySpaceId!);
      if (childMemberId) query = query.eq('child_member_id', childMemberId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!familySpaceId,
  });
}

export function useCreateChildAllowance() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { familySpaceId } = useFamilyRole();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: {
      child_member_id: string;
      amount: number;
      frequency: 'weekly' | 'monthly';
      next_due_date?: string;
      notes?: string;
    }) => {
      const { error } = await supabase.from('child_allowances').insert({
        ...data,
        family_space_id: familySpaceId!,
        created_by_user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['child_allowances'] });
      toast({ title: 'Allowance created!' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateChildAllowance() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; amount?: number; frequency?: string; notes?: string; next_due_date?: string }) => {
      const { error } = await supabase.from('child_allowances').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['child_allowances'] });
      toast({ title: 'Allowance updated!' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteChildAllowance() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('child_allowances').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['child_allowances'] });
      toast({ title: 'Allowance deleted!' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

/* ── Family Transactions ── */

export function useFamilyTransactions() {
  const { familySpaceId } = useFamilyRole();
  return useQuery({
    queryKey: ['family_transactions', familySpaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(name, icon, color)')
        .eq('family_space_id', familySpaceId!)
        .order('date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!familySpaceId,
  });
}

export function useCreateFamilyTransaction() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { familySpaceId } = useFamilyRole();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: {
      type: string; title: string; amount: number; date: string;
      category_id?: string | null; notes?: string | null;
      related_child_member_id?: string | null; related_goal_id?: string | null;
    }) => {
      const { error } = await supabase.from('transactions').insert({
        ...data,
        user_id: user!.id,
        family_space_id: familySpaceId!,
        created_by_user_id: user!.id,
        visibility: 'family',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family_transactions'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: 'Family transaction added!' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

/* ── Family Savings Goals ── */

export function useFamilySavingsGoals() {
  const { familySpaceId } = useFamilyRole();
  return useQuery({
    queryKey: ['family_savings_goals', familySpaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('family_space_id', familySpaceId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!familySpaceId,
  });
}

/* ── Family Category Budgets ── */

export function useFamilyCategoryBudgets() {
  const { familySpaceId } = useFamilyRole();
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  return useQuery({
    queryKey: ['family_category_budgets', familySpaceId, currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category_budgets')
        .select('*, categories(name, icon, color)')
        .eq('family_space_id', familySpaceId!)
        .eq('month', currentMonth)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!familySpaceId,
  });
}
