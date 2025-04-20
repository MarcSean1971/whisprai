
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/chat/message/MessageBubble";
import { MessageContextMenu } from "@/components/chat/message/MessageContextMenu";
import { useState } from "react";

interface MessageContentProps {
  id: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  isAIMessage: boolean;
  showTranslationToggle: boolean;
  originalLanguage: string;
  onToggleTranslation: () => void;
  location?: { latitude: number; longitude: number };
  onLocationClick: () => void;
  canDelete: boolean;
  onDelete: () => void;
  isDeleting: boolean;
  onReply: () => void;
  attachments?: {
    url: string;
    name: string;
    type: string;
  }[];
}

export function MessageContent({
  id,
  content,
  timestamp,
  isOwn,
  isAIMessage,
  showTranslationToggle,
  originalLanguage,
  onToggleTranslation,
  location,
  onLocationClick,
  canDelete,
  onDelete,
  isDeleting,
  onReply,
  attachments
}: MessageContentProps) {
  const [isReplying, setIsReplying] = useState(false);

  const handleReply = () => {
    setIsReplying(true);
  };

  const handleSubmitReply = (replyContent: string) => {
    onReply();
  };

  return (
    <MessageContextMenu
      onReply={handleReply}
      onToggleTranslation={onToggleTranslation}
      showTranslationToggle={showTranslationToggle}
      isOwn={isOwn}
      messageId={id}
    >
      <MessageBubble
        id={id}
        content={content}
        timestamp={timestamp}
        isOwn={isOwn}
        isAIMessage={isAIMessage}
        attachments={attachments}
        onReply={handleSubmitReply}
      />
    </MessageContextMenu>
  );
}
