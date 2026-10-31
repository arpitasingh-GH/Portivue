-- ============================================================================
-- Portivue — Student Portfolio Platform
-- Supabase Migration: 001_initial_schema_and_rls.sql
-- Target Project: https://btpgvxfgivzrbsyegljo.supabase.co
-- ============================================================================

-- Enable UUID generation extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CREATE PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  username TEXT UNIQUE NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  skills TEXT[] NOT NULL DEFAULT '{}',
  avatar_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT username_format_check CHECK (
    char_length(username) >= 3 AND
    char_length(username) <= 30 AND
    username ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  )
);

-- 2. CREATE PORTFOLIO ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.portfolio_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  description TEXT NOT NULL DEFAULT '',
  outcome TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (
    category IN ('Projects', 'Certificates', 'Hackathons', 'Achievements', 'Internships', 'Other')
  ),
  evidence_url TEXT CHECK (
    evidence_url IS NULL OR evidence_url = '' OR evidence_url ~ '^https?://'
  ),
  evidence_type TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES FOR FAST QUERIES
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_public ON public.profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON public.portfolio_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_published ON public.portfolio_entries(user_id, is_published);

-- 4. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_entries_updated_at ON public.portfolio_entries;
CREATE TRIGGER set_entries_updated_at
  BEFORE UPDATE ON public.portfolio_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_entries ENABLE ROW LEVEL SECURITY;

-- Profiles Policies:
-- Anyone can read public profiles; authenticated users can always read their own profile
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (is_public = true OR auth.uid() = id);

-- Users can only insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can only delete their own profile
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- Portfolio Entries Policies:
-- Public can view published entries ONLY if the parent profile is also public;
-- Owners can view all their own entries regardless of publish status.
DROP POLICY IF EXISTS "Published entries of public profiles are viewable" ON public.portfolio_entries;
CREATE POLICY "Published entries of public profiles are viewable"
  ON public.portfolio_entries FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      is_published = true
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = portfolio_entries.user_id AND p.is_public = true
      )
    )
  );

-- Users can only insert entries for themselves
DROP POLICY IF EXISTS "Users can insert own portfolio entries" ON public.portfolio_entries;
CREATE POLICY "Users can insert own portfolio entries"
  ON public.portfolio_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own portfolio entries
DROP POLICY IF EXISTS "Users can update own portfolio entries" ON public.portfolio_entries;
CREATE POLICY "Users can update own portfolio entries"
  ON public.portfolio_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own portfolio entries
DROP POLICY IF EXISTS "Users can delete own portfolio entries" ON public.portfolio_entries;
CREATE POLICY "Users can delete own portfolio entries"
  ON public.portfolio_entries FOR DELETE
  USING (auth.uid() = user_id);

-- 6. OPTIONAL STORAGE BUCKET FOR AVATARS
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
