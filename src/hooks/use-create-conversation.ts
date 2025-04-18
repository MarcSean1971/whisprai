
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseCreateConversationOptions {
  onSuccess?: () => void;
}

export function useCreateConversation({ onSuccess }: UseCreateConversationOptions = {}) {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const createConversation = async (contactId: string) => {
    if (isCreating) return;
    
    try {
      setIsCreating(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Auth error:", userError);
        toast.error('Not authenticated');
        return null;
      }

      console.log("Creating conversation with contact:", contactId);

      // Create conversation (created_by will be automatically set by RLS default)
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          is_group: false,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (conversationError) {
        console.error("Failed to create conversation:", conversationError);
        toast.error('Failed to create conversation');
        return null;
      }

      // Add current user and contact as participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          {
            conversation_id: conversation.id,
            user_id: user.id
          },
          {
            conversation_id: conversation.id,
            user_id: contactId
          }
        ]);

      if (participantsError) {
        console.error("Failed to add participants:", participantsError);
        // Cleanup the conversation since participants couldn't be added
        await supabase.from('conversations').delete().eq('id', conversation.id);
        toast.error('Failed to add participants to the conversation');
        return null;
      }

      toast.success("Conversation started");
      if (onSuccess) {
        onSuccess();
      }
      navigate(`/chat/${conversation.id}`);
      return conversation.id;
      
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    isCreating,
    createConversation
  };
}
