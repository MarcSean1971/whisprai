
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useMessageReply(conversationId: string) {
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);

  const startReply = (messageId: string) => {
    setReplyToMessageId(messageId);
  };

  const cancelReply = () => {
    setReplyToMessageId(null);
  };

  // Now returns a Promise that resolves on complete, lets UI clear inline input etc.
  const sendReply = async (content: string) => {
    if (!replyToMessageId) {
      toast.error("No message selected to reply to");
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to send a reply");
        return false;
      }

      const { error } = await supabase.from('messages').insert({
        content,
        conversation_id: conversationId,
        sender_id: user.id,
        parent_id: replyToMessageId,
        status: 'sent'
      });

      if (error) throw error;

      // Reset reply state after successful send (parent component should clear input too)
      cancelReply();
      toast.success("Reply sent successfully");
      return true;
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error("Failed to send reply");
      return false;
    }
  };

  return {
    replyToMessageId,
    startReply,
    cancelReply,
    sendReply
  };
}
