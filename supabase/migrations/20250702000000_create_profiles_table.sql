-- Create profiles table to fix profile saving issues
-- This addresses the schema/auth mismatch identified in Phase 1.1

-- First, create the profiles table with all required fields
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT DEFAULT '',
  avatar_url TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_profile();

-- Update trigger for updated_at column (reuse existing function)
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at);

-- Backfill existing users (create profiles for users who already exist)
INSERT INTO public.profiles (id, full_name)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', '') as full_name
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Add comment for documentation
COMMENT ON TABLE public.profiles IS 'User profile data separate from auth.users for extensibility';
COMMENT ON COLUMN public.profiles.full_name IS 'User display name, defaults to empty string to prevent null issues';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user profile image';
COMMENT ON COLUMN public.profiles.phone_number IS 'User phone number for contact purposes';