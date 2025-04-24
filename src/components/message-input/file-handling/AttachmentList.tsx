
import { File, FileImage, FileVideo, FileAudio, FileArchive, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttachmentListProps {
  attachments: { file: File; url: string }[];
  onClear: (index?: number) => void;
}

export function AttachmentList({ attachments, onClear }: AttachmentListProps) {
  const getFileIcon = (file: File) => {
    const iconProps = { className: "h-5 w-5 mr-2 text-primary" };
    
    if (file.type.startsWith('image/')) return <FileImage {...iconProps} />;
    if (file.type.startsWith('video/')) return <FileVideo {...iconProps} />;
    if (file.type.startsWith('audio/')) return <FileAudio {...iconProps} />;
    if (file.type.includes('zip') || file.type.includes('rar')) return <FileArchive {...iconProps} />;
    if (file.type.startsWith('text/')) return <FileText {...iconProps} />;
    return <File {...iconProps} />;
  };

  const renderPreview = (file: File, url: string, index: number) => {
    if (file.type.startsWith('image/')) {
      return (
        <div key={index} className="relative mb-2">
          <img 
            src={url} 
            alt={file.name}
            className="rounded-lg max-h-[200px] object-cover w-full"
          />
          <Button 
            variant="destructive" 
            size="icon" 
            className="absolute top-2 right-2 rounded-full"
            onClick={() => onClear(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div key={index} className="mb-2 flex items-center justify-between p-2 bg-primary/10 rounded-md">
        <div className="flex items-center flex-1 overflow-hidden">
          {getFileIcon(file)}
          <span className="text-sm truncate flex-1">{file.name}</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-destructive hover:text-destructive/80"
          onClick={() => onClear(index)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {attachments.map((attachment, index) => 
        renderPreview(attachment.file, attachment.url, index)
      )}
    </div>
  );
}
