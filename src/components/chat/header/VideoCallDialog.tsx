
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  userName?: string;
  recipientName?: string;
}

export function VideoCallDialog({ open, onOpenChange, roomId, userName, recipientName }: VideoCallDialogProps) {
  const isMobile = useIsMobile();
  
  const userParams = new URLSearchParams({
    roomID: roomId,
    userName: userName || 'User',
    recipientName: recipientName || 'Recipient'
  }).toString();

  useEffect(() => {
    if (open && roomId) {
      console.log('Opening video call dialog with validated room ID:', roomId);
    }
  }, [open, roomId]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    console.log('Video call dialog state changing to:', newOpen);
    if (!newOpen) {
      console.log('Closing video call dialog, room ID was:', roomId);
    }
    onOpenChange(newOpen);
  }, [onOpenChange, roomId]);

  if (!roomId) {
    console.error('No room ID provided to VideoCallDialog');
    toast.error("Unable to join video call", {
      description: "Missing room information"
    });
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "bg-background/95 backdrop-blur-lg p-0 overflow-hidden",
          isMobile 
            ? "fixed inset-0 w-screen h-screen max-w-none max-h-none rounded-none border-0" 
            : "w-[1024px] h-[600px] max-w-[90vw] max-h-[80vh]"
        )}
        style={{
          transform: isMobile ? 'none' : undefined,
          margin: isMobile ? 0 : undefined,
          zIndex: isMobile ? 100 : undefined,
          paddingTop: isMobile ? 'env(safe-area-inset-top)' : undefined,
          paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : undefined,
          paddingLeft: isMobile ? 'env(safe-area-inset-left)' : undefined,
          paddingRight: isMobile ? 'env(safe-area-inset-right)' : undefined
        }}
      >
        <DialogTitle className="sr-only">Video Call</DialogTitle>
        <DialogDescription className="sr-only">
          You are in an active video call with {recipientName}.
        </DialogDescription>
        
        {/* Close button wrapper */}
        <div className="absolute right-4 top-4 z-50">
          <button
            onClick={() => handleOpenChange(false)}
            className="rounded-full p-2 bg-background/80 hover:bg-background/90 transition-colors"
            aria-label="Close video call"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video content */}
        <div className="w-full h-full">
          <iframe
            src={`/video-call.html?${userParams}`}
            title="Video Call"
            className="w-full h-full border-0"
            allow="camera; microphone; clipboard-write; display-capture"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
