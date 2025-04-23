
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
}

export function VideoCallDialog({ open, onOpenChange, roomId }: VideoCallDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl w-[90vw] max-h-[80vh] h-auto p-0 overflow-hidden flex flex-col no-scrollbar"
        style={{ height: "80vh" }}
      >
        <DialogTitle className="sr-only">Video Call</DialogTitle>
        <DialogDescription className="sr-only">
          You are in an active video call room.
        </DialogDescription>
        <iframe
          src={`/video-call.html?roomID=${roomId}`}
          title="Video Call"
          className="w-full h-full border-0 rounded no-scrollbar"
          allow="camera; microphone; clipboard-write; display-capture"
          style={{ minHeight: 0, minWidth: 0 }}
        />
      </DialogContent>
    </Dialog>
  );
}
