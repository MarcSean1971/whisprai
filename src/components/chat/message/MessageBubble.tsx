import { cn } from "@/lib/utils";
import { ReactNode, useState } from "react";
import { File, FileText, FileImage, FileVideo, FileAudio, FileArchive, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageReactions } from "./reactions/MessageReactions";

interface MessageBubbleProps {
  id: string;
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
  id,
  content, 
  timestamp, 
  isOwn, 
  isAIMessage, 
  children, 
  attachment,
  attachments 
}: MessageBubbleProps) {
  const [downloadingFiles, setDownloadingFiles] = useState<Record<string, boolean>>({});

  const getAttachmentIcon = (file: { type: string }) => {
    const iconProps = { className: "h-6 w-6 mr-2 text-muted-foreground" };
    
    if (file.type.startsWith('image/')) return <FileImage {...iconProps} />;
    if (file.type.startsWith('video/')) return <FileVideo {...iconProps} />;
    if (file.type.startsWith('audio/')) return <FileAudio {...iconProps} />;
    if (file.type.includes('zip') || file.type.includes('rar')) return <FileArchive {...iconProps} />;
    if (file.type.startsWith('text/')) return <FileText {...iconProps} />;
    return <File {...iconProps} />;
  };

  const handleDownload = async (file: { url: string; name: string }) => {
    try {
      setDownloadingFiles(prev => ({ ...prev, [file.url]: true }));
      
      const response = await fetch(file.url);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${file.name}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${file.name}`);
    } finally {
      setDownloadingFiles(prev => ({ ...prev, [file.url]: false }));
    }
  };

  const renderFileAttachment = (file: { url: string; name: string; type: string }) => {
    const isDownloading = downloadingFiles[file.url];
    
    if (file.type.startsWith('image/')) {
      return (
        <div className="mt-2 max-w-full relative group" key={file.url}>
          <img 
            src={file.url} 
            alt={file.name}
            className="rounded-lg max-h-[300px] object-contain"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:text-white hover:bg-white/20"
              onClick={() => handleDownload(file)}
              disabled={isDownloading}
              aria-label={`Download ${file.name}`}
            >
              <Download className="h-5 w-5 mr-1" />
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-2 flex items-center justify-between bg-muted/50 rounded-md p-2 gap-2" key={file.url}>
        <div className="flex items-center min-w-0 flex-1">
          {getAttachmentIcon(file)}
          <span className="text-sm truncate">{file.name}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="shrink-0"
          onClick={() => handleDownload(file)}
          disabled={isDownloading}
          aria-label={`Download ${file.name}`}
        >
          {isDownloading ? (
            <span className="text-xs">Downloading...</span>
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
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
      <div className="flex justify-between items-center mt-1">
        <MessageReactions messageId={id} isOwn={isOwn} />
        <span className="text-[10px] opacity-70">
          {timestamp}
        </span>
      </div>
    </div>
  );
}
