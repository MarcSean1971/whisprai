
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRequestHandler(onRequestProcessed: () => void) {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const handleRequest = async (requestId: string, accept: boolean) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    
    try {
      console.log(`Processing request ${requestId}, accept: ${accept}`);
      
      const { data: request, error: fetchError } = await supabase
        .from('contact_requests')
        .select('sender_id')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        console.error('Error fetching request details:', fetchError);
        throw new Error('Request not found');
      }

      if (accept) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        console.log(`Creating contact: user_id=${user.id}, contact_id=${request.sender_id}`);
        
        const { error: insertError } = await supabase
          .from('contacts')
          .insert([
            { user_id: user.id, contact_id: request.sender_id }
          ]);

        if (insertError) {
          console.error('Error creating contact:', insertError);
          throw insertError;
        }
      }

      console.log(`Updating request status to: ${accept ? 'accepted' : 'rejected'}`);
      
      const { error: updateError } = await supabase
        .from('contact_requests')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating request:', updateError);
        throw updateError;
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
