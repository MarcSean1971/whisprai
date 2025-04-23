
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/** Minimal banner for "incoming call" */
interface Props {
  open: boolean;
  onRespond: (accept: boolean) => void;
  loading: boolean;
  inviterName?: string;
}

export function VideoCallInviteDialog({
  open, onRespond, loading, inviterName
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed top-16 left-0 right-0 mx-auto z-[100] max-w-xs bg-primary text-primary-foreground rounded-md px-4 py-4 text-center ring-2 ring-primary shadow-lg">
      <div className="font-medium text-lg">Incoming Call</div>
      <div className="mb-4">
        {inviterName
          ? <><b>{inviterName}</b> is calling you.</>
          : "Someone is calling you."}
      </div>
      <div className="flex gap-2 w-full">
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
    </div>
  );
}
