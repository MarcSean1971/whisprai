
import { MessageInput } from "@/components/MessageInput";
import { cn } from "@/lib/utils";
import { useLocation } from "@/hooks/use-location";
import { PredictiveAnswer } from "@/types/predictive-answer";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatInputProps {
  onSendMessage: (content: string, location?: { latitude: number; longitude: number; accuracy: number }) => void;
  suggestions: PredictiveAnswer[];
  isLoadingSuggestions?: boolean;
}

export function ChatInput({ 
  onSendMessage, 
  suggestions = [],
  isLoadingSuggestions = false 
}: ChatInputProps) {
  const { requestLocation } = useLocation();
  const [isRecording, setIsRecording] = useState(false);

  const handleSendMessage = async (content: string) => {
    const locationKeywords = ['where', 'location', 'nearby', 'close', 'around', 'here'];
    const mightNeedLocation = locationKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );

    if (mightNeedLocation) {
      const location = await requestLocation();
      onSendMessage(content, location || undefined);
    } else {
      onSendMessage(content);
    }
  };

  const handleVoiceMessage = async (base64Audio: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });

      if (error) throw error;

      if (data?.text) {
        handleSendMessage(data.text);
      } else {
        throw new Error('No transcription received');
      }
    } catch (error) {
      console.error('Error processing voice message:', error);
      toast.error('Failed to process voice message');
    } finally {
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
        />
      ) : (
        <MessageInput
          onSendMessage={handleSendMessage}
          onStartRecording={() => setIsRecording(true)}
          suggestions={suggestions}
          isLoadingSuggestions={isLoadingSuggestions}
        />
      )}
    </div>
  );
}
