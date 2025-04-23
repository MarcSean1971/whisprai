
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useMessageSound } from "@/hooks/use-message-sound";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    let timeoutId: number;
    let stopRingtone: (() => void) | undefined;
    let intervalId: number;

    if (open) {
      // Start playing ringtone for both incoming and outgoing calls
      stopRingtone = playRingtoneSound();
      
      if (type === "incoming") {
        // Set timeout to auto-reject after 10 seconds for incoming calls
        timeoutId = window.setTimeout(() => {
          if (onReject) {
            console.log("Call auto-rejected after timeout");
            onReject();
          }
        }, 10000);

        // Update countdown timer
        intervalId = window.setInterval(() => {
          setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);
      }
    }

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
      if (stopRingtone) stopRingtone();
      setTimeLeft(10);
    };
  }, [open, type, onReject, playRingtoneSound]);

  if (!open) return null;

  const isIncoming = type === "incoming";

  return (
    <div 
      className={cn(
        "fixed top-16 left-0 right-0 mx-auto z-[100] max-w-xs",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "px-6 py-5 text-center rounded-xl",
        "border border-border/50 shadow-lg",
        "transition-all duration-300 ease-out",
        "animate-in zoom-in-95",
        "bg-gradient-to-br from-whispr-purple-light/20 to-whispr-purple/20"
      )}
    >
      {/* Icon with breathing animation */}
      <div className="relative w-12 h-12 mx-auto mb-4">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Phone className="h-6 w-6 text-primary animate-bounce" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="font-semibold text-lg text-foreground">
          {isIncoming ? "Incoming Call" : "Calling..."}
        </div>

        <div className="text-muted-foreground">
          {isIncoming
            ? name
              ? <><b className="text-foreground">{name}</b> is calling you</>
              : "Someone is calling you"
            : name
            ? <>Waiting for <b className="text-foreground">{name}</b> to answer</>
            : "Waiting for recipient to answer"}
        </div>

        {isIncoming && (
          <div className="text-sm text-muted-foreground">
            Auto-rejecting in {timeLeft}s
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3 w-full">
        {isIncoming ? (
          <>
            <Button
              onClick={onAccept}
              disabled={loading}
              className="flex-1 bg-whispr-emerald hover:bg-whispr-emerald-dark"
            >
              Accept
            </Button>
            <Button
              variant="outline"
              onClick={onReject}
              disabled={loading}
              className="flex-1 hover:bg-destructive hover:text-destructive-foreground"
            >
              Reject
            </Button>
          </>
        ) : (
          <Button
            onClick={onCancel}
            disabled={loading}
            variant="destructive"
            className="w-full"
          >
            Cancel Call
          </Button>
        )}
      </div>
    </div>
  );
}
