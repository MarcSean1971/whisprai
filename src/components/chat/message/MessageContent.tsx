
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/chat/message/MessageBubble";
import { MessageContextMenu } from "@/components/chat/message/MessageContextMenu";
import { MessageControls } from "./MessageControls";
import { MessageReplyInput } from "./MessageReplyInput";

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
  onReply: (replyContent: string) => void;
  isReplying?: boolean;
  onCancelReply?: () => void;
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
  }
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
  isReplying = false,
  onCancelReply,
  attachments,
  parent,
  scrollToMessage
}: MessageContentProps) {
  return (
    <div className="group space-y-2">
      <div className="relative">
        <MessageContextMenu
          onReply={() => onReply("")}
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
            onReply={() => onReply("")}
            parent={parent}
            scrollToMessage={scrollToMessage}
          />
        </MessageContextMenu>
        
        <div className="absolute right-0 top-0 -mr-12 hidden group-hover:flex items-center gap-1 p-1">
          <MessageControls
            showTranslationToggle={showTranslationToggle}
            originalLanguage={originalLanguage}
            onToggleTranslation={onToggleTranslation}
            location={location}
            onLocationClick={onLocationClick}
            canDelete={false}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        </div>
      </div>

      {isReplying && (
        <div className="ml-4 mt-2">
          <MessageReplyInput
            onSubmit={onReply}
            onCancel={onCancelReply || (() => {})}
          />
        </div>
      )}
    </div>
  );
}
