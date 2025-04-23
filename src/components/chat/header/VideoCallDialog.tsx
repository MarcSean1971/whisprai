
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
}

export function VideoCallDialog({ open, onOpenChange, roomId }: VideoCallDialogProps) {
  // Revert to previous iframe/dialog configuration before the large dialog/iframe changes.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[90vw] h-[80vh] p-0 overflow-hidden flex flex-col no-scrollbar">
        <iframe
          src={`/video-call.html?roomID=${roomId}`}
          title="Video Call"
          className="w-full h-[70vh] border-0 rounded no-scrollbar"
          allow="camera; microphone; clipboard-write; display-capture"
        />
      </DialogContent>
    </Dialog>
  );
}
