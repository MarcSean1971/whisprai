
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";

interface Props {
  open: boolean;
  onRespond: (accept: boolean) => void;
  loading: boolean;
  inviterName?: string;
}

export function VideoCallInviteDialog({
  open, onRespond, loading, inviterName
}: Props) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-sm flex flex-col items-center gap-6 text-center">
        <Video className="h-8 w-8 text-primary mx-auto mt-2" />
        <div>
          <h2 className="font-semibold text-lg">
            Incoming Video Call
          </h2>
          <div className="mt-2">
            {inviterName
              ? <span><b>{inviterName}</b> is inviting you to a video call.</span>
              : "You have a new video call invitation."}
          </div>
        </div>
        <div className="flex gap-4 justify-center w-full mt-4">
          <Button
            onClick={() => onRespond(true)}
            disabled={loading}
            className="flex-1"
          >
            Accept
          </Button>
          <Button
            variant="outline"
            onClick={() => onRespond(false)}
            disabled={loading}
            className="flex-1"
          >
            Reject
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
