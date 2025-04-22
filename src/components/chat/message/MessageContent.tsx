import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/chat/message/MessageBubble";
import { MessageContextMenu } from "@/components/chat/message/MessageContextMenu";

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
  parent?: {
    id: string;
    content: string;
    created_at: string;
    sender?: {
      id: string;
      profiles?: {
        first_name?: string | null;
        last_name?: string | null;
      }
    }
  };
  scrollToMessage?: (messageId: string) => void;
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
  attachments,
  parent,
  scrollToMessage
}: MessageContentProps) {
  return (
    <MessageContextMenu
      onReply={onReply}
      onToggleTranslation={onToggleTranslation}
      showTranslationToggle={showTranslationToggle}
      isOwn={isOwn}
      messageId={id}
      canDelete={canDelete}
      onDelete={onDelete}
      isDeleting={isDeleting}
    >
      <MessageBubble
        id={id}
        content={content}
        timestamp={timestamp}
        isOwn={isOwn}
        isAIMessage={isAIMessage}
        attachments={attachments}
        onReply={onReply}
        parent={parent}
        scrollToMessage={scrollToMessage}
      />
    </MessageContextMenu>
  );
}
