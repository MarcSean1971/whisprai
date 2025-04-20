
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/chat/message/MessageBubble";
import { MessageControls } from "@/components/chat/message/MessageControls";

interface MessageContentProps {
  id: string; // Added this prop
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
  id, // Added this prop
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
  attachment,
  attachments
}: MessageContentProps) {
  return (
    <div className="flex items-start gap-2">
      <MessageBubble
        id={id} // Pass the id prop
        content={content}
        timestamp={timestamp}
        isOwn={isOwn}
        isAIMessage={isAIMessage}
        attachment={attachment}
        attachments={attachments}
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
  );
}
