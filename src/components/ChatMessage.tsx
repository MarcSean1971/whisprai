
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MessageAvatar } from "./chat/message/MessageAvatar";
import { MessageContent } from "./chat/message/MessageContent";
import { VoiceMessagePlayer } from "./chat/message/VoiceMessagePlayer";
import { supabase } from "@/integrations/supabase/client";

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
      
      // Handle voice message deletion
      if (metadata?.voiceMessage) {
        const voicePath = metadata.voiceMessage.startsWith('/') 
          ? metadata.voiceMessage.substring(1) 
          : metadata.voiceMessage;
          
        console.log('Deleting voice message file at path:', voicePath);
        
        const { error: storageError } = await supabase.storage
          .from('voice_messages')
          .remove([voicePath]);
          
        if (storageError) {
          console.error('Error deleting voice message file:', storageError);
          throw new Error('Failed to delete voice message file');
        }
        
        console.log('Voice message file deleted successfully');
      }
      
      // Delete the message from the database
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', id)
        .eq('conversation_id', conversationId)
        .or(`sender_id.is.null,and(private_room.eq.AI,sender_id.eq.${userId})`);
        
      if (deleteError) {
        console.error('Error deleting message:', deleteError);
        throw new Error('Failed to delete message');
      }
      
      console.log('Message deleted successfully:', id);
      toast.success('Message deleted');
      if (onDelete) onDelete();
    } catch (error) {
      console.error('Error in delete handler:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete message');
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
        
        <MessageContent
          content={displayContent}
          timestamp={timestamp}
          isOwn={isOwn}
          isAIMessage={isAIMessage}
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

      {voiceMessagePath && (
        <VoiceMessagePlayer 
          voiceMessagePath={voiceMessagePath} 
          onDelete={handleDelete}
          canDelete={isOwn || isAI}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
