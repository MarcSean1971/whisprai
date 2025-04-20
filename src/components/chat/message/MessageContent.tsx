
import { cn } from "@/lib/utils";
import { MessageBubble } from "./MessageBubble";
import { MessageControls } from "./MessageControls";

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
