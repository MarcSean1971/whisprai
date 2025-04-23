
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useMessageSound } from "@/hooks/use-message-sound";

interface Props {
  open: boolean;
  type: "incoming" | "outgoing";
  name?: string;
  loading: boolean;
  onCancel?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}

export function DialingDialog({
  open,
  type,
  name,
  loading,
  onCancel,
  onAccept,
  onReject,
}: Props) {
  const { playRingtoneSound } = useMessageSound();

  useEffect(() => {
    let timeoutId: number;
    let stopRingtone: (() => void) | undefined;

    if (open && type === "incoming") {
      // Start playing ringtone
      stopRingtone = playRingtoneSound();
      
      // Set timeout to auto-reject after 10 seconds
      timeoutId = window.setTimeout(() => {
        if (onReject) {
          console.log("Call auto-rejected after timeout");
          onReject();
        }
      }, 10000);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      if (stopRingtone) {
        stopRingtone();
      }
    };
  }, [open, type, onReject, playRingtoneSound]);

  if (!open) return null;

  return (
    <div className="fixed top-16 left-0 right-0 mx-auto z-[100] max-w-xs bg-primary text-primary-foreground rounded-md px-4 py-4 text-center ring-2 ring-primary shadow-lg">
      <div className="font-medium text-lg">
        {type === "incoming" ? "Incoming Call" : "Calling..."}
      </div>
      <div className="mb-4">
        {type === "incoming"
          ? name
            ? <><b>{name}</b> is calling you.</>
            : "Someone is calling you."
          : name
          ? <>Waiting for <b>{name}</b> to answer.</>
          : "Waiting for recipient to answer."}
      </div>
      {type === "incoming" ? (
        <div className="flex gap-2 w-full">
          <Button
            onClick={onAccept}
            disabled={loading}
            className="flex-1"
          >
            Accept
          </Button>
          <Button
            variant="outline"
            onClick={onReject}
            disabled={loading}
            className="flex-1"
          >
            Reject
          </Button>
        </div>
      ) : (
        <Button
          onClick={onCancel}
          disabled={loading}
          variant="destructive"
          className="w-full"
        >
          Cancel
        </Button>
      )}
    </div>
  );
}
