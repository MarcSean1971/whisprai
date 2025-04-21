import { useState } from "react";
import { MessageInput } from "@/components/MessageInput";
import { cn } from "@/lib/utils";
import { useLocation } from "@/hooks/use-location";
import { PredictiveAnswer } from "@/types/predictive-answer";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatInputProps {
  conversationId: string;
  onSendMessage: (
    content: string, 
    voiceMessageData?: { base64Audio: string; audioPath?: string }, 
    location?: { latitude: number; longitude: number; accuracy: number },
    attachments?: { url: string; name: string; type: string }[]
  ) => void;
  suggestions: PredictiveAnswer[];
  isLoadingSuggestions?: boolean;
}

export function ChatInput({ 
  conversationId,
  onSendMessage, 
  suggestions = [],
  isLoadingSuggestions = false,
}: ChatInputProps) {
  const { requestLocation } = useLocation();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const handleSendMessage = async (
    content: string, 
    attachments?: { url: string; name: string; type: string }[]
  ) => {
    const locationKeywords = ['where', 'location', 'nearby', 'close', 'around', 'here'];
    const mightNeedLocation = locationKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );

    if (mightNeedLocation) {
      const location = await requestLocation();
      onSendMessage(content, undefined, location || undefined, attachments);
    } else {
      onSendMessage(content, undefined, undefined, attachments);
    }
  };

  const handleVoiceMessage = async (base64Audio: string) => {
    try {
      setIsProcessingVoice(true);
      toast.info('Processing voice message...');
      
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { 
          audio: base64Audio, 
          conversationId, 
          userId 
        }
      });

      if (error) {
        console.error('Voice-to-text function error:', error);
        throw error;
      }

      if (!data?.text) {
        throw new Error('No transcription received');
      }

      if (!data?.audioPath) {
        throw new Error('No audio path received');
      }

      onSendMessage(data.text, { 
        base64Audio, 
        audioPath: data.audioPath 
      });
    } catch (error) {
      console.error('Error processing voice message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process voice message');
    } finally {
      setIsProcessingVoice(false);
      setIsRecording(false);
    }
  };

  return (
    <div className={cn(
      "p-4 border-t transition-all",
      suggestions.length > 0 && "pb-6"
    )}>
      {isRecording ? (
        <VoiceRecorder
          onSendVoice={handleVoiceMessage}
          onCancel={() => setIsRecording(false)}
          className="flex justify-center"
          isProcessing={isProcessingVoice}
        />
      ) : (
        <MessageInput
          onSendMessage={handleSendMessage}
          onStartRecording={() => setIsRecording(true)}
          suggestions={suggestions}
          isLoadingSuggestions={isLoadingSuggestions}
          disabled={isProcessingVoice}
        />
      )}
    </div>
  );
}
