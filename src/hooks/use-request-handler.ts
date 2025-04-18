
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRequestHandler(onRequestProcessed: () => void) {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const handleRequest = async (requestId: string, accept: boolean) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    
    try {
      console.log(`Processing request ${requestId}, accept: ${accept}`);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Fetch request details
      const { data: request, error: fetchError } = await supabase
        .from('contact_requests')
        .select('sender_id, recipient_id, status')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        console.error('Error fetching request details:', fetchError);
        throw new Error('Request not found');
      }

      // Verify the current user is the recipient of this request
      if (request.recipient_id !== user.id) {
        throw new Error('You are not authorized to process this request');
      }

      // Check if request is still pending
      if (request.status !== 'pending') {
        throw new Error('Request has already been processed');
      }

      // First update the request status
      console.log(`Updating request status to: ${accept ? 'accepted' : 'rejected'}`);
      
      const { error: updateError } = await supabase
        .from('contact_requests')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating request:', updateError);
        throw updateError;
      }

      if (accept) {
        console.log(`Creating contact: user_id=${user.id}, contact_id=${request.sender_id}`);
        
        // Create two-way contact records (both users add each other)
        const { error: insertError } = await supabase
          .from('contacts')
          .insert([
            { user_id: user.id, contact_id: request.sender_id },
            { user_id: request.sender_id, contact_id: user.id }
          ]);

        if (insertError) {
          console.error('Error creating contact:', insertError);
          throw insertError;
        }

        // Create a new conversation for these contacts
        const { data: conversationData, error: conversationError } = await supabase
          .from('conversations')
          .insert([{ is_group: false }])
          .select()
          .single();

        if (conversationError) {
          console.error('Error creating conversation:', conversationError);
          throw conversationError;
        }

        const conversationId = conversationData.id;
        console.log(`Created conversation with ID: ${conversationId}`);

        // Add both users as participants
        const { error: participantsError } = await supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: conversationId, user_id: user.id },
            { conversation_id: conversationId, user_id: request.sender_id }
          ]);

        if (participantsError) {
          console.error('Error adding participants to conversation:', participantsError);
          throw participantsError;
        }
      }

      toast.success(`Request ${accept ? 'accepted' : 'rejected'} successfully`);
      onRequestProcessed();
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process request');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  return {
    processingIds,
    handleRequest
  };
}
