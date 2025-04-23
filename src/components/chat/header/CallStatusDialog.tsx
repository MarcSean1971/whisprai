import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
          "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]", 
          "max-w-xs w-full px-6 py-8 rounded-lg shadow-lg text-center animate-fade-in bg-primary text-primary-foreground relative ring-2 ring-primary"
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Phone className="h-5 w-5 animate-pulse" />
            <span className="font-semibold text-lg">
              {type === "dialing" ? "Calling..." : "Incoming Call"}
            </span>
          </div>
          <div className="mb-4 text-base">
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
