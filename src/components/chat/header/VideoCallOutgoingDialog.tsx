
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, X, PhoneOff } from "lucide-react";

interface Props {
  open: boolean;
  onCancel: () => void;
  loading: boolean;
  recipientName?: string;
}

export function VideoCallOutgoingDialog({
  open, onCancel, loading, recipientName
}: Props) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-sm flex flex-col items-center gap-6 text-center">
        <Video className="h-8 w-8 text-primary mx-auto mt-2 animate-pulse" />
        <div>
          <h2 className="font-semibold text-lg">
            Calling...
          </h2>
          <div className="mt-2">
            {recipientName
              ? <span>Waiting for <b>{recipientName}</b> to accept your call.</span>
              : "Waiting for recipient to accept the call."}
          </div>
        </div>
        <Button
          onClick={onCancel}
          disabled={loading}
          variant="destructive"
          className="flex gap-2 items-center w-full mt-4"
        >
          <PhoneOff className="h-4 w-4" />
          Cancel Call
        </Button>
      </DialogContent>
    </Dialog>
  );
}
