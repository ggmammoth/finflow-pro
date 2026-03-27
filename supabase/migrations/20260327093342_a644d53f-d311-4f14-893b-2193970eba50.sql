
-- Allow owner to always read their own family space
CREATE POLICY "Owner can view own family space"
  ON public.family_spaces FOR SELECT
  USING (auth.uid() = owner_user_id);
