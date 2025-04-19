import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MessageAvatar } from "./chat/message/MessageAvatar";
import { MessageControls } from "./chat/message/MessageControls";
import { MessageBubble } from "./chat/message/MessageBubble";

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
  const displayContent = showOriginal ? content : (translatedContent || content);
  const hasTranslation = !!translatedContent && content !== translatedContent;
  const showTranslationToggle = hasTranslation && originalLanguage !== userLanguage;
  const isAIMessage = isAI || metadata?.isAIPrompt;
  const canDelete = isAIMessage;
  const isAIPrompt = metadata?.isAIPrompt;

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
    </div>
  );
}
