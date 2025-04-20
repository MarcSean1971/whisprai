
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/chat/message/MessageBubble";
import { MessageControls } from "@/components/chat/message/MessageControls";
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
  return (
    <div className="flex items-start gap-2 group">
      <MessageContextMenu
        onReply={onReply}
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
        />
      </MessageContextMenu>

      <div className="flex items-center gap-1">
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
