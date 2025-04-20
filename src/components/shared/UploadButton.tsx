
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function UploadButton() {
  const handleUpload = () => {
    // Here we would handle the file upload logic
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('File selected:', file);
        // Add your file upload logic here
      }
    };
    input.click();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleUpload}
          className="text-whispr-purple"
        >
          <Upload className="h-5 w-5" />
          <span className="sr-only">Upload</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Upload file</p>
      </TooltipContent>
    </Tooltip>
  );
}
