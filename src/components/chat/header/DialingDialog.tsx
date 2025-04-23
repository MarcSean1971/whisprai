
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PhoneCall, X } from "lucide-react";

interface DialingDialogProps {
  open: boolean;
  name: string;
  type: "outgoing" | "incoming";
  loading?: boolean;
  onCancel?: () => void; // Used for Outgoing (Caller)
  onReject?: () => void; // Used for Incoming (Receiver)
  onAccept?: () => void; // Used for Incoming (Receiver)
}

export function DialingDialog({
  open,
  name,
  type,
  loading,
  onCancel,
  onReject,
  onAccept,
}: DialingDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        hideClose
        className="max-w-xs w-[91vw] rounded-lg shadow-lg bg-background border border-border animate-fade-in flex flex-col gap-5 items-center py-8"
        style={{ minWidth: 280 }}
      >
        <PhoneCall className="h-8 w-8 text-primary mb-2 animate-pulse" />
        <div className="font-semibold text-lg">
          {type === "outgoing" ? "Calling..." : "Incoming Call"}
        </div>
        <div className="text-muted-foreground text-center mb-2 text-base">
          {type === "outgoing"
            ? <>Waiting for <b>{name}</b> to answer.</>
            : <><b>{name}</b> is calling you.</>
          }
        </div>
        <div className="flex gap-2 w-full mt-2">
          {type === "incoming" && onAccept && (
            <Button
              onClick={onAccept}
              disabled={loading}
              className="flex-1"
              size="sm"
            >
              Accept
            </Button>
          )}
          <Button
            onClick={type === "outgoing" ? onCancel : onReject}
            disabled={loading}
            variant="destructive"
            className="flex-1"
            size="sm"
          >
            <X className="mr-2 h-4 w-4" />
            {type === "outgoing" ? "Cancel" : "Reject"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
