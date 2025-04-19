
import { cn } from "@/lib/utils";
import { MessageBubble } from "./MessageBubble";
import { MessageControls } from "./MessageControls";

interface MessageContentProps {
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
}

export function MessageContent({
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
  isDeleting
}: MessageContentProps) {
  return (
    <div className="flex items-start gap-2">
      <MessageBubble
        content={content}
        timestamp={timestamp}
        isOwn={isOwn}
        isAIMessage={isAIMessage}
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
