import { useParams } from "react-router-dom";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { useMessages } from "@/hooks/use-messages";
import { useProfile } from "@/hooks/use-profile";
import { useChat } from "@/hooks/use-chat";
import { usePredictiveAnswers } from "@/hooks/use-predictive-answers";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const { data: messages, isLoading, error, refetch } = useMessages(id!);
  const { profile } = useProfile();
  const { sendMessage, handleVoiceRecord } = useChat(id!);
  const { 
    suggestions, 
    isLoading: isLoadingSuggestions, 
    generateSuggestions, 
    clearSuggestions 
  } = usePredictiveAnswers(id!);
  
  useEffect(() => {
    if (!id) return;
    
    const subscription = supabase
      .channel(`messages:${id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${id}`
        }, 
        () => {
          refetch();
        })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [id, refetch]);
  
  const handleSendMessage = async (content: string, location?: { latitude: number; longitude: number; accuracy: number }) => {
    await sendMessage(content, location);
    clearSuggestions();
  };

  const handleNewReceivedMessage = () => {
    generateSuggestions();
  };

  if (!id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <AlertCircle className="h-10 w-10 text-destructive mr-2" />
        <p>Invalid conversation</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-4" />
        <p className="text-destructive mb-2">Failed to load messages</p>
        <pre className="text-xs text-muted-foreground bg-muted p-2 rounded-md max-w-full overflow-auto my-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </pre>
        <Button onClick={() => refetch()} variant="outline" className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      <ChatHeader conversationId={id} />
      <ChatMessages 
        messages={messages || []} 
        userLanguage={profile?.language}
        onNewReceivedMessage={handleNewReceivedMessage}
      />
      <ChatInput
        onSendMessage={handleSendMessage}
        onStartRecording={handleVoiceRecord}
        suggestions={suggestions}
        isLoadingSuggestions={isLoadingSuggestions}
      />
    </div>
  );
}
