
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { useMessages } from "@/hooks/use-messages";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { detectLanguage } from "@/lib/language-detection";
import { toast } from "sonner";

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const [suggestions, setSuggestions] = useState<Array<{ id: string; text: string }>>([]);
  const { data: messages, isLoading } = useMessages(id!);
  const { profile } = useProfile();
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    
    fetchUserId();
  }, []);
  
  const handleSendMessage = async (content: string) => {
    if (!id || !content.trim() || !userId) return;
    
    try {
      const detectedLanguage = await detectLanguage(content);
      
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: id,
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

  const handleStartRecording = () => {
    toast.info('Voice recording coming soon');
  };

  if (!id || isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      <ChatHeader conversationId={id} />
      <ChatMessages messages={messages || []} userLanguage={profile?.language} />
      <ChatInput
        onSendMessage={handleSendMessage}
        onStartRecording={handleStartRecording}
        suggestions={suggestions}
      />
    </div>
  );
}
