ALTER TABLE public.portfolio_entries
ADD COLUMN IF NOT EXISTS outcome TEXT NOT NULL DEFAULT '';
