
-- Create table for tracking user presence
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies for user presence
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see anyone's presence
CREATE POLICY "Allow users to view everyone's presence" 
ON public.user_presence 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policy to allow users to update only their own presence
CREATE POLICY "Allow users to update their own presence" 
ON public.user_presence 
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy to allow users to insert their own presence
CREATE POLICY "Allow users to insert their own presence" 
ON public.user_presence 
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- For faster queries
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON public.user_presence(last_seen_at);
