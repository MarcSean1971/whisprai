
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { detectLanguage } from "@/lib/language-detection";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";

export function useChat(conversationId: string) {
  const [userId, setUserId] = useState<string | null>(null);
  const { profile } = useProfile();

  // Initialize user ID
  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    fetchUserId();
  }, []);

  const sendMessage = async (content: string) => {
    if (!conversationId || !content.trim() || !userId) {
      console.error("Cannot send message: missing conversation ID, content, or user ID");
      return;
    }
    
    try {
      console.log("Detecting language for message:", content);
      const detectedLanguage = await detectLanguage(content);
      console.log("Detected language:", detectedLanguage);
      
      console.log(`Sending message to conversation ${conversationId} in ${detectedLanguage} language`);
      
      const { error, data } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
          original_language: detectedLanguage,
          sender_id: userId,
          status: 'sent'
        })
        .select();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      console.log("Message sent successfully:", data);
      
      // Update the conversation's updated_at timestamp
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
        
      if (updateError) {
        console.error('Error updating conversation timestamp:', updateError);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleVoiceRecord = () => {
    toast.info('Voice recording coming soon');
  };

  return {
    sendMessage,
    handleVoiceRecord,
    userId
  };
}
