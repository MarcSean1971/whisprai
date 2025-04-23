
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
      <DialogContent className="max-w-xs flex flex-col gap-2 items-center text-center p-5">
        <div className="font-medium text-lg mb-2">Incoming Call</div>
        <div>
          {inviterName
            ? <><b>{inviterName}</b> is calling you.</>
            : "Someone is calling you."}
        </div>
        <div className="flex gap-2 w-full mt-4">
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
