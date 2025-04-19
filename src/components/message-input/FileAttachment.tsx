
import { File, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileAttachmentProps {
  file: File;
  url: string;
  onClear: () => void;
}

export function FileAttachment({ file, onClear }: FileAttachmentProps) {
  return (
    <div className="mb-2 flex items-center justify-between p-2 bg-primary/10 rounded-md">
      <div className="flex items-center">
        <File className="h-5 w-5 mr-2 text-primary" />
        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-destructive hover:text-destructive/80"
        onClick={onClear}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
