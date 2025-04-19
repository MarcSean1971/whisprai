
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MessageAvatar } from "./chat/message/MessageAvatar";
import { MessageControls } from "./chat/message/MessageControls";
import { MessageBubble } from "./chat/message/MessageBubble";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

export type MessageStatus = "sending" | "sent" | "delivered" | "read";

interface ChatMessageProps {
  id: string;
  content: string;
  timestamp: string;
  isOwn?: boolean;
  status?: MessageStatus;
  sender?: {
    name: string;
    avatar?: string;
    language?: string;
  };
  showSender?: boolean;
  isAI?: boolean;
  originalLanguage?: string;
  translatedContent?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  onDelete?: () => void;
  userId?: string | null;
  viewerId?: string | null;
  conversationId: string;
  userLanguage?: string;
  metadata?: {
    isAIPrompt?: boolean;
    location?: {
      latitude: number;
      longitude: number;
    };
    voiceMessage?: string;
  };
}

export function ChatMessage({
  id,
  content,
  timestamp,
  isOwn = false,
  sender,
  showSender = false,
  isAI = false,
  originalLanguage,
  translatedContent,
  metadata,
  location,
  onDelete,
  userId,
  conversationId,
  userLanguage
}: ChatMessageProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const displayContent = showOriginal ? content : (translatedContent || content);
  const hasTranslation = !!translatedContent && content !== translatedContent;
  const showTranslationToggle = hasTranslation && originalLanguage !== userLanguage;
  const isAIMessage = isAI || metadata?.isAIPrompt;
  const canDelete = isAIMessage;
  const isAIPrompt = metadata?.isAIPrompt;
  const voiceMessagePath = metadata?.voiceMessage;

  const handleLocationClick = () => {
    if (location) {
      window.open(
        `https://www.google.com/maps?q=${location.latitude},${location.longitude}`,
        '_blank'
      );
    }
  };

  const handleDelete = async () => {
    if (isDeleting || !id) return;
    
    try {
      setIsDeleting(true);
      console.log('Attempting to delete message:', id, 'from conversation:', conversationId);
      
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', id)
        .eq('conversation_id', conversationId)
        .or(`sender_id.is.null,and(private_room.eq.AI,sender_id.eq.${userId})`);
        
      if (deleteError) {
        console.error('Error deleting message:', deleteError);
        toast.error('Failed to delete message');
        throw deleteError;
      }
      
      console.log('Message deleted successfully:', id);
      toast.success('Message deleted');
      if (onDelete) onDelete();
    } catch (error) {
      console.error('Error in delete handler:', error);
      toast.error('Failed to delete message');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePlayPauseVoiceMessage = async () => {
    if (!voiceMessagePath) return;

    try {
      const { data } = await supabase.storage
        .from('voice_messages')
        .getPublicUrl(voiceMessagePath);

      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error getting voice message URL:', error);
      toast.error('Failed to play voice message');
    }
  };

  return (
    <div className={cn(
      "flex gap-2 w-full items-start",
      isOwn ? "justify-end" : "justify-start"
    )}>
      {!isOwn && !isAIPrompt && sender && (
        <MessageAvatar
          name={sender.name}
          avatar={sender.avatar}
          isAI={isAIMessage}
        />
      )}

      <div className={cn(
        "flex flex-col max-w-[75%]",
        isOwn ? "items-end" : "items-start"
      )}>
        {showSender && sender && !isOwn && !isAIMessage && (
          <span className="text-xs text-muted-foreground mb-0.5">
            {sender.name}
          </span>
        )}
        
        <div className="flex items-start gap-2">
          <MessageBubble
            content={displayContent}
            timestamp={timestamp}
            isOwn={isOwn}
            isAIMessage={isAIMessage}
          />

          <MessageControls
            showTranslationToggle={showTranslationToggle}
            originalLanguage={originalLanguage || 'unknown'}
            onToggleTranslation={() => setShowOriginal(!showOriginal)}
            location={location}
            onLocationClick={handleLocationClick}
            canDelete={canDelete}
            onDelete={handleDelete}
            isDeleting={isDeleting}
          />
        </div>
      </div>

      {voiceMessagePath && (
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handlePlayPauseVoiceMessage}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <audio 
            ref={audioRef} 
            src={`https://vmwiigfhjvwecnlwppnj.supabase.co/storage/v1/object/public/voice_messages/${voiceMessagePath}`}
            onEnded={() => setIsPlaying(false)}
          />
        </div>
      )}
    </div>
  );
}
