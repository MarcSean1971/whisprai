
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
}

export function VideoCallDialog({ open, onOpenChange, roomId }: VideoCallDialogProps) {
  // Make the dialog and iframe as large as possible within the viewport,
  // with a maximum width and height, and make iframe fill all available dialog space.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="
          max-w-5xl 
          w-full 
          h-[95vh] 
          max-h-[95vh] 
          p-0 
          overflow-hidden 
          flex 
          flex-col
        "
        style={{ margin: 0, padding: 0 }}
      >
        <div className="flex-grow w-full h-full">
          <iframe
            src={`/video-call.html?roomID=${roomId}`}
            title="Video Call"
            className="w-full h-full border-0 rounded"
            style={{ minHeight: 0, minWidth: 0, display: "block" }}
            allow="camera; microphone; clipboard-write; display-capture"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
