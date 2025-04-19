
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
  attachments?: {
    url: string;
    name: string;
    type: string;
  }[];
}

export function MessageBubble({ 
  content, 
  timestamp, 
  isOwn, 
  isAIMessage, 
  children, 
  attachment,
  attachments 
}: MessageBubbleProps) {
  const getAttachmentIcon = (file: { type: string }) => {
    const iconProps = { className: "h-6 w-6 mr-2 text-muted-foreground" };
    
    if (file.type.startsWith('image/')) return <FileImage {...iconProps} />;
    if (file.type.startsWith('video/')) return <FileVideo {...iconProps} />;
    if (file.type.startsWith('audio/')) return <FileAudio {...iconProps} />;
    if (file.type.includes('zip') || file.type.includes('rar')) return <FileArchive {...iconProps} />;
    if (file.type.startsWith('text/')) return <FileText {...iconProps} />;
    return <File {...iconProps} />;
  };

  const renderFileAttachment = (file: { url: string; name: string; type: string }) => {
    if (file.type.startsWith('image/')) {
      return (
        <div className="mt-2 max-w-full" key={file.url}>
          <img 
            src={file.url} 
            alt={file.name}
            className="rounded-lg max-h-[300px] object-contain"
          />
        </div>
      );
    }

    return (
      <div className="mt-2 flex items-center bg-muted/50 rounded-md p-2" key={file.url}>
        {getAttachmentIcon(file)}
        <a 
          href={file.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm hover:underline truncate max-w-[200px]"
        >
          {file.name}
        </a>
      </div>
    );
  };

  const renderAttachments = () => {
    if (attachments && attachments.length > 0) {
      return attachments.map(file => renderFileAttachment(file));
    }
    if (attachment) {
      return renderFileAttachment(attachment);
    }
    return null;
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
      {renderAttachments()}
      {children}
      <div className="text-[10px] opacity-70 text-right mt-0.5">
        {timestamp}
      </div>
    </div>
  );
}
