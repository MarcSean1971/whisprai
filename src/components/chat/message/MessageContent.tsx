import { useState } from "react";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./MessageBubble";
import { MessageControls } from "./MessageControls";
import { MessageReplyButton } from "./MessageReplyButton";
import { MessageReactions } from "./reactions/MessageReactions";
import { MessageReactionButton } from "./reactions/MessageReactionButton";
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

  const handleReplyClick = () => {
    setIsReplying(true);
  };

  const handleReplySubmit = async (replyContent: string) => {
    onReply();
    setIsReplying(false);
  };

  const handleReplyCancel = () => {
    setIsReplying(false);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <MessageBubble
            id={id}
            content={content}
            timestamp={timestamp}
            isOwn={isOwn}
            isAIMessage={isAIMessage}
            attachments={attachments}
          />
          <div className="flex items-center gap-2 mt-1 ml-1">
            <MessageReactions messageId={id} isOwn={isOwn} />
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          </div>
        </div>
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
      <div className={cn("flex flex-col gap-1", isOwn ? "items-end mr-8" : "items-start ml-1")}>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
          <MessageReplyButton onReply={handleReplyClick} isOwn={isOwn} />
          <MessageReactionButton messageId={id} isOwn={isOwn} />
        </div>
      </div>
      {isReplying && (
        <MessageReplyInput
          onSubmit={handleReplySubmit}
          onCancel={handleReplyCancel}
          isSubmitting={false}
        />
      )}
    </div>
  );
}
