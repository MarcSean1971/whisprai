
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { File, FileText, FileImage, FileVideo, FileAudio, FileArchive } from "lucide-react";

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isOwn: boolean;
  isAIMessage: boolean;
  children?: ReactNode;
  attachment?: {
    url: string;
    name: string;
    type: string;
  };
}

export function MessageBubble({ content, timestamp, isOwn, isAIMessage, children, attachment }: MessageBubbleProps) {
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

  const renderAttachment = () => {
    if (!attachment) return null;

    if (attachment.type.startsWith('image/')) {
      return (
        <div className="mt-2 max-w-full">
          <img 
            src={attachment.url} 
            alt={attachment.name}
            className="rounded-lg max-h-[300px] object-contain"
          />
        </div>
      );
    }

    return (
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
    );
  };

  return (
    <div className={cn(
      "rounded-lg py-2 px-3 max-w-[400px]",
      isOwn
        ? "bg-primary text-primary-foreground"
        : isAIMessage
        ? "bg-violet-500/20 border border-violet-500/20"
        : "bg-secondary"
    )}>
      <div className="text-sm break-words">{content}</div>
      {renderAttachment()}
      {children}
      <div className="text-[10px] opacity-70 text-right mt-0.5">
        {timestamp}
      </div>
    </div>
  );
}
