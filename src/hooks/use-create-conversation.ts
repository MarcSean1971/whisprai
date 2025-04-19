
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
    console.log("Starting conversation creation process");
    console.log("Contact ID:", contactId);
    
    if (isCreating) {
      console.log("Conversation creation already in progress");
      return null;
    }
    
    try {
      setIsCreating(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      console.log("Current user:", user);
      console.log("User error:", userError);
      
      if (userError || !user) {
        console.error("Authentication error:", userError);
        toast.error('Not authenticated');
        return null;
      }

      // Check if conversation already exists
      const { data: existingConversation } = await supabase.rpc(
        'get_existing_conversation',
        { user1_id: user.id, user2_id: contactId }
      );

      if (existingConversation) {
        console.log("Found existing conversation:", existingConversation);
        toast.info("Opening existing conversation");
        navigate(`/chat/${existingConversation}`);
        return existingConversation;
      }

      // Create new conversation if none exists
      console.log("No existing conversation found, creating new one");
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          is_group: false,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      console.log("Conversation creation result:", conversation);
      console.log("Conversation creation error:", conversationError);

      if (conversationError) {
        console.error("Failed to create conversation:", conversationError);
        toast.error('Failed to create conversation');
        return null;
      }

      // Add participants
      console.log("Adding participants to conversation");
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

      console.log("Participants insertion error:", participantsError);

      if (participantsError) {
        console.error("Failed to add participants:", participantsError);
        // Cleanup the conversation
        await supabase.from('conversations').delete().eq('id', conversation.id);
        
        if (participantsError.message.includes('Conversation already exists between these users')) {
          toast.info('A conversation already exists with this user');
          // Fetch the existing conversation and redirect
          const { data: existingConv } = await supabase.rpc(
            'get_existing_conversation',
            { user1_id: user.id, user2_id: contactId }
          );
          if (existingConv) {
            navigate(`/chat/${existingConv}`);
            return existingConv;
          }
        } else {
          toast.error('Failed to add participants to the conversation');
        }
        return null;
      }

      console.log("Conversation created successfully");
      toast.success("Conversation started");
      
      if (onSuccess) {
        onSuccess();
      }
      
      navigate(`/chat/${conversation.id}`);
      return conversation.id;
      
    } catch (error) {
      console.error('Unexpected error in conversation creation:', error);
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
