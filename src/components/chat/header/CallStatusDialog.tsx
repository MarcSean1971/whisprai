
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface CallStatusDialogProps {
  open: boolean;
  onCancel?: () => void;
  loading?: boolean;
  type: "dialing" | "incoming";
  name: string;
  disabled?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

export function CallStatusDialog({
  open,
  onCancel,
  loading,
  type,
  name,
  disabled,
  onAccept,
  onReject,
}: CallStatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className={cn(
          "max-w-xs w-full px-6 py-8 rounded-lg shadow-lg text-center bg-primary text-primary-foreground relative ring-2 ring-primary"
        )}
        aria-describedby="call-status-description"
      >
        <DialogTitle className="sr-only">
          {type === "dialing" ? "Outgoing Call" : "Incoming Call"}
        </DialogTitle>
        
        <div className="flex flex-col items-center gap-3">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Phone className="h-5 w-5 animate-pulse" />
            <span className="font-semibold text-lg">
              {type === "dialing" ? "Calling..." : "Incoming Call"}
            </span>
          </div>
          <div id="call-status-description" className="mb-4 text-base">
            {type === "dialing" ? (
              <>
                Waiting for <b>{name}</b> to answer.
              </>
            ) : (
              <>
                <b>{name}</b> is calling you.
              </>
            )}
          </div>
          {type === "dialing" ? (
            <Button
              onClick={onCancel}
              disabled={loading || disabled}
              variant="destructive"
              className="w-full"
            >
              <PhoneOff className="mr-1 h-4 w-4" />
              Cancel
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button
                onClick={onAccept}
                disabled={loading || disabled}
                className="flex-1"
                variant="default"
              >
                <Phone className="mr-1 h-4 w-4" />
                Accept
              </Button>
              <Button
                onClick={onReject}
                disabled={loading || disabled}
                className="flex-1"
                variant="destructive"
              >
                <PhoneOff className="mr-1 h-4 w-4" />
                Reject
              </Button>
            </div>
          )}
        </div>
        {loading && (
          <div className="absolute top-2 right-2">
            <Loader2 className="animate-spin h-5 w-5 opacity-60" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
