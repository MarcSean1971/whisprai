
import { Button } from "@/components/ui/button";
import { Download, File, FileArchive, FileAudio, FileImage, FileText, FileVideo } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export interface FileAttachment {
  url: string;
  name: string;
  type: string;
}

interface MessageAttachmentProps {
  file: FileAttachment;
}

export function MessageAttachment({ file }: MessageAttachmentProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const getAttachmentIcon = () => {
    const iconProps = { className: "h-6 w-6 mr-2 text-muted-foreground" };
    if (file.type.startsWith('image/')) return <FileImage {...iconProps} />;
    if (file.type.startsWith('video/')) return <FileVideo {...iconProps} />;
    if (file.type.startsWith('audio/')) return <FileAudio {...iconProps} />;
    if (file.type.includes('zip') || file.type.includes('rar')) return <FileArchive {...iconProps} />;
    if (file.type.startsWith('text/')) return <FileText {...iconProps} />;
    return <File {...iconProps} />;
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
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
      setIsDownloading(false);
    }
  };

  if (file.type.startsWith("image/")) {
    return (
      <div className="mt-2 max-w-full relative group">
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
            onClick={handleDownload}
            disabled={isDownloading}
            aria-label={`Download ${file.name}`}
          >
            <Download className="h-5 w-5 mr-1" />
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center justify-between bg-muted/50 rounded-md p-2 gap-2">
      <div className="flex items-center min-w-0 flex-1">
        {getAttachmentIcon()}
        <span className="text-sm truncate">{file.name}</span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="shrink-0"
        onClick={handleDownload}
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
}
