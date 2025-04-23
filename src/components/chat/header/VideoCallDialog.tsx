
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 overflow-hidden flex flex-col no-scrollbar bg-background items-center justify-center",
          isMobile ? "fixed inset-0 w-screen h-screen max-w-none max-h-none rounded-none border-0" : "max-w-3xl w-[90vw] max-h-[80vh] h-auto"
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
        <div className="relative w-full h-full flex items-center justify-center">
          <iframe
            src={`/video-call.html?${userParams}`}
            title="Video Call"
            className="w-full h-full border-0 rounded-none"
            allow="camera; microphone; clipboard-write; display-capture"
            style={{ 
              flex: '1 1 auto',
              minHeight: '100%',
              minWidth: '100%',
              aspectRatio: 'auto'
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
