
-- ═══════════════════════════════════════════════
-- NEW TABLES
-- ═══════════════════════════════════════════════

-- 1. family_spaces
CREATE TABLE public.family_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.family_spaces ENABLE ROW LEVEL SECURITY;

-- 2. family_members
CREATE TABLE public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_space_id uuid NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('owner','adult','child')),
  display_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- 3. family_invitations
CREATE TABLE public.family_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_space_id uuid NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  role_to_assign text NOT NULL CHECK (role_to_assign IN ('adult','child')),
  token text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','revoked')),
  invited_by uuid NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;

-- 4. child_allowances
CREATE TABLE public.child_allowances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_space_id uuid NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  child_member_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('weekly','monthly')),
  next_due_date date,
  auto_recurring boolean NOT NULL DEFAULT false,
  notes text,
  created_by_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.child_allowances ENABLE ROW LEVEL SECURITY;

-- 5. goal_contributions
CREATE TABLE public.goal_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  contributed_by_user_id uuid NOT NULL,
  amount numeric NOT NULL,
  note text,
  contribution_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════
-- EXTEND EXISTING TABLES
-- ═══════════════════════════════════════════════

-- transactions
ALTER TABLE public.transactions
  ADD COLUMN family_space_id uuid NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  ADD COLUMN created_by_user_id uuid NULL,
  ADD COLUMN visibility text NOT NULL DEFAULT 'personal' CHECK (visibility IN ('personal','family','private_child','private_adult')),
  ADD COLUMN related_child_member_id uuid NULL REFERENCES public.family_members(id),
  ADD COLUMN related_goal_id uuid NULL REFERENCES public.savings_goals(id);

-- category_budgets
ALTER TABLE public.category_budgets
  ADD COLUMN family_space_id uuid NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE;

-- savings_goals
ALTER TABLE public.savings_goals
  ADD COLUMN family_space_id uuid NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  ADD COLUMN goal_type text NOT NULL DEFAULT 'personal' CHECK (goal_type IN ('personal','family','child')),
  ADD COLUMN owner_member_id uuid NULL REFERENCES public.family_members(id);

-- categories (optional family scope)
ALTER TABLE public.categories
  ADD COLUMN family_space_id uuid NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE;

