
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/chat/message/MessageBubble";
import { MessageControls } from "@/components/chat/message/MessageControls";
import { File, FileText, FileImage, FileVideo, FileAudio, FileArchive } from "lucide-react";

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
  attachment?: { url: string; name: string; type: string };
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
  isDeleting,
  attachment
}: MessageContentProps) {
  const getAttachmentIcon = () => {
    if (!attachment) return null;

    const iconProps = { className: "h-6 w-6 mr-2 text-muted-foreground" };

    if (attachment.type.startsWith('image/')) return <FileImage {...iconProps} />;
    if (attachment.type.startsWith('video/')) return <FileVideo {...iconProps} />;
    if (attachment.type.startsWith('audio/')) return <FileAudio {...iconProps} />;
    if (attachment.type.includes('zip') || attachment.type.includes('rar')) return <FileArchive {...iconProps} />;
    if (attachment.type.startsWith('text/')) return <FileText {...iconProps} />;
    return <File {...iconProps} />;
  };

  return (
    <div className="flex items-start gap-2">
      <MessageBubble
        content={content}
        timestamp={timestamp}
        isOwn={isOwn}
        isAIMessage={isAIMessage}
      >
        {attachment && (
          <div className="mt-2 flex items-center bg-muted/50 rounded-md p-2">
            {getAttachmentIcon()}
            <a 
              href={attachment.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm hover:underline truncate max-w-[200px]"
            >
              {attachment.name}
            </a>
          </div>
        )}
      </MessageBubble>

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
