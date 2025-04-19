-- Enable RLS on conversations table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on conversation_participants table
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to safely check if a user is in a conversation
-- This avoids recursive RLS policy issues
CREATE OR REPLACE FUNCTION public.is_conversation_member(conversation_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_id = conversation_uuid
    AND user_id = user_uuid
  );
$$;

-- Create policy that allows anyone to create a conversation
CREATE POLICY "Anyone can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (true);

-- Users can only see conversations they're a member of
CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
USING (public.is_conversation_member(id, auth.uid()));

-- Users can always add participants initially (needed for conversation creation)
CREATE POLICY "Anyone can add initial participants"
ON public.conversation_participants
FOR INSERT
WITH CHECK (true);

-- Users can view participants in conversations they belong to
CREATE POLICY "Users can view conversation participants"
ON public.conversation_participants
FOR SELECT
USING (public.is_conversation_member(conversation_id, auth.uid()));

-- Update the message deletion policy to allow any conversation participant to delete AI messages
CREATE POLICY "Users can delete AI messages in their conversations"
ON public.messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM conversation_participants 
    WHERE conversation_id = messages.conversation_id 
    AND user_id = auth.uid()
  )
  AND messages.sender_id IS NULL -- Only AI messages can be deleted
);
