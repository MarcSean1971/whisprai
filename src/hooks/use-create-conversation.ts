
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
      if (userError) {
        console.error("Auth error:", userError);
        throw new Error('Not authenticated');
      }
      if (!user) {
        throw new Error('Not authenticated');
      }

      console.log("Current user:", user.id);
      console.log("Contact user:", contactId);

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

      // Add participants one by one to avoid potential RLS issues
      // First add current user
      const { error: currentUserError } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversation.id,
          user_id: user.id
        });

      if (currentUserError) {
        console.error("Failed to add current user as participant:", currentUserError);
        
        // Cleanup conversation if adding the current user fails
        await supabase
          .from('conversations')
          .delete()
          .eq('id', conversation.id);
          
        throw new Error('Failed to add you as participant');
      }

      // Then add the contact
      const { error: contactError } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversation.id,
          user_id: contactId
        });

      if (contactError) {
        console.error("Failed to add contact as participant:", contactError);
        
        // Cleanup conversation and participants if adding the contact fails
        await supabase
          .from('conversation_participants')
          .delete()
          .eq('conversation_id', conversation.id);
          
        await supabase
          .from('conversations')
          .delete()
          .eq('id', conversation.id);
          
        throw new Error('Failed to add contact as participant');
      }

      toast.success("Conversation started");
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
