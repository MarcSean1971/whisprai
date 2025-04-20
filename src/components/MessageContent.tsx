
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/chat/message/MessageBubble";
import { MessageControls } from "@/components/chat/message/MessageControls";
import { MessageReplyButton } from "@/components/chat/message/MessageReplyButton";

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
  attachment?: {
    url: string;
    name: string;
    type: string;
  };
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
  attachment,
  attachments
}: MessageContentProps) {
  return (
    <div className="flex items-start gap-2 group">
      <MessageBubble
        id={id}
        content={content}
        timestamp={timestamp}
        isOwn={isOwn}
        isAIMessage={isAIMessage}
        attachment={attachment}
        attachments={attachments}
      />

      <div className="flex items-center gap-1">
        <MessageReplyButton 
          onReply={onReply}
          isOwn={isOwn}
        />
        <MessageControls
          showTranslationToggle={showTranslationToggle}
          originalLanguage={originalLanguage}
          onToggleTranslation={onToggleTranslation}
          location={location}
          onLocationClick={onLocationClick}
          canDelete={canDelete}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}
