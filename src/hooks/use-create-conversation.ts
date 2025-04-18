
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

      // Create conversation
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

      // Add current user as participant
      const { error: currentUserError } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversation.id,
          user_id: user.id
        });

      if (currentUserError) {
        console.error("Failed to add current user:", currentUserError);
        await supabase.from('conversations').delete().eq('id', conversation.id);
        toast.error('Failed to add you to the conversation');
        return null;
      }

      // Add contact as participant
      const { error: contactError } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversation.id,
          user_id: contactId
        });

      if (contactError) {
        console.error("Failed to add contact:", contactError);
        // Cleanup: remove current user and conversation
        await supabase.from('conversation_participants').delete().eq('conversation_id', conversation.id);
        await supabase.from('conversations').delete().eq('id', conversation.id);
        toast.error('Failed to add contact to the conversation');
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
