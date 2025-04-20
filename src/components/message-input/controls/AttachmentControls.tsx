
import { Camera, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttachmentControlsProps {
  onAttachmentClick: () => void;
  onCameraClick: () => void;
  disabled: boolean;
  canAttach: boolean;
}

export function AttachmentControls({
  onAttachmentClick,
  onCameraClick,
  disabled,
  canAttach
}: AttachmentControlsProps) {
  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="text-muted-foreground hover:text-foreground"
        onClick={onAttachmentClick}
        disabled={disabled || !canAttach}
        title="Attach files (images, documents, etc.)"
      >
        <Paperclip className="h-5 w-5" />
        <span className="sr-only">Attach files</span>
      </Button>
      
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="text-muted-foreground hover:text-foreground"
        onClick={onCameraClick}
        disabled={disabled || !canAttach}
        title="Take a photo"
      >
        <Camera className="h-5 w-5" />
        <span className="sr-only">Use camera</span>
      </Button>
    </>
  );
}

