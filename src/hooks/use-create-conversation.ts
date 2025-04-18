
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
      
      console.log("Creating conversation");

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
        throw new Error('Failed to create conversation');
      }

      if (!conversation) {
        throw new Error('No conversation was created');
      }

      console.log("Created conversation:", conversation.id);
      
      toast.success("Conversation created");
      if (onSuccess) {
        onSuccess();
      }
      navigate(`/chat/${conversation.id}`);
      return conversation.id;
      
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create conversation');
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
