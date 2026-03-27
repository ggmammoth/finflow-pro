import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FamilyMembership {
  id: string;
  family_space_id: string;
  role: 'owner' | 'adult' | 'child';
  display_name: string | null;
  is_active: boolean;
}

export interface FamilySpace {
  id: string;
  name: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
}

export function useFamilyRole() {
  const { user } = useAuth();

  const membershipQuery = useQuery({
    queryKey: ['family_membership', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('family_members')
        .select('*, family_spaces(*)')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as (FamilyMembership & { family_spaces: FamilySpace }) | null;
    },
    enabled: !!user,
  });

  const membership = membershipQuery.data;
  const activeFamily = membership?.family_spaces ?? null;
  const role = (membership?.role ?? null) as 'owner' | 'adult' | 'child' | null;

  return {
    activeFamily,
    membership,
    role,
    isOwner: role === 'owner',
    isAdult: role === 'adult',
    isChild: role === 'child',
    hasFamily: !!membership,
    isLoading: membershipQuery.isLoading,
    memberId: membership?.id ?? null,
    familySpaceId: activeFamily?.id ?? null,
  };
}
