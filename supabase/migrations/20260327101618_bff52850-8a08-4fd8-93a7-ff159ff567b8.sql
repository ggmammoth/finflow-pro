
-- Create a security definer function to get current user's email safely
CREATE OR REPLACE FUNCTION public.get_auth_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = _user_id LIMIT 1
$$;

-- Drop and recreate the problematic RLS policies on family_invitations
DROP POLICY IF EXISTS "Owner can view invitations" ON public.family_invitations;
CREATE POLICY "Owner can view invitations"
  ON public.family_invitations FOR SELECT
  TO public
  USING (
    (get_family_role(auth.uid(), family_space_id) = 'owner'::text)
    OR (invited_email = get_auth_email(auth.uid()))
  );

DROP POLICY IF EXISTS "Owner can update invitations" ON public.family_invitations;
CREATE POLICY "Owner can update invitations"
  ON public.family_invitations FOR UPDATE
  TO public
  USING (
    (get_family_role(auth.uid(), family_space_id) = 'owner'::text)
    OR (invited_email = get_auth_email(auth.uid()))
  );
