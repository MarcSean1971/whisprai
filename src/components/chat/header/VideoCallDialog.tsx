
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

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
          "p-0 overflow-hidden flex flex-col no-scrollbar bg-background",
          isMobile ? "w-screen h-screen max-w-none max-h-none rounded-none" : "max-w-3xl w-[90vw] max-h-[80vh] h-auto"
        )}
        style={{
          height: isMobile ? "100vh" : "80vh",
          marginTop: isMobile ? 0 : undefined,
          transform: isMobile ? 'none' : undefined,
          paddingTop: isMobile ? 'env(safe-area-inset-top)' : undefined,
          paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : undefined
        }}
      >
        <DialogTitle className="sr-only">Video Call</DialogTitle>
        <DialogDescription className="sr-only">
          You are in an active video call with {recipientName}.
        </DialogDescription>
        <iframe
          src={`/video-call.html?${userParams}`}
          title="Video Call"
          className="w-full h-full border-0 rounded-none"
          allow="camera; microphone; clipboard-write; display-capture"
          style={{ minHeight: 0, minWidth: 0 }}
        />
      </DialogContent>
    </Dialog>
  );
}
