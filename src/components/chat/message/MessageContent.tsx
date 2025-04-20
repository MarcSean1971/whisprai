
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/chat/message/MessageBubble";
import { MessageContextMenu } from "@/components/chat/message/MessageContextMenu";
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
  attachments
}: MessageContentProps) {
  return (
    <div className="space-y-2">
      <MessageContextMenu
        onReply={() => onReply("")}
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
          onReply={() => onReply("")}
        />
      </MessageContextMenu>
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
