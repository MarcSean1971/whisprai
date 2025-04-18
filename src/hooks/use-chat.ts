
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { detectLanguage } from "@/lib/language-detection";
import { toast } from "sonner";

export function useChat(conversationId: string) {
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize user ID
  useState(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    fetchUserId();
  });

  const sendMessage = async (content: string) => {
    if (!conversationId || !content.trim() || !userId) return;
    
    try {
      const detectedLanguage = await detectLanguage(content);
      
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
          original_language: detectedLanguage,
          sender_id: userId
        });

      if (error) throw error;
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
    handleVoiceRecord
  };
}
