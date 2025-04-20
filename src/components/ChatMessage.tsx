import { useState } from "react";
import { MessageContent } from "./MessageContent";
import { VoiceMessagePlayer } from "./chat/message/VoiceMessagePlayer";
import { MessageWrapper } from "./chat/message/MessageWrapper";
import { useVoiceMessageDeletion } from "./chat/message/voice-player/useVoiceMessageDeletion";

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
    profiles?: {
      first_name?: string;
      last_name?: string;
      language?: string;
    };
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
    attachments?: {
      url: string;
      name: string;
      type: string;
    }[];
  };
  onReply: () => void;
  isReplying?: boolean;
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
  userLanguage,
  onReply,
  isReplying = false
}: ChatMessageProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const { isDeleting, handleDelete } = useVoiceMessageDeletion({
    voiceMessagePath: metadata?.voiceMessage,
    messageId: id,
    conversationId,
    onSuccess: onDelete
  });

  const displayContent = showOriginal ? content : (translatedContent || content);
  const hasTranslation = !!translatedContent && content !== translatedContent;
  const showTranslationToggle = hasTranslation && originalLanguage !== userLanguage;
  const isAIMessage = isAI || metadata?.isAIPrompt;
  const canDelete = isAIMessage;
  const isAIPrompt = metadata?.isAIPrompt;
  const voiceMessagePath = metadata?.voiceMessage;
  const attachments = metadata?.attachments;

  const handleLocationClick = () => {
    if (location) {
      window.open(
        `https://www.google.com/maps?q=${location.latitude},${location.longitude}`,
        '_blank'
      );
    }
  };

  return (
    <MessageWrapper
      isOwn={isOwn}
      isAIPrompt={isAIPrompt}
      sender={sender && {
        name: `${sender.profiles?.first_name || ''} ${sender.profiles?.last_name || ''}`.trim(),
        language: sender.profiles?.language
      }}
      showSender={showSender}
      isAIMessage={isAIMessage}
    >
      <MessageContent
        id={id}
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
        attachments={attachments}
        onReply={onReply}
        isReplying={isReplying}
        onCancelReply={() => onReply("")}
      />

      {voiceMessagePath && (
        <VoiceMessagePlayer 
          voiceMessagePath={voiceMessagePath} 
          onDelete={handleDelete}
          canDelete={isOwn || isAI}
          isDeleting={isDeleting}
        />
      )}
    </MessageWrapper>
  );
}