-- ═══════════════════════════════════════════════
-- SECURITY DEFINER FUNCTIONS
-- ═══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_family_role(_user_id uuid, _family_space_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.family_members
  WHERE user_id = _user_id AND family_space_id = _family_space_id AND is_active = true
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_family_member(_user_id uuid, _family_space_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE user_id = _user_id AND family_space_id = _family_space_id AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_family_adult_or_owner(_user_id uuid, _family_space_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE user_id = _user_id AND family_space_id = _family_space_id AND is_active = true AND role IN ('owner','adult')
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_family_space_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_space_id FROM public.family_members
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_child_member_id_for_user(_user_id uuid, _family_space_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.family_members
  WHERE user_id = _user_id AND family_space_id = _family_space_id AND role = 'child' AND is_active = true
  LIMIT 1
$$;

-- ═══════════════════════════════════════════════
-- RLS POLICIES — family_spaces
-- ═══════════════════════════════════════════════

CREATE POLICY "Members can view their family space"
  ON public.family_spaces FOR SELECT
  USING (public.is_family_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create family spaces"
  ON public.family_spaces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owner can update family space"
  ON public.family_spaces FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Owner can delete family space"
  ON public.family_spaces FOR DELETE
  USING (auth.uid() = owner_user_id);

-- ═══════════════════════════════════════════════
-- RLS POLICIES — family_members
-- ═══════════════════════════════════════════════

CREATE POLICY "Family members can view members in their family"
  ON public.family_members FOR SELECT
  USING (public.is_family_member(auth.uid(), family_space_id));

CREATE POLICY "Owner can insert family members"
  ON public.family_members FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_family_adult_or_owner(auth.uid(), family_space_id)
    OR auth.uid() = user_id
  );

CREATE POLICY "Owner can update family members"
  ON public.family_members FOR UPDATE
  USING (public.is_family_adult_or_owner(auth.uid(), family_space_id));

CREATE POLICY "Owner can delete family members"
  ON public.family_members FOR DELETE
  USING (
    public.get_family_role(auth.uid(), family_space_id) = 'owner'
  );

-- ═══════════════════════════════════════════════
-- RLS POLICIES — family_invitations
-- ═══════════════════════════════════════════════

CREATE POLICY "Owner can view invitations"
  ON public.family_invitations FOR SELECT
  USING (
    public.get_family_role(auth.uid(), family_space_id) = 'owner'
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Owner can create invitations"
  ON public.family_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_family_role(auth.uid(), family_space_id) = 'owner'
  );

CREATE POLICY "Owner can update invitations"
  ON public.family_invitations FOR UPDATE
  USING (
    public.get_family_role(auth.uid(), family_space_id) = 'owner'
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Owner can delete invitations"
  ON public.family_invitations FOR DELETE
  USING (
    public.get_family_role(auth.uid(), family_space_id) = 'owner'
  );

-- ═══════════════════════════════════════════════
-- RLS POLICIES — child_allowances
-- ═══════════════════════════════════════════════

CREATE POLICY "Adults can manage allowances"
  ON public.child_allowances FOR SELECT
  USING (
    public.is_family_adult_or_owner(auth.uid(), family_space_id)
    OR child_member_id = public.get_child_member_id_for_user(auth.uid(), family_space_id)
  );

CREATE POLICY "Adults can insert allowances"
  ON public.child_allowances FOR INSERT
  TO authenticated
  WITH CHECK (public.is_family_adult_or_owner(auth.uid(), family_space_id));

CREATE POLICY "Adults can update allowances"
  ON public.child_allowances FOR UPDATE
  USING (public.is_family_adult_or_owner(auth.uid(), family_space_id));

CREATE POLICY "Adults can delete allowances"
  ON public.child_allowances FOR DELETE
  USING (public.is_family_adult_or_owner(auth.uid(), family_space_id));

-- ═══════════════════════════════════════════════
-- RLS POLICIES — goal_contributions
-- ═══════════════════════════════════════════════

CREATE POLICY "Users can view own contributions"
  ON public.goal_contributions FOR SELECT
  USING (auth.uid() = contributed_by_user_id);

CREATE POLICY "Users can insert contributions"
  ON public.goal_contributions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = contributed_by_user_id);

-- ═══════════════════════════════════════════════
-- UPDATED POLICIES for extended tables (transactions)
-- Add family-aware SELECT for transactions
-- ═══════════════════════════════════════════════

-- Keep existing personal policies, add family policy
CREATE POLICY "Family members can view family transactions"
  ON public.transactions FOR SELECT
  USING (
    family_space_id IS NOT NULL
    AND public.is_family_adult_or_owner(auth.uid(), family_space_id)
  );

CREATE POLICY "Child can view own family transactions"
  ON public.transactions FOR SELECT
  USING (
    family_space_id IS NOT NULL
    AND visibility IN ('family', 'private_child')
    AND related_child_member_id = public.get_child_member_id_for_user(auth.uid(), family_space_id)
  );

CREATE POLICY "Adults can insert family transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    family_space_id IS NULL
    OR public.is_family_adult_or_owner(auth.uid(), family_space_id)
  );

-- Family budget policies
CREATE POLICY "Family members can view family budgets"
  ON public.category_budgets FOR SELECT
  USING (
    family_space_id IS NOT NULL
    AND public.is_family_adult_or_owner(auth.uid(), family_space_id)
  );

CREATE POLICY "Adults can insert family budgets"
  ON public.category_budgets FOR INSERT
  TO authenticated
  WITH CHECK (
    family_space_id IS NULL
    OR public.is_family_adult_or_owner(auth.uid(), family_space_id)
  );

CREATE POLICY "Adults can update family budgets"
  ON public.category_budgets FOR UPDATE
  USING (
    family_space_id IS NOT NULL
    AND public.is_family_adult_or_owner(auth.uid(), family_space_id)
  );

CREATE POLICY "Adults can delete family budgets"
  ON public.category_budgets FOR DELETE
  USING (
    family_space_id IS NOT NULL
    AND public.is_family_adult_or_owner(auth.uid(), family_space_id)
  );

-- Family savings goals policies
CREATE POLICY "Family members can view family goals"
  ON public.savings_goals FOR SELECT
  USING (
    family_space_id IS NOT NULL
    AND (
      public.is_family_adult_or_owner(auth.uid(), family_space_id)
      OR (goal_type = 'child' AND owner_member_id = public.get_child_member_id_for_user(auth.uid(), family_space_id))
    )
  );

CREATE POLICY "Adults can insert family goals"
  ON public.savings_goals FOR INSERT
  TO authenticated
  WITH CHECK (
    family_space_id IS NULL
    OR public.is_family_adult_or_owner(auth.uid(), family_space_id)
  );

CREATE POLICY "Adults can update family goals"
  ON public.savings_goals FOR UPDATE
  USING (
    family_space_id IS NULL
    OR public.is_family_adult_or_owner(auth.uid(), family_space_id)
  );

CREATE POLICY "Adults can delete family goals"
  ON public.savings_goals FOR DELETE
  USING (
    family_space_id IS NULL
    OR public.is_family_adult_or_owner(auth.uid(), family_space_id)
  );
