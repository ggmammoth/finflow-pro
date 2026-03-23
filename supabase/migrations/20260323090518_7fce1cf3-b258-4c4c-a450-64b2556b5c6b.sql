
CREATE TABLE public.paydays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  label TEXT NOT NULL DEFAULT 'Payday',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.paydays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own paydays" ON public.paydays FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own paydays" ON public.paydays FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own paydays" ON public.paydays FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own paydays" ON public.paydays FOR DELETE USING (auth.uid() = user_id);
